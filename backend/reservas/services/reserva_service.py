from django.db import transaction
from django.utils import timezone
from ..models import Reserva, HorarioDisponible

def crear_reserva_docente(usuario, horario, cantidad_alumnos, acepta_dj):
    """
    Lógica de negocio para crear una reserva.
    Asegura que no haya doble reserva mediante un bloqueo de base de datos (select_for_update).
    """
    with transaction.atomic():
        # Bloqueamos la fila del horario para que nadie más la modifique al mismo tiempo
        try:
            horario_db = HorarioDisponible.objects.select_for_update().get(pk=horario.id_horario)
        except HorarioDisponible.DoesNotExist:
            return None, "El horario ya no está disponible."

        # Validar si el estado del horario sigue libre
        if horario_db.estado != 'Disponible':
            return None, "Este horario ya fue reservado por otro usuario."

        # Verificamos que el laboratorio esté habilitado (Regla PBI-02)
        if not horario_db.id_laboratorio.habilitado:
            return None, "El laboratorio seleccionado se encuentra inhabilitado por falta de equipos."

        # Crear la reserva
        nueva_reserva = Reserva.objects.create(
            id_usuario=usuario,
            id_horario=horario_db,
            cantidad_alumnos=cantidad_alumnos,
            acepto_declaracion_jurada=acepta_dj,
            estado='Programada',
            created_at=timezone.now(),
            updated_at=timezone.now()
        )

        # Actualizar disponibilidad del horario
        horario_db.capacidad_ocupada += cantidad_alumnos
        if horario_db.capacidad_ocupada >= horario_db.capacidad_total:
            horario_db.estado = 'Completo'
        else:
            horario_db.estado = 'Completo' # En este flujo docente siempre se marca como completo
        horario_db.save()

        return nueva_reserva, None
