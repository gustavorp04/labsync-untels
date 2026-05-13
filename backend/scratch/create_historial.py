import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

sql = """
CREATE TABLE IF NOT EXISTS HISTORIAL_RESERVA (
    id_historial     SERIAL       PRIMARY KEY,
    id_reserva       INT          NOT NULL REFERENCES RESERVA(id_reserva) ON DELETE CASCADE,
    estado_anterior  VARCHAR(20)  NOT NULL,
    estado_nuevo     VARCHAR(20)  NOT NULL,
    fecha_cambio     TIMESTAMP    NOT NULL DEFAULT NOW(),
    usuario_cambio   INT          REFERENCES USUARIO(id_usuario) ON DELETE SET NULL,
    observacion      TEXT
);
"""

try:
    with connection.cursor() as cursor:
        cursor.execute(sql)
    print("Tabla HISTORIAL_RESERVA creada o ya existente.")
except Exception as e:
    print(f"Error: {e}")
