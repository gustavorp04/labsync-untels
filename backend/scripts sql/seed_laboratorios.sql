-- =============================================================================
-- LabSync UNTELS — Script laboratorios y horarios bloqueados (PBI-18)
-- Estado 'Bloqueado' = horario ocupado con clases (no disponible para reserva)
-- Fecha de referencia: semana del 2026-05-04 al 2026-05-09
-- =============================================================================

-- =============================================================================
-- TIPOS DE LABORATORIO
-- =============================================================================
INSERT INTO tipo_laboratorio (nombre, min_equipos, tipo_equipo_minimo) VALUES
('Cómputo',      10, 'CPU'),
('Electrónica',   3, 'Mesa'),
('Ambiental',     3, 'Mesa'),
('Física',        3, 'Mesa')
ON CONFLICT (nombre) DO NOTHING;

-- =============================================================================
-- LABORATORIOS (17)
-- id_facultad: 1 = Facultad de Ingeniería y Gestión
-- id_tipo: 1=Cómputo, 2=Electrónica, 3=Ambiental, 4=Física, 5=Redes
-- =============================================================================
INSERT INTO laboratorio (id_tipo, id_facultad, nombre, codigo_patrimonio, aforo_maximo, habilitado) VALUES
-- Sistemas
((SELECT id_tipo FROM tipo_laboratorio WHERE nombre='Cómputo'), 1, 'Laboratorio de Cómputo de Sistemas 01',              'A1-1',    30, TRUE),
((SELECT id_tipo FROM tipo_laboratorio WHERE nombre='Cómputo'), 1, 'Laboratorio de Cómputo de Sistemas 02',              'A2-3',    30, TRUE),
((SELECT id_tipo FROM tipo_laboratorio WHERE nombre='Cómputo'), 1, 'Laboratorio de Cómputo de Sistemas 03',              'A2-4',    30, TRUE),
((SELECT id_tipo FROM tipo_laboratorio WHERE nombre='Cómputo'), 1, 'Laboratorio de Cómputo de Sistemas 04',              'C2-2A',   24, TRUE),
((SELECT id_tipo FROM tipo_laboratorio WHERE nombre='Cómputo'), 1, 'Laboratorio de Cómputo de Sistemas 05',              'C2-2B',   24, TRUE),
((SELECT id_tipo FROM tipo_laboratorio WHERE nombre='Cómputo'), 1, 'Laboratorio de Cómputo de Simulación de Software',   'A1-3',    30, TRUE),
((SELECT id_tipo FROM tipo_laboratorio WHERE nombre='Cómputo'), 1, 'Laboratorio de Cómputo de Simulación de Negocios',   'A1-2',    30, TRUE),
((SELECT id_tipo FROM tipo_laboratorio WHERE nombre='Cómputo'), 1, 'Laboratorio de Cómputo Georeferenciados',            'C3-3',    20, TRUE),
-- Electrónica
((SELECT id_tipo FROM tipo_laboratorio WHERE nombre='Electrónica'), 1, 'Laboratorio de Cómputo de Mecánica',                 'B3-9',    30, TRUE),
((SELECT id_tipo FROM tipo_laboratorio WHERE nombre='Electrónica'), 1, 'Laboratorio de Electrónica Analógica y Digital',     'ELE-AD',  25, TRUE),
((SELECT id_tipo FROM tipo_laboratorio WHERE nombre='Electrónica'), 1, 'Laboratorio de Control y Automatización',            'ELE-CA',  20, TRUE),
((SELECT id_tipo FROM tipo_laboratorio WHERE nombre='Electrónica'), 1, 'Aula B2-4',                                          'B2-4',    30, TRUE),
((SELECT id_tipo FROM tipo_laboratorio WHERE nombre='Electrónica'), 1, 'Laboratorio de Instalaciones Eléctricas',            'B1-4',    20, TRUE),
-- Ambiental
((SELECT id_tipo FROM tipo_laboratorio WHERE nombre='Ambiental'), 1, 'Laboratorio de Química Ambiental',                   'C2-3',    20, TRUE),
((SELECT id_tipo FROM tipo_laboratorio WHERE nombre='Ambiental'), 1, 'Laboratorio de Biología y Microbiología',            'C2-4',    20, TRUE),
((SELECT id_tipo FROM tipo_laboratorio WHERE nombre='Ambiental'), 1, 'Laboratorio de Química',                             'C1-2B',   19, TRUE),
-- Física
((SELECT id_tipo FROM tipo_laboratorio WHERE nombre='Física'), 1, 'Laboratorio de Física G1',                           'FIS-G1',  25, TRUE),
((SELECT id_tipo FROM tipo_laboratorio WHERE nombre='Física'), 1, 'Laboratorio de Física G2',                           'FIS-G2',  25, TRUE);

