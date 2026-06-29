-- =============================================================================
-- LabSync UNTELS — Usuarios externos para pruebas
-- 50 estudiantes externos (EXT001-EXT050), todos en Ingeniería de Sistemas (ciclo 5)
-- Contraseña (igual para todos): LabSync2026!
-- Hash generado con: from django.contrib.auth.hashers import make_password
--                     make_password('LabSync2026!')
-- =============================================================================

-- =============================================================================
-- USUARIOS — ESTUDIANTES EXTERNOS (50)
-- id_rol = 1 (estudiante)
-- =============================================================================
INSERT INTO USUARIO (id_rol, nombre, email, password_hash, codigo_universitario, created_at) VALUES
(1, 'Estudiante Externo 01', 'ext01@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT001', NOW()),
(1, 'Estudiante Externo 02', 'ext02@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT002', NOW()),
(1, 'Estudiante Externo 03', 'ext03@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT003', NOW()),
(1, 'Estudiante Externo 04', 'ext04@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT004', NOW()),
(1, 'Estudiante Externo 05', 'ext05@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT005', NOW()),
(1, 'Estudiante Externo 06', 'ext06@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT006', NOW()),
(1, 'Estudiante Externo 07', 'ext07@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT007', NOW()),
(1, 'Estudiante Externo 08', 'ext08@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT008', NOW()),
(1, 'Estudiante Externo 09', 'ext09@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT009', NOW()),
(1, 'Estudiante Externo 10', 'ext10@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT010', NOW()),
(1, 'Estudiante Externo 11', 'ext11@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT011', NOW()),
(1, 'Estudiante Externo 12', 'ext12@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT012', NOW()),
(1, 'Estudiante Externo 13', 'ext13@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT013', NOW()),
(1, 'Estudiante Externo 14', 'ext14@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT014', NOW()),
(1, 'Estudiante Externo 15', 'ext15@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT015', NOW()),
(1, 'Estudiante Externo 16', 'ext16@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT016', NOW()),
(1, 'Estudiante Externo 17', 'ext17@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT017', NOW()),
(1, 'Estudiante Externo 18', 'ext18@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT018', NOW()),
(1, 'Estudiante Externo 19', 'ext19@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT019', NOW()),
(1, 'Estudiante Externo 20', 'ext20@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT020', NOW()),
(1, 'Estudiante Externo 21', 'ext21@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT021', NOW()),
(1, 'Estudiante Externo 22', 'ext22@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT022', NOW()),
(1, 'Estudiante Externo 23', 'ext23@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT023', NOW()),
(1, 'Estudiante Externo 24', 'ext24@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT024', NOW()),
(1, 'Estudiante Externo 25', 'ext25@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT025', NOW()),
(1, 'Estudiante Externo 26', 'ext26@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT026', NOW()),
(1, 'Estudiante Externo 27', 'ext27@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT027', NOW()),
(1, 'Estudiante Externo 28', 'ext28@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT028', NOW()),
(1, 'Estudiante Externo 29', 'ext29@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT029', NOW()),
(1, 'Estudiante Externo 30', 'ext30@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT030', NOW()),
(1, 'Estudiante Externo 31', 'ext31@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT031', NOW()),
(1, 'Estudiante Externo 32', 'ext32@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT032', NOW()),
(1, 'Estudiante Externo 33', 'ext33@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT033', NOW()),
(1, 'Estudiante Externo 34', 'ext34@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT034', NOW()),
(1, 'Estudiante Externo 35', 'ext35@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT035', NOW()),
(1, 'Estudiante Externo 36', 'ext36@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT036', NOW()),
(1, 'Estudiante Externo 37', 'ext37@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT037', NOW()),
(1, 'Estudiante Externo 38', 'ext38@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT038', NOW()),
(1, 'Estudiante Externo 39', 'ext39@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT039', NOW()),
(1, 'Estudiante Externo 40', 'ext40@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT040', NOW()),
(1, 'Estudiante Externo 41', 'ext41@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT041', NOW()),
(1, 'Estudiante Externo 42', 'ext42@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT042', NOW()),
(1, 'Estudiante Externo 43', 'ext43@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT043', NOW()),
(1, 'Estudiante Externo 44', 'ext44@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT044', NOW()),
(1, 'Estudiante Externo 45', 'ext45@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT045', NOW()),
(1, 'Estudiante Externo 46', 'ext46@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT046', NOW()),
(1, 'Estudiante Externo 47', 'ext47@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT047', NOW()),
(1, 'Estudiante Externo 48', 'ext48@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT048', NOW()),
(1, 'Estudiante Externo 49', 'ext49@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT049', NOW()),
(1, 'Estudiante Externo 50', 'ext50@test.labsync.pe', 'pbkdf2_sha256$1000000$Slf30SZ4hoivAnHv7nVDBE$DySIXOjlLfwRmi4tbC8/wo8VAjtshEQk7etV1QHCCOM=', 'EXT050', NOW());

-- =============================================================================
-- PERFILES ESTUDIANTE
-- Todos en Ingeniería de Sistemas (id_carrera = 1), ciclo 5
-- =============================================================================
INSERT INTO PERFIL_ESTUDIANTE (id_usuario, id_carrera, ciclo)
SELECT id_usuario, 1, 5
FROM USUARIO
WHERE codigo_universitario LIKE 'EXT0%';
