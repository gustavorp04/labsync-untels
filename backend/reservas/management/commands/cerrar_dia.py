from django.core.management.base import BaseCommand
from reservas.services import reserva_service

class Command(BaseCommand):
    help = 'PBI-06: Cierra el día de reservas marcando como No-Show las programadas no asistidas.'

    def handle(self, *args, **options):
        self.stdout.write("Iniciando proceso de cierre de día...")
        
        # 1. Purgar alumnos que no llegaron al quórum en 5 min
        purgados = reserva_service.purgar_pendientes_vencidos()
        if purgados > 0:
            self.stdout.write(self.style.WARNING(f"{purgados} reservas de alumnos expiraron por falta de quórum."))

        # 2. Cerrar reservas de días pasados o turnos terminados
        count = reserva_service.cerrar_dia_reservas()
        self.stdout.write(self.style.SUCCESS(f"Proceso finalizado. {count} reservas marcadas como No-Show."))
