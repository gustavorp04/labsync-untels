import os
import logging
from django.apps import AppConfig

logger = logging.getLogger('reservas')


class ReservasConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'reservas'

    def ready(self):
        """Scheduler automático de tareas periódicas.

        Activado SOLO si ENABLE_SCHEDULER=true en el entorno.
        - docker-compose (dev): ENABLE_SCHEDULER=true → 1 proceso runserver → seguro.
        - Cloud Run (prod): ENABLE_SCHEDULER no definida → scheduler desactivado.
          Con gunicorn --workers 4, activarlo aquí crearía 4 schedulers duplicados.
          En producción usa Cloud Scheduler para llamar a los endpoints REST o
          activa ENABLE_SCHEDULER=true solo en una instancia dedicada.

        Jobs registrados:
          • cerrar_dia_reservas          — 23:59 Lima  (No-show + PBI-07 penalización)
          • purgar_pendientes_vencidos   — cada 5 min  (quórum expirado)
          • enviar_recordatorios_24h     — 08:00 Lima  (PBI-11 recordatorios)
          • notificar_penalizaciones_exp — cada 1 hora (PBI-07 aviso levantamiento)
        """
        if os.environ.get('ENABLE_SCHEDULER', '').lower() != 'true':
            return

        # En dev (runserver), Django llama ready() dos veces por el autoreloader.
        # Solo arrancamos en el proceso hijo para no duplicar jobs.
        if os.environ.get('RUN_MAIN') == 'false':
            return

        try:
            from apscheduler.schedulers.background import BackgroundScheduler
            from apscheduler.triggers.cron import CronTrigger
            from apscheduler.triggers.interval import IntervalTrigger

            from .services.reserva_service import (
                cerrar_dia_reservas,
                purgar_pendientes_vencidos,
                enviar_recordatorios_24h,          # PBI-11
                notificar_penalizaciones_expiradas, # PBI-07
            )

            scheduler = BackgroundScheduler(timezone='America/Lima')

            # ── Jobs existentes ──────────────────────────────────────────────

            # Cierre diario: todos los días a las 23:59 (marca No-show + penaliza)
            scheduler.add_job(
                cerrar_dia_reservas,
                CronTrigger(hour=23, minute=59),
                id='cerrar_dia_reservas',
                replace_existing=True,
            )

            # Purga de pendientes: cada 5 minutos (expira quórum no alcanzado)
            scheduler.add_job(
                purgar_pendientes_vencidos,
                IntervalTrigger(minutes=5),
                id='purgar_pendientes_vencidos',
                replace_existing=True,
            )

            # ── PBI-11: Recordatorios 24h ────────────────────────────────────
            # Se ejecuta cada día a las 08:00 hora Lima.
            # RecordatorioEnviado (unique_together) garantiza que no haya duplicados
            # aunque el job se ejecute varias veces.
            scheduler.add_job(
                enviar_recordatorios_24h,
                CronTrigger(hour=8, minute=0),
                id='enviar_recordatorios_24h',
                replace_existing=True,
            )

            # ── PBI-07: Notificación de penalización levantada ───────────────
            # Cada hora revisa si hay penalizaciones vencidas sin notificar.
            scheduler.add_job(
                notificar_penalizaciones_expiradas,
                IntervalTrigger(hours=1),
                id='notificar_penalizaciones_expiradas',
                replace_existing=True,
            )

            scheduler.start()
            logger.info(
                "Scheduler iniciado: cerrar_dia_reservas (23:59) | "
                "purgar_pendientes (5 min) | "
                "recordatorios_24h (08:00) | "       # PBI-11
                "notif_pen_expiradas (1 h)"           # PBI-07
            )

        except ImportError:
            logger.warning(
                "APScheduler no instalado. Instala con: pip install apscheduler"
            )
        except Exception as exc:
            logger.error(f"Error al iniciar el scheduler: {exc}")
