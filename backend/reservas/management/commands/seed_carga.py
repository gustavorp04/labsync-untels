"""Prepara datos para la prueba de carga (Locust) — ver carpeta loadtest/.

Crea N estudiantes de prueba, asegura un laboratorio habilitado con suficientes
equipos operativos y un horario reservable, y abre una sesión de larga duración
por cada estudiante. Los tokens en claro se vuelcan a `loadtest/tokens.json` para
que el locustfile autentique vía `Authorization: Bearer` y así NO golpee el
endpoint de login (que está limitado a 5/min por IP y rompería el test).

Es idempotente: se puede re-ejecutar; refresca los tokens en cada corrida.

El JSON se escribe en `backend/loadtest_tokens.json` porque docker-compose solo
monta `./backend` dentro del contenedor; así el archivo aparece en el host y el
locustfile (que corre en el host) puede leerlo.

Uso:
    docker exec -it labsync_backend python manage.py seed_carga
    # opciones: --count 200  --activos 300  --dias 2  --out /ruta/archivo.json
"""
import json
import secrets
from datetime import timedelta, time
from pathlib import Path

from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from django.utils import timezone

from reservas.models import (
    Rol, Facultad, Carrera, Usuario, PerfilEstudiante,
    Laboratorio, TipoLaboratorio, TipoActivo, CategoriaActivo,
    ActivoLaboratorio, HorarioDisponible, SesionUsuario,
)
from reservas.utils.auth import hash_session_token

PASSWORD = "LoadTest_2026"
# backend/loadtest_tokens.json  (parents[3] == raíz del proyecto backend == /app en Docker)
DEFAULT_TOKENS_PATH = Path(__file__).resolve().parents[3] / "loadtest_tokens.json"


