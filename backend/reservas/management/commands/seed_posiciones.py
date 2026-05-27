import sys
from django.core.management.base import BaseCommand
from reservas.models import Laboratorio, ActivoLaboratorio

class Command(BaseCommand):
    help = 'Asigna posiciones iniciales (fila, columna) y tipo de layout a todos los laboratorios basados en sus distribuciones reales.'

    def handle(self, *args, **kwargs):
        # 1. Mapas Base (Coordenadas)
        
        # Bloque Sólido (Ej: A1-1, A2-3) - 6 Filas x 5 Columnas
        mapa_solido = [(f, c) for f in range(1, 7) for c in range(1, 6)]
        
        # Bloque con pasillo (Ej: C2-2A) - Salta la columna 4
        mapa_pasillo = []
        for f in range(1, 6):
            for c in [1, 2, 3,  5, 6, 7]:
                mapa_pasillo.append((f, c))

        # Bloque Irregular 20 (Ej: C2-3, C2-4, C3-3, B1-4)
        mapa_irreg_20 = [
            (1,2), (1,3), (1,4),    (1,6), (1,7), (1,8),
            (2,2), (2,3), (2,4),    (2,6), (2,7), (2,8),
            (3,1), (3,2), (3,3), (3,4),    (3,6), (3,7), (3,8), (3,9)
        ]

        # Mapa Mesas (FIS-G1, ELE-AD) - Coordenadas en anillo alrededor de huecos
        mapa_mesas = [
            # Mesa Superior Izquierda
            (1,2), (1,3), (2,4), (3,3), (3,2), (2,1),
            # Mesa Superior Derecha
            (1,7), (1,8), (2,9), (3,8), (3,7), (2,6),
            # Mesa Inferior Izquierda (con 7 espacios a veces)
            (5,2), (5,3), (6,4), (7,4), (7,3), (7,2), (6,1),
            # Mesa Inferior Derecha
            (5,7), (5,8), (6,9), (7,8), (7,7), (6,6)
        ]
        
        laboratorios = Laboratorio.objects.all()
        activos_actualizados = 0

        for lab in laboratorios:
            nombre = lab.nombre.upper()
            
            # 2. Determinar la topología del laboratorio
            if 'FIS' in nombre or 'ELE' in nombre:
                lab.tipo_layout = 'MESAS'
                mapa_usar = mapa_mesas + mapa_solido # fallback por si hay más PCs
            else:
                lab.tipo_layout = 'GRID'
                if nombre in ['C2-3', 'C2-4', 'C3-3', 'B1-4']:
                    mapa_usar = mapa_irreg_20 + mapa_solido
                elif 'C' in nombre or 'C1-2B' in nombre:
                    mapa_usar = mapa_pasillo + mapa_solido
                else:
                    mapa_usar = mapa_solido
            
            lab.save()

            # 3. Asignar las coordenadas a los activos existentes
            activos = ActivoLaboratorio.objects.filter(id_laboratorio=lab).order_by('id_activo')
            for i, activo in enumerate(activos):
                if i < len(mapa_usar):
                    # Solo asignar si no tiene posición previa
                    if activo.fila is None or activo.columna is None:
                        activo.fila = mapa_usar[i][0]
                        activo.columna = mapa_usar[i][1]
                        activo.save()
                        activos_actualizados += 1
            
            self.stdout.write(self.style.SUCCESS(f'OK: {nombre} -> {lab.tipo_layout} ({activos.count()} computadoras mapeadas)'))
        
        self.stdout.write(self.style.SUCCESS(f'\\n¡Éxito! Se han posicionado {activos_actualizados} computadoras en total.'))
