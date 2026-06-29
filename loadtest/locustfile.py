"""Prueba de carga y concurrencia de LabSync UNTELS — corre en LOCAL.

Antes de ejecutar:
  1) Levanta el stack:        docker-compose up -d --build
  2) Prepara datos+tokens:    docker exec -it labsync_backend python manage.py seed_carga
     (genera backend/loadtest_tokens.json)
  3) Instala locust:          pip install -r loadtest/requirements.txt

Dos escenarios (elige la clase al lanzar):

  # A) CARGA — mide cuánto aguanta (lecturas + reservas a equipos variados)
  locust -f loadtest/locustfile.py CargaUser --host http://localhost:8000

  # B) CONCURRENCIA — 200 usuarios reservan el MISMO equipo: solo 1 debe ganar,
  #    el resto recibe 409. Prueba que el SELECT FOR UPDATE evita doble reserva.
  locust -f loadtest/locustfile.py ConcurrenciaUser --host http://localhost:8000 --headless -u 200 -r 200 -t 1m

Autentica con `Authorization: Bearer <token>` (tokens pre-creados por seed_carga),
así NO pega al endpoint de login y evita el throttle de 5/min por IP.
"""
import itertools
import json
import os
import random
import threading
from pathlib import Path

from locust import HttpUser, task, between, events

# --- Carga de tokens generados por `manage.py seed_carga` --------------------
_DEFAULT = Path(__file__).resolve().parent.parent / "backend" / "loadtest_tokens.json"
TOKENS_FILE = Path(os.environ.get("TOKENS_FILE", _DEFAULT))

try:
    _DATA = json.loads(TOKENS_FILE.read_text(encoding="utf-8"))
except FileNotFoundError:
    raise SystemExit(
        f"\nNo se encontró {TOKENS_FILE}.\n"
        f"Ejecuta primero:  docker exec -it labsync_backend python manage.py seed_carga\n"
    )

LAB_ID = _DATA["lab_id"]
HORARIO_ID = _DATA["horario_id"]
ACTIVOS = _DATA["activos"]
USUARIOS = _DATA["usuarios"]

# Reparte un token distinto a cada usuario virtual (cicla si hay más VUs que tokens).
_iter_lock = threading.Lock()
_user_cycle = itertools.cycle(USUARIOS)


def _siguiente_usuario():
    with _iter_lock:
        return next(_user_cycle)


@events.test_start.add_listener
def _aviso(environment, **kwargs):
    print(f"[loadtest] lab={LAB_ID} horario={HORARIO_ID} "
          f"equipos={len(ACTIVOS)} tokens={len(USUARIOS)}")


class _BaseUser(HttpUser):
    """Comportamiento común: autenticación Bearer + cabeceras."""
    abstract = True
    wait_time = between(1, 3)

    def on_start(self):
        u = _siguiente_usuario()
        self.uid = u["id_usuario"]
        self.client.headers.update({
            "Authorization": f"Bearer {u['token']}",
            "X-Requested-With": "XMLHttpRequest",  # inocuo; el middleware ya exime a Bearer
            "Content-Type": "application/json",
        })

    def _post_reserva(self, id_activo):
        # 201 = creada · 409 = regla de negocio (equipo tomado / ya reservó) → esperado
        with self.client.post(
            f"/api/v1/usuarios/{self.uid}/reservas/",
            name="POST reserva",
            json={
                "id_horario": HORARIO_ID,
                "id_activo": id_activo,
                "acepto_declaracion_jurada": True,
            },
            catch_response=True,
        ) as resp:
            if resp.status_code in (201, 409):
                resp.success()
            else:
                resp.failure(f"HTTP {resp.status_code}: {resp.text[:200]}")


class CargaUser(_BaseUser):
    """Escenario A — carga realista: mayormente lecturas, algunas reservas."""

    @task(4)
    def ver_horarios(self):
        self.client.get(f"/api/v1/laboratorios/{LAB_ID}/horarios/", name="GET horarios")

    @task(2)
    def ver_mapa_equipos(self):
        self.client.get(
            f"/api/v1/laboratorios/{LAB_ID}/activos/?id_horario={HORARIO_ID}",
            name="GET activos",
        )

    @task(1)
    def reservar(self):
        self._post_reserva(random.choice(ACTIVOS))


class ConcurrenciaUser(_BaseUser):
    """Escenario B — todos pelean por el MISMO equipo. Verifica que no haya
    doble reserva: solo una respuesta 201, el resto 409."""

    @task
    def reservar_mismo_equipo(self):
        self._post_reserva(ACTIVOS[0])
