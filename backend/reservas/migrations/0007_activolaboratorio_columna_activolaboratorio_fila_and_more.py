"""
Migración 0007 — Reescrita para ser IDEMPOTENTE.

Problema original: AddField / AddConstraint / AddIndex fallan con
"already exists" si la BD de producción ya tiene esos objetos (ej.
si la migración se aplicó parcialmente en un deploy anterior).

Solución: SeparateDatabaseAndState + RunSQL con IF NOT EXISTS / DO $$
garantizan que siempre se aplique sin error, sin importar el estado previo.
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reservas', '0006_pbi07_pbi11_penalizacion_recordatorio'),
    ]

    operations = [
        # ── COLUMNA: activolaboratorio.columna ────────────────────────────────
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql="ALTER TABLE activo_laboratorio ADD COLUMN IF NOT EXISTS columna integer NULL;",
                    reverse_sql="ALTER TABLE activo_laboratorio DROP COLUMN IF EXISTS columna;",
                ),
            ],
            state_operations=[
                migrations.AddField(
                    model_name='activolaboratorio',
                    name='columna',
                    field=models.IntegerField(blank=True, null=True),
                ),
            ],
        ),

        # ── COLUMNA: activolaboratorio.fila ───────────────────────────────────
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql="ALTER TABLE activo_laboratorio ADD COLUMN IF NOT EXISTS fila integer NULL;",
                    reverse_sql="ALTER TABLE activo_laboratorio DROP COLUMN IF EXISTS fila;",
                ),
            ],
            state_operations=[
                migrations.AddField(
                    model_name='activolaboratorio',
                    name='fila',
                    field=models.IntegerField(blank=True, null=True),
                ),
            ],
        ),

        # ── COLUMNA: laboratorio.tipo_layout ──────────────────────────────────
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql="ALTER TABLE laboratorio ADD COLUMN IF NOT EXISTS tipo_layout varchar(10) NOT NULL DEFAULT 'GRID';",
                    reverse_sql="ALTER TABLE laboratorio DROP COLUMN IF EXISTS tipo_layout;",
                ),
            ],
            state_operations=[
                migrations.AddField(
                    model_name='laboratorio',
                    name='tipo_layout',
                    field=models.CharField(
                        choices=[('GRID', 'Cuadrícula Clásica'), ('MESAS', 'Mesas de Trabajo')],
                        default='GRID',
                        max_length=10,
                    ),
                ),
            ],
        ),

        # ── AlterField solo cambia estado interno de Django (no toca la BD) ──
        migrations.AlterField(
            model_name='activolaboratorio',
            name='estado',
            field=models.CharField(
                choices=[('Operativo', 'Operativo'), ('Mantenimiento', 'Mantenimiento'), ('Dado de baja', 'Dado de baja')],
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name='reserva',
            name='estado',
            field=models.CharField(
                choices=[('Programada', 'Programada'), ('Pendiente', 'Pendiente'), ('Cancelada', 'Cancelada'), ('Completada', 'Completada'), ('No-show', 'No-show')],
                max_length=20,
            ),
        ),

        # ── CONSTRAINT: activo_estado_valido ──────────────────────────────────
        # DO $$ bloque: no falla si el constraint ya existe.
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql="""
                    DO $$
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM pg_constraint
                            WHERE conname = 'activo_estado_valido'
                            AND conrelid = 'activo_laboratorio'::regclass
                        ) THEN
                            ALTER TABLE activo_laboratorio
                            ADD CONSTRAINT activo_estado_valido
                            CHECK (estado IN ('Operativo', 'Mantenimiento', 'Dado de baja'));
                        END IF;
                    END $$;
                    """,
                    reverse_sql="ALTER TABLE activo_laboratorio DROP CONSTRAINT IF EXISTS activo_estado_valido;",
                ),
            ],
            state_operations=[
                migrations.AddConstraint(
                    model_name='activolaboratorio',
                    constraint=models.CheckConstraint(
                        condition=models.Q(('estado__in', ['Operativo', 'Mantenimiento', 'Dado de baja'])),
                        name='activo_estado_valido',
                    ),
                ),
            ],
        ),

        # ── ÍNDICE: horario_fecha_estado_idx ──────────────────────────────────
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql="CREATE INDEX IF NOT EXISTS horario_fecha_estado_idx ON horario_disponible (fecha, estado);",
                    reverse_sql="DROP INDEX IF EXISTS horario_fecha_estado_idx;",
                ),
            ],
            state_operations=[
                migrations.AddIndex(
                    model_name='horariodisponible',
                    index=models.Index(fields=['fecha', 'estado'], name='horario_fecha_estado_idx'),
                ),
            ],
        ),

        # ── ÍNDICE: horario_fecha_idx ─────────────────────────────────────────
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql="CREATE INDEX IF NOT EXISTS horario_fecha_idx ON horario_disponible (fecha);",
                    reverse_sql="DROP INDEX IF EXISTS horario_fecha_idx;",
                ),
            ],
            state_operations=[
                migrations.AddIndex(
                    model_name='horariodisponible',
                    index=models.Index(fields=['fecha'], name='horario_fecha_idx'),
                ),
            ],
        ),
    ]
