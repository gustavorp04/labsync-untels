import csv
from datetime import date, timedelta
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings
from django.db import transaction
from reservas.models import HorarioDisponible, Laboratorio, Reserva


class Command(BaseCommand):
    help = 'Elimina horarios vencidos sin reservas y genera nuevos para los próximos 14 días'

    BLOQUES = [
        ('08:00', '09:40'), ('09:40', '11:20'), ('11:20', '13:00'),
        ('13:00', '13:50'), ('13:50', '15:30'), ('15:30', '17:10'),
        ('17:10', '18:50'), ('18:50', '20:30'), ('20:30', '22:10'),
    ]

    DIAS_MAP = {
        'lunes': 0, 'martes': 1, 'miercoles': 2, 'miércoles': 2,
        'jueves': 3, 'viernes': 4, 'sabado': 5, 'sábado': 5,
    }

    def handle(self, *args, **options):
        hoy = date.today()

        self.stdout.write('Eliminando horarios vencidos sin reservas...')
        eliminados = self._eliminar_vencidos(hoy)
        self.stdout.write(self.style.WARNING(f'{eliminados} horarios vencidos eliminados.'))

        self.stdout.write('Leyendo horarios bloqueados del CSV...')
        bloqueados = self._cargar_bloqueados()

        self.stdout.write('Generando nuevos horarios para los próximos 14 días...')
        with transaction.atomic():
            creados = self._generar_horarios(hoy, bloqueados)
        self.stdout.write(self.style.SUCCESS(f'{creados} horarios nuevos generados.'))

    def _eliminar_vencidos(self, hoy):
        ids_con_reserva = Reserva.objects.values_list('id_horario_id', flat=True)
        qs = HorarioDisponible.objects.filter(
            fecha__lt=hoy,
            estado__in=['Disponible', 'Bloqueado'],
        ).exclude(id_horario__in=ids_con_reserva)
        count = qs.count()
        qs.delete()
        return count

    def _cargar_bloqueados(self):
        bloqueados = {}
        ruta_csv = Path(settings.BASE_DIR) / 'horarios.csv'
        if not ruta_csv.exists():
            self.stdout.write(
                self.style.WARNING(f'CSV no encontrado: {ruta_csv}. Todos los horarios serán Disponible.')
            )
            return bloqueados
        try:
            with open(ruta_csv, mode='r', encoding='utf-8', errors='replace') as f:
                f.readline()  # saltar encabezado
                reader = csv.reader(f, delimiter=';')
                for row in reader:
                    if len(row) < 7:
                        continue
                    lab_cod = row[0].strip()
                    dia_str = row[3].strip().lower()
                    h_inicio = row[4].strip()
                    estado_str = row[6].strip().lower()
                    if estado_str != 'bloqueado':
                        continue
                    if len(h_inicio) == 4 and h_inicio.find(':') == 1:
                        h_inicio = '0' + h_inicio
                    dia_num = self.DIAS_MAP.get(dia_str, -1)
                    if dia_num == -1:
                        continue
                    bloqueados.setdefault(lab_cod, {}).setdefault(dia_num, []).append(h_inicio)
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error leyendo CSV: {e}'))
        return bloqueados

    def _generar_horarios(self, hoy, bloqueados):
        labs = list(Laboratorio.objects.all())
        horarios = []
        for i in range(14):
            fecha = hoy + timedelta(days=i)
            if fecha.weekday() == 6:  # domingo
                continue
            dia_sem = fecha.weekday()
            for lab in labs:
                for inicio, fin in self.BLOQUES:
                    if (lab.codigo_patrimonio in bloqueados
                            and dia_sem in bloqueados[lab.codigo_patrimonio]
                            and inicio in bloqueados[lab.codigo_patrimonio][dia_sem]):
                        estado = 'Bloqueado'
                        cap_ocupada = lab.aforo_maximo
                    else:
                        estado = 'Disponible'
                        cap_ocupada = 0
                    horarios.append(HorarioDisponible(
                        id_laboratorio=lab,
                        fecha=fecha,
                        hora_inicio=inicio,
                        hora_fin=fin,
                        capacidad_total=lab.aforo_maximo,
                        capacidad_ocupada=cap_ocupada,
                        estado=estado,
                    ))
        creados = HorarioDisponible.objects.bulk_create(horarios, ignore_conflicts=True)
        return len(creados)
