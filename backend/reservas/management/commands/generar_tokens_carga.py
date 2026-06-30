"""Genera tokens de sesión para la prueba de carga (Locust) reutilizando las
cuentas EXT001-EXT050 (ver backend/scripts sql/seed_usuarios_externos.sql).

Crea sesiones directamente en SesionUsuario (sin pasar por el endpoint de
login) para no disparar el rate-limit de 5/min por IP. Si se pide más
sesiones que cuentas EXT existentes, las cuentas se reciclan generando un
token distinto por sesión.

Los tokens en claro se vuelcan a backend/tokens_carga.csv (columnas
id_usuario,token) para que el locustfile autentique vía
`Authorization: Bearer <token>`.

Es idempotente: cada corrida borra las sesiones EXT previas y crea unas nuevas.

Uso:
    python manage.py generar_tokens_carga
    # opciones: --count 200  --horas 4  --out /ruta/tokens_carga.csv
"""
import csv
import itertools
import secrets
from datetime import timedelta
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from reservas.models import Usuario, SesionUsuario
from reservas.utils.auth import hash_session_token

# backend/tokens_carga.csv (parents[3] == raíz del proyecto backend)
DEFAULT_OUT_PATH = Path(__file__).resolve().parents[3] / "tokens_carga.csv"


class Command(BaseCommand):
    help = "Crea sesiones de carga para las cuentas EXT001-EXT050 y vuelca sus tokens a CSV."

    def add_arguments(self, parser):
        parser.add_argument("--count", type=int, default=200,
                            help="Cantidad de sesiones/tokens a generar (default 200).")
        parser.add_argument("--horas", type=int, default=4,
                            help="Horas hasta la expiración de cada sesión (default 4).")
        parser.add_argument("--out", type=str, default=str(DEFAULT_OUT_PATH),
                            help="Ruta del CSV de tokens (default backend/tokens_carga.csv).")

    def handle(self, *args, **opts):
        count = opts["count"]
        horas = opts["horas"]
        out_path = Path(opts["out"])
        ahora = timezone.now()

        usuarios_ext = list(
            Usuario.objects.filter(codigo_universitario__startswith="EXT")
            .order_by("codigo_universitario")
        )
        if not usuarios_ext:
            raise CommandError(
                "No se encontraron cuentas EXT. Ejecuta primero "
                "backend/scripts sql/seed_usuarios_externos.sql."
            )

        # Idempotente: limpiar sesiones de carga previas de estas cuentas.
        SesionUsuario.objects.filter(id_usuario__in=usuarios_ext).delete()

        ciclo_usuarios = itertools.cycle(usuarios_ext)
        fecha_expiracion = ahora + timedelta(hours=horas)

        filas = []
        sesiones = []
        for _ in range(count):
            usuario = next(ciclo_usuarios)
            raw_token = secrets.token_hex(32)
            sesiones.append(SesionUsuario(
                id_usuario=usuario,
                token=hash_session_token(raw_token),
                fecha_expiracion=fecha_expiracion,
            ))
            filas.append((usuario.id_usuario, raw_token))

        SesionUsuario.objects.bulk_create(sesiones)

        out_path.parent.mkdir(parents=True, exist_ok=True)
        with out_path.open("w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["id_usuario", "token"])
            writer.writerows(filas)

        self.stdout.write(self.style.SUCCESS(
            f"\nOK — {count} sesiones creadas a partir de {len(usuarios_ext)} cuentas EXT "
            f"(expiran en {horas}h).\nTokens escritos en: {out_path}"
        ))
