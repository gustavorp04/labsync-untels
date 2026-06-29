-- =============================================================================
-- LabSync UNTELS — Datos de REFERENCIA (sin DDL)
-- =============================================================================
-- IMPORTANTE: este archivo NO crea tablas. El esquema lo construye Django con
-- `python manage.py migrate` (que ya incluye todas las columnas y tablas de las
-- migraciones 0001..0010). Cargar el antiguo `labsync_schema.sql` borraría ese
-- esquema y dejaría la BD sin columnas que el código espera (imágenes, etc.).
--
-- Aquí solo van los catálogos base que el resto de seeds y la app necesitan.
-- Idempotente donde hay restricción UNIQUE (ON CONFLICT DO NOTHING).
-- =============================================================================

INSERT INTO configuracion_sistema (clave, valor, descripcion) VALUES
    ('SEMESTRE_ACTUAL', '2026-I', 'Semestre académico vigente'),
    ('DIAS_ANTICIPACION_RESERVA', '1', 'Días mínimos de anticipación para reservar'),
    ('MIN_ESTUDIANTES_RESERVA', '10', 'Mínimo de alumnos para habilitar reserva individual')
ON CONFLICT (clave) DO NOTHING;

INSERT INTO rol (nombre) VALUES ('estudiante'), ('docente'), ('admin_lab'), ('jefatura')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO tipo_laboratorio (nombre, min_equipos, tipo_equipo_minimo) VALUES
    ('Cómputo',     10, 'CPU'),
    ('Electrónica',  3, 'Mesa'),
    ('Ambiental',    3, 'Mesa'),
    ('Física',       3, 'Mesa')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO categoria_activo (nombre, descripcion) VALUES
    ('Cómputo',     'Equipos informáticos y periféricos'),
    ('Mobiliario',  'Muebles de laboratorio y oficina'),
    ('Redes',       'Equipos de redes y conectividad'),
    ('Electrónica', 'Instrumentos y componentes electrónicos'),
    ('Ciencias',    'Instrumentos de laboratorio de ciencias');

INSERT INTO tipo_activo (id_categoria, nombre) VALUES
    (1, 'CPU'), (1, 'Monitor'), (1, 'Teclado'), (1, 'Mouse'),
    (2, 'Mesa'), (2, 'Silla'),
    (3, 'Router'), (3, 'Switch'),
    (4, 'Osciloscopio'), (4, 'Multímetro'), (4, 'Fuente de Poder'),
    (4, 'Estación de Soldadura'), (4, 'Horno de Reflujo'),
    (4, 'Ruteadora CNC'), (4, 'Insoladora UV'), (4, 'Microscopio Digital'),
    (5, 'Balanza Analítica'), (5, 'pH-metro'), (5, 'Agitador Magnético'),
    (5, 'Microscopio Óptico'), (5, 'Vaso de Precipitados'),
    (5, 'Matraz Erlenmeyer'), (5, 'Bureta'), (5, 'Pipeta Graduada'),
    (5, 'Soporte Universal'), (5, 'Calibrador Vernier'),
    (5, 'Dinamómetro'), (5, 'Fuente DC'), (5, 'Cronómetro')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO facultad (nombre) VALUES ('Facultad de Ingeniería y Gestión')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO carrera (id_facultad, nombre) VALUES
    (1, 'Ingeniería de Sistemas'),
    (1, 'Ingeniería Ambiental'),
    (1, 'Ingeniería Electrónica'),
    (1, 'Ingeniería Mecánica');
