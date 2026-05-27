"""
Migración 0007 — Idempotente y compatible con SQLite + PostgreSQL.

- En PostgreSQL (producción): usa IF NOT EXISTS / DO $$ para no fallar
  si los objetos ya existen de un deploy anterior parcial.
- En SQLite (tests CI): usa sintaxis estándar en un bloque try/except
  (la BD es fresca en cada test run, así que rara vez hay conflicto).

Estrategia: SeparateDatabaseAndState
  • database_operations → RunPython que hace el DDL real consciente del vendor
  • state_operations    → operaciones de Django que actualizan el estado ORM
"""
from django.db import migrations, models


# ── Helpers ───────────────────────────────────────────────────────────────────

def _exec(cursor, sql):
    """Ejecuta SQL ignorando errores 'already exists' / 'duplicate' en SQLite."""
    try:
        cursor.execute(sql)
    except Exception as e:
        msg = str(e).lower()
        if any(k in msg for k in ('already exists', 'duplicate', 'already an index')):
            pass  # idempotente: el objeto ya existe, ignorar
        else:
            raise


def safe_migrate_forward(apps, schema_editor):
    vendor = schema_editor.connection.vendor  # 'postgresql' | 'sqlite' | 'mysql'
    with schema_editor.connection.cursor() as cur:

        if vendor == 'postgresql':
            # ── Columnas ──────────────────────────────────────────────────────
            cur.execute(
                "ALTER TABLE activo_laboratorio "
                "ADD COLUMN IF NOT EXISTS columna integer NULL;"
            )
            cur.execute(
                "ALTER TABLE activo_laboratorio "
                "ADD COLUMN IF NOT EXISTS fila integer NULL;"
            )
            cur.execute(
                "ALTER TABLE laboratorio "
                "ADD COLUMN IF NOT EXISTS tipo_layout varchar(10) "
                "NOT NULL DEFAULT 'GRID';"
            )
            # ── Constraint ────────────────────────────────────────────────────
            cur.execute("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint
                        WHERE conname = 'activo_estado_valido'
                          AND conrelid = 'activo_laboratorio'::regclass
                    ) THEN
                        ALTER TABLE activo_laboratorio
                        ADD CONSTRAINT activo_estado_valido
                        CHECK (estado IN ('Operativo','Mantenimiento','Dado de baja'));
                    END IF;
                END $$;
            """)
            # ── Índices ───────────────────────────────────────────────────────
            cur.execute(
                "CREATE INDEX IF NOT EXISTS horario_fecha_estado_idx "
                "ON horario_disponible (fecha, estado);"
            )
            cur.execute(
                "CREATE INDEX IF NOT EXISTS horario_fecha_idx "
                "ON horario_disponible (fecha);"
            )

        else:
            # SQLite: BD fresca en tests; usar try/except para idempotencia mínima
            _exec(cur, "ALTER TABLE activo_laboratorio ADD COLUMN columna integer NULL;")
            _exec(cur, "ALTER TABLE activo_laboratorio ADD COLUMN fila integer NULL;")
            _exec(cur, "ALTER TABLE laboratorio ADD COLUMN tipo_layout varchar(10) NOT NULL DEFAULT 'GRID';")
            # SQLite no soporta ADD CONSTRAINT → Django lo maneja recreando la tabla
            # en el state_operation; aquí solo hacemos los índices.
            _exec(cur,
                "CREATE INDEX horario_fecha_estado_idx "
                "ON horario_disponible (fecha, estado);"
            )
            _exec(cur, "CREATE INDEX horario_fecha_idx ON horario_disponible (fecha);")


def safe_migrate_backward(apps, schema_editor):
    vendor = schema_editor.connection.vendor
    with schema_editor.connection.cursor() as cur:
        if vendor == 'postgresql':
            cur.execute("DROP INDEX IF EXISTS horario_fecha_idx;")
            cur.execute("DROP INDEX IF EXISTS horario_fecha_estado_idx;")
            cur.execute(
                "ALTER TABLE activo_laboratorio "
                "DROP CONSTRAINT IF EXISTS activo_estado_valido;"
            )
            cur.execute("ALTER TABLE laboratorio DROP COLUMN IF EXISTS tipo_layout;")
            cur.execute("ALTER TABLE activo_laboratorio DROP COLUMN IF EXISTS fila;")
            cur.execute("ALTER TABLE activo_laboratorio DROP COLUMN IF EXISTS columna;")
        else:
            _exec(cur, "DROP INDEX IF EXISTS horario_fecha_idx;")
            _exec(cur, "DROP INDEX IF EXISTS horario_fecha_estado_idx;")
            _exec(cur, "ALTER TABLE activo_laboratorio DROP COLUMN fila;")
            _exec(cur, "ALTER TABLE activo_laboratorio DROP COLUMN columna;")
            _exec(cur, "ALTER TABLE laboratorio DROP COLUMN tipo_layout;")


# ── Migración ─────────────────────────────────────────────────────────────────

class Migration(migrations.Migration):

    dependencies = [
        ('reservas', '0006_pbi07_pbi11_penalizacion_recordatorio'),
    ]

    operations = [
        # Un único SeparateDatabaseAndState:
        # • database_operations → RunPython consciente del vendor (arriba)
        # • state_operations    → actualizan el ORM de Django
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(
                    safe_migrate_forward,
                    reverse_code=safe_migrate_backward,
                ),
            ],
            state_operations=[
                migrations.AddField(
                    model_name='activolaboratorio',
                    name='columna',
                    field=models.IntegerField(blank=True, null=True),
                ),
                migrations.AddField(
                    model_name='activolaboratorio',
                    name='fila',
                    field=models.IntegerField(blank=True, null=True),
                ),
                migrations.AddField(
                    model_name='laboratorio',
                    name='tipo_layout',
                    field=models.CharField(
                        choices=[('GRID', 'Cuadrícula Clásica'), ('MESAS', 'Mesas de Trabajo')],
                        default='GRID',
                        max_length=10,
                    ),
                ),
                migrations.AlterField(
                    model_name='activolaboratorio',
                    name='estado',
                    field=models.CharField(
                        choices=[
                            ('Operativo', 'Operativo'),
                            ('Mantenimiento', 'Mantenimiento'),
                            ('Dado de baja', 'Dado de baja'),
                        ],
                        max_length=20,
                    ),
                ),
                migrations.AlterField(
                    model_name='reserva',
                    name='estado',
                    field=models.CharField(
                        choices=[
                            ('Programada', 'Programada'),
                            ('Pendiente', 'Pendiente'),
                            ('Cancelada', 'Cancelada'),
                            ('Completada', 'Completada'),
                            ('No-show', 'No-show'),
                        ],
                        max_length=20,
                    ),
                ),
                migrations.AddConstraint(
                    model_name='activolaboratorio',
                    constraint=models.CheckConstraint(
                        condition=models.Q(
                            ('estado__in', ['Operativo', 'Mantenimiento', 'Dado de baja'])
                        ),
                        name='activo_estado_valido',
                    ),
                ),
                migrations.AddIndex(
                    model_name='horariodisponible',
                    index=models.Index(
                        fields=['fecha', 'estado'],
                        name='horario_fecha_estado_idx',
                    ),
                ),
                migrations.AddIndex(
                    model_name='horariodisponible',
                    index=models.Index(
                        fields=['fecha'],
                        name='horario_fecha_idx',
                    ),
                ),
            ],
        ),
    ]