class Command(BaseCommand):
    help = "Crea estudiantes/equipos/horario y tokens para la prueba de carga (Locust)."

    def add_arguments(self, parser):
        parser.add_argument("--count", type=int, default=200,
                            help="Cantidad de estudiantes de prueba (default 200).")
        parser.add_argument("--activos", type=int, default=300,
                            help="Equipos operativos mínimos en el laboratorio (default 300).")
        parser.add_argument("--dias", type=int, default=2,
                            help="Días en el futuro para el horario reservable (default 2, >=1 por la regla de 24h).")
        parser.add_argument("--out", type=str, default=str(DEFAULT_TOKENS_PATH),
                            help="Ruta del JSON de tokens (default backend/loadtest_tokens.json).")

    def handle(self, *args, **opts):
        count = opts["count"]
        n_activos = opts["activos"]
        dias = max(1, opts["dias"])
        tokens_path = Path(opts["out"])
        ahora = timezone.now()

        # 1) Rol estudiante --------------------------------------------------
        rol_est, _ = Rol.objects.get_or_create(nombre="estudiante")

        # 2) Facultad + Carrera (reutiliza las existentes si las hay) --------
        carrera = Carrera.objects.first()
        if carrera is None:
            facultad, _ = Facultad.objects.get_or_create(nombre="Facultad de Ingeniería (Carga)")
            carrera = Carrera.objects.create(id_facultad=facultad, nombre="Ingeniería de Sistemas")

        # 3) Laboratorio habilitado -----------------------------------------
        lab = Laboratorio.objects.filter(habilitado=True).order_by("id_laboratorio").first()
        if lab is None:
            tipo_lab, _ = TipoLaboratorio.objects.get_or_create(
                nombre="Cómputo (Carga)",
                defaults={"min_equipos": 1, "tipo_equipo_minimo": "CPU"},
            )
            facultad = Facultad.objects.first() or Facultad.objects.create(nombre="Facultad (Carga)")
            lab = Laboratorio.objects.create(
                id_tipo=tipo_lab, id_facultad=facultad,
                nombre="Lab Carga A1", codigo_patrimonio="CARGA-A1",
                aforo_maximo=max(n_activos, count), habilitado=True, tipo_layout="GRID",
            )
        self.stdout.write(f"Laboratorio de prueba: id={lab.id_laboratorio} · {lab.nombre}")

        # 4) Equipos operativos suficientes ---------------------------------
        tipo_activo = TipoActivo.objects.first()
        if tipo_activo is None:
            categoria, _ = CategoriaActivo.objects.get_or_create(nombre="Cómputo (Carga)")
            tipo_activo = TipoActivo.objects.create(id_categoria=categoria, nombre="CPU")

        operativos = list(
            ActivoLaboratorio.objects.filter(id_laboratorio=lab, estado="Operativo")
            .values_list("id_activo", flat=True)
        )
        faltan = n_activos - len(operativos)
        if faltan > 0:
            base = ActivoLaboratorio.objects.count()
            nuevos = []
            for i in range(faltan):
                nuevos.append(ActivoLaboratorio(
                    id_laboratorio=lab, id_tipo_activo=tipo_activo,
                    num_serie=f"CARGA-SN-{base + i + 1:05d}",
                    codigo_patrimonio=f"CARGA-CP-{base + i + 1:05d}",
                    estado="Operativo", updated_at=ahora,
                ))
            ActivoLaboratorio.objects.bulk_create(nuevos, batch_size=500)
            operativos = list(
                ActivoLaboratorio.objects.filter(id_laboratorio=lab, estado="Operativo")
                .values_list("id_activo", flat=True)
            )
        self.stdout.write(f"Equipos operativos disponibles: {len(operativos)}")

        # 5) Horario reservable (>= 24h en el futuro) -----------------------
        fecha = (timezone.localtime(ahora) + timedelta(days=dias)).date()
        horario, creado = HorarioDisponible.objects.get_or_create(
            id_laboratorio=lab, fecha=fecha, hora_inicio=time(8, 0),
            defaults={
                "hora_fin": time(10, 0),
                "capacidad_total": max(count, n_activos),
                "capacidad_ocupada": 0,
                "estado": "Disponible",
            },
        )
        if not creado:
            # Asegurar que esté abierto y con aforo amplio para el test
            horario.capacidad_total = max(count, n_activos)
            horario.capacidad_ocupada = 0
            horario.estado = "Disponible"
            horario.save(update_fields=["capacidad_total", "capacidad_ocupada", "estado"])
        self.stdout.write(f"Horario reservable: id={horario.id_horario} · {fecha} 08:00-10:00")

        # 6) Estudiantes + perfiles + sesiones (tokens) ---------------------
        pwd_hash = make_password(PASSWORD)
        usuarios_payload = []
        # Limpiar sesiones de carga previas para no acumular basura
        codigos = [f"LOAD{i:04d}" for i in range(1, count + 1)]
        SesionUsuario.objects.filter(id_usuario__codigo_universitario__in=codigos).delete()

        for i in range(1, count + 1):
            codigo = f"LOAD{i:04d}"
            usuario, _ = Usuario.objects.get_or_create(
                codigo_universitario=codigo,
                defaults={
                    "id_rol": rol_est,
                    "nombre": f"Estudiante Carga {i:04d}",
                    "email": f"{codigo.lower()}@carga.untels.test",
                    "password_hash": pwd_hash,
                    "created_at": ahora,
                },
            )
            PerfilEstudiante.objects.get_or_create(
                id_usuario=usuario,
                defaults={"id_carrera": carrera, "ciclo": 5},
            )
            raw_token = secrets.token_hex(32)
            SesionUsuario.objects.create(
                id_usuario=usuario,
                token=hash_session_token(raw_token),
                fecha_expiracion=ahora + timedelta(days=30),
            )
            usuarios_payload.append({
                "id_usuario": usuario.id_usuario,
                "codigo": codigo,
                "token": raw_token,
            })

        # 7) Volcar tokens.json para el locustfile --------------------------
        tokens_path.parent.mkdir(parents=True, exist_ok=True)
        tokens_path.write_text(json.dumps({
            "lab_id": lab.id_laboratorio,
            "horario_id": horario.id_horario,
            "activos": operativos,
            "password": PASSWORD,
            "usuarios": usuarios_payload,
        }, indent=2), encoding="utf-8")

        self.stdout.write(self.style.SUCCESS(
            f"\nOK — {count} estudiantes, {len(operativos)} equipos, horario {horario.id_horario}.\n"
            f"Tokens escritos en: {tokens_path}\n"
            f"Ahora ejecuta Locust (ver loadtest/README.md)."
        ))
