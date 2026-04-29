-- =============================================================================
-- LabSync UNTELS — Script de datos sintéticos (PBI-18)
-- Sin PII real excepto un usuario de prueba autorizado
-- Contraseñas por rol/escuela (ver tabla al final)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- HASHES DE CONTRASEÑAS
-- est_sistemas   → EstSist_2026
-- est_ambiental  → EstAmb_2026
-- est_electronica→ EstElec_2026
-- doc_sistemas   → DocSist_2026
-- doc_ambiental  → DocAmb_2026
-- doc_electronica→ DocElec_2026
-- admin_lab      → AdminLab_2026
-- jefatura       → Jefatura_2026
-- -----------------------------------------------------------------------------

-- =============================================================================
-- USUARIOS — JEFATURA (1)
-- =============================================================================
INSERT INTO USUARIO (id_rol, nombre, email, password_hash, codigo_universitario, created_at) VALUES
(4, 'Roberto Mendoza Paredes',
    'r.mendoza@untels.edu.pe',
    'pbkdf2_sha256$1000000$kh8yh1v6GynO5HBEGy3YFK$C3Ns3/lcsVFhRLdGpHCyfuZ4TylUodd5LVP32PXFdIs=',
    'JEF0001', NOW());

-- =============================================================================
-- USUARIOS — ADMIN LAB (1)
-- =============================================================================
INSERT INTO USUARIO (id_rol, nombre, email, password_hash, codigo_universitario, created_at) VALUES
(3, 'Carmen Villanueva Torres',
    'c.villanueva@untels.edu.pe',
    'pbkdf2_sha256$1000000$xCpI04vcYc171J11x4UuQq$sJhMMg+QS0RJSbacqPubAdRSjA4qkj+/UWXnDcnQVHw=',
    'ADM0001', NOW());

-- =============================================================================
-- USUARIOS — DOCENTES (3 por escuela = 9 total)
-- =============================================================================

-- Docentes Sistemas (id_rol=2)
INSERT INTO USUARIO (id_rol, nombre, email, password_hash, codigo_universitario, created_at) VALUES
(2, 'Luis Alberto Quispe Flores',
    'l.quispe@untels.edu.pe',
    'pbkdf2_sha256$1000000$LoKgVlTCJ8GvNok7iaQYd4$UKxuS9FuP41snljNiyaKwTtEXGFRBdIGQZP4l6TICPo=',
    'D0001', NOW()),
(2, 'Ana María Castillo Ramos',
    'a.castillo@untels.edu.pe',
    'pbkdf2_sha256$1000000$LoKgVlTCJ8GvNok7iaQYd4$UKxuS9FuP41snljNiyaKwTtEXGFRBdIGQZP4l6TICPo=',
    'D0002', NOW()),
(2, 'Jorge Enrique Pacheco Díaz',
    'j.pacheco@untels.edu.pe',
    'pbkdf2_sha256$1000000$LoKgVlTCJ8GvNok7iaQYd4$UKxuS9FuP41snljNiyaKwTtEXGFRBdIGQZP4l6TICPo=',
    'D0003', NOW());

-- Docentes Ambiental
INSERT INTO USUARIO (id_rol, nombre, email, password_hash, codigo_universitario, created_at) VALUES
(2, 'Patricia Solano Huanca',
    'p.solano@untels.edu.pe',
    'pbkdf2_sha256$1000000$r6iCQqjZrdDhgVJtZRy8SA$4Bom2I/+0KOhziZTLMmaLepQhOM6j1XCqdK8HUzyNa4=',
    'D0004', NOW()),
(2, 'Miguel Ángel Zevallos Cruz',
    'm.zevallos@untels.edu.pe',
    'pbkdf2_sha256$1000000$r6iCQqjZrdDhgVJtZRy8SA$4Bom2I/+0KOhziZTLMmaLepQhOM6j1XCqdK8HUzyNa4=',
    'D0005', NOW()),
(2, 'Rosa Elena Puma Condori',
    'r.puma@untels.edu.pe',
    'pbkdf2_sha256$1000000$r6iCQqjZrdDhgVJtZRy8SA$4Bom2I/+0KOhziZTLMmaLepQhOM6j1XCqdK8HUzyNa4=',
    'D0006', NOW());

-- Docentes Electrónica
INSERT INTO USUARIO (id_rol, nombre, email, password_hash, codigo_universitario, created_at) VALUES
(2, 'Carlos Humberto Rivas Salas',
    'c.rivas@untels.edu.pe',
    'pbkdf2_sha256$1000000$bG2FEoAoo4RedByUmdNEWG$r+SdehmudAOqzG3Pi3QM9nSU7JRkAhlvhcaeIdQwggg=',
    'D0007', NOW()),
(2, 'Susana Beatriz Chávez Lara',
    's.chavez@untels.edu.pe',
    'pbkdf2_sha256$1000000$bG2FEoAoo4RedByUmdNEWG$r+SdehmudAOqzG3Pi3QM9nSU7JRkAhlvhcaeIdQwggg=',
    'D0008', NOW()),
(2, 'Fernando José Mamani Apaza',
    'f.mamani@untels.edu.pe',
    'pbkdf2_sha256$1000000$bG2FEoAoo4RedByUmdNEWG$r+SdehmudAOqzG3Pi3QM9nSU7JRkAhlvhcaeIdQwggg=',
    'D0009', NOW());

-- =============================================================================
-- PERFILES DOCENTE
-- =============================================================================
INSERT INTO PERFIL_DOCENTE (id_usuario, departamento)
SELECT id_usuario, 'Ingeniería de Sistemas'
FROM USUARIO WHERE codigo_universitario IN ('D0001','D0002','D0003');

INSERT INTO PERFIL_DOCENTE (id_usuario, departamento)
SELECT id_usuario, 'Ingeniería Ambiental'
FROM USUARIO WHERE codigo_universitario IN ('D0004','D0005','D0006');

INSERT INTO PERFIL_DOCENTE (id_usuario, departamento)
SELECT id_usuario, 'Ingeniería Electrónica'
FROM USUARIO WHERE codigo_universitario IN ('D0007','D0008','D0009');

-- =============================================================================
-- USUARIOS — ESTUDIANTES SISTEMAS (25)
-- Tu correo real va primero como usuario de prueba autorizado
-- =============================================================================
INSERT INTO USUARIO (id_rol, nombre, email, password_hash, codigo_universitario, created_at) VALUES
(1, 'Fiorella Portalanza Hurtado',
    '2223010267@untels.edu.pe',
    'pbkdf2_sha256$1000000$WBeadsGtpr2L2hn93zUyB3$ZkydCjd4zJpbDLH4Bx9vNjnZNc8myEfepx/LpKMcUfg=',
    '2223010267', NOW()),
(1, 'Álvaro Stein Medina',        'a.stein@untels.edu.pe',       'pbkdf2_sha256$1000000$WBeadsGtpr2L2hn93zUyB3$ZkydCjd4zJpbDLH4Bx9vNjnZNc8myEfepx/LpKMcUfg=', '2220010001', NOW()),
(1, 'Brenda Falcón Ríos',         'b.falcon@untels.edu.pe',      'pbkdf2_sha256$1000000$WBeadsGtpr2L2hn93zUyB3$ZkydCjd4zJpbDLH4Bx9vNjnZNc8myEfepx/LpKMcUfg=', '2220010002', NOW()),
(1, 'César Tapia Núñez',          'c.tapia@untels.edu.pe',       'pbkdf2_sha256$1000000$WBeadsGtpr2L2hn93zUyB3$ZkydCjd4zJpbDLH4Bx9vNjnZNc8myEfepx/LpKMcUfg=', '2220010003', NOW()),
(1, 'Diana Herrera Soto',         'd.herrera@untels.edu.pe',     'pbkdf2_sha256$1000000$WBeadsGtpr2L2hn93zUyB3$ZkydCjd4zJpbDLH4Bx9vNjnZNc8myEfepx/LpKMcUfg=', '2220010004', NOW()),
(1, 'Ernesto Vidal Campos',       'e.vidal@untels.edu.pe',       'pbkdf2_sha256$1000000$WBeadsGtpr2L2hn93zUyB3$ZkydCjd4zJpbDLH4Bx9vNjnZNc8myEfepx/LpKMcUfg=', '2220010005', NOW()),
(1, 'Fiorella Mora Espinoza',     'f.mora@untels.edu.pe',        'pbkdf2_sha256$1000000$WBeadsGtpr2L2hn93zUyB3$ZkydCjd4zJpbDLH4Bx9vNjnZNc8myEfepx/LpKMcUfg=', '2220010006', NOW()),
(1, 'Gonzalo Pérez Huamán',       'g.perez@untels.edu.pe',       'pbkdf2_sha256$1000000$WBeadsGtpr2L2hn93zUyB3$ZkydCjd4zJpbDLH4Bx9vNjnZNc8myEfepx/LpKMcUfg=', '2220010007', NOW()),
(1, 'Hilda Ramos Vargas',         'h.ramos@untels.edu.pe',       'pbkdf2_sha256$1000000$WBeadsGtpr2L2hn93zUyB3$ZkydCjd4zJpbDLH4Bx9vNjnZNc8myEfepx/LpKMcUfg=', '2220010008', NOW()),
(1, 'Iván Flores Quispe',         'i.flores@untels.edu.pe',      'pbkdf2_sha256$1000000$WBeadsGtpr2L2hn93zUyB3$ZkydCjd4zJpbDLH4Bx9vNjnZNc8myEfepx/LpKMcUfg=', '2220010009', NOW()),
(1, 'Jessica Luna Torres',        'j.luna@untels.edu.pe',        'pbkdf2_sha256$1000000$WBeadsGtpr2L2hn93zUyB3$ZkydCjd4zJpbDLH4Bx9vNjnZNc8myEfepx/LpKMcUfg=', '2220010010', NOW()),
(1, 'Kevin Salas Díaz',           'k.salas@untels.edu.pe',       'pbkdf2_sha256$1000000$WBeadsGtpr2L2hn93zUyB3$ZkydCjd4zJpbDLH4Bx9vNjnZNc8myEfepx/LpKMcUfg=', '2220010011', NOW()),
(1, 'Laura Benítez Ccopa',        'l.benitez@untels.edu.pe',     'pbkdf2_sha256$1000000$WBeadsGtpr2L2hn93zUyB3$ZkydCjd4zJpbDLH4Bx9vNjnZNc8myEfepx/LpKMcUfg=', '2220010012', NOW()),
(1, 'Marco Delgado Pinto',        'm.delgado@untels.edu.pe',     'pbkdf2_sha256$1000000$WBeadsGtpr2L2hn93zUyB3$ZkydCjd4zJpbDLH4Bx9vNjnZNc8myEfepx/LpKMcUfg=', '2220010013', NOW()),
(1, 'Natalia Choque Mamani',      'n.choque@untels.edu.pe',      'pbkdf2_sha256$1000000$WBeadsGtpr2L2hn93zUyB3$ZkydCjd4zJpbDLH4Bx9vNjnZNc8myEfepx/LpKMcUfg=', '2220010014', NOW()),
(1, 'Oscar Tello Gutiérrez',      'o.tello@untels.edu.pe',       'pbkdf2_sha256$1000000$WBeadsGtpr2L2hn93zUyB3$ZkydCjd4zJpbDLH4Bx9vNjnZNc8myEfepx/LpKMcUfg=', '2220010015', NOW()),
(1, 'Paola Zuñiga Arce',          'p.zuniga@untels.edu.pe',      'pbkdf2_sha256$1000000$WBeadsGtpr2L2hn93zUyB3$ZkydCjd4zJpbDLH4Bx9vNjnZNc8myEfepx/LpKMcUfg=', '2220010016', NOW()),
(1, 'Raúl Cárdenas Llerena',      'r.cardenas@untels.edu.pe',    'pbkdf2_sha256$1000000$WBeadsGtpr2L2hn93zUyB3$ZkydCjd4zJpbDLH4Bx9vNjnZNc8myEfepx/LpKMcUfg=', '2220010017', NOW()),
(1, 'Sandra Inca Velarde',        's.inca@untels.edu.pe',        'pbkdf2_sha256$1000000$WBeadsGtpr2L2hn93zUyB3$ZkydCjd4zJpbDLH4Bx9vNjnZNc8myEfepx/LpKMcUfg=', '2220010018', NOW()),
(1, 'Tomás Paredes Lazo',         't.paredes@untels.edu.pe',     'pbkdf2_sha256$1000000$WBeadsGtpr2L2hn93zUyB3$ZkydCjd4zJpbDLH4Bx9vNjnZNc8myEfepx/LpKMcUfg=', '2220010019', NOW()),
(1, 'Úrsula Chávez Condori',      'u.chavez@untels.edu.pe',      'pbkdf2_sha256$1000000$WBeadsGtpr2L2hn93zUyB3$ZkydCjd4zJpbDLH4Bx9vNjnZNc8myEfepx/LpKMcUfg=', '2220010020', NOW()),
(1, 'Víctor Apaza Sucari',        'v.apaza@untels.edu.pe',       'pbkdf2_sha256$1000000$WBeadsGtpr2L2hn93zUyB3$ZkydCjd4zJpbDLH4Bx9vNjnZNc8myEfepx/LpKMcUfg=', '2220010021', NOW()),
(1, 'Wendy Huanca Quispe',        'w.huanca@untels.edu.pe',      'pbkdf2_sha256$1000000$WBeadsGtpr2L2hn93zUyB3$ZkydCjd4zJpbDLH4Bx9vNjnZNc8myEfepx/LpKMcUfg=', '2220010022', NOW()),
(1, 'Ximena Oblitas Fuentes',     'x.oblitas@untels.edu.pe',     'pbkdf2_sha256$1000000$WBeadsGtpr2L2hn93zUyB3$ZkydCjd4zJpbDLH4Bx9vNjnZNc8myEfepx/LpKMcUfg=', '2220010023', NOW()),
(1, 'Yerson Mamani Turpo',        'y.mamani@untels.edu.pe',      'pbkdf2_sha256$1000000$WBeadsGtpr2L2hn93zUyB3$ZkydCjd4zJpbDLH4Bx9vNjnZNc8myEfepx/LpKMcUfg=', '2220010024', NOW());

-- =============================================================================
-- USUARIOS — ESTUDIANTES AMBIENTAL (25)
-- =============================================================================
INSERT INTO USUARIO (id_rol, nombre, email, password_hash, codigo_universitario, created_at) VALUES
(1, 'Adriana Coyla Quispe',       'ad.coyla@untels.edu.pe',      'pbkdf2_sha256$1000000$yE5dP8RNEpXnBnzpYeAr4w$Q0Rvy6x1QpPlCYU8FC0GDbGLMgUQKO7Pg9PrJurRniI=', '2220020001', NOW()),
(1, 'Bruno Ccahuana López',       'b.ccahuana@untels.edu.pe',    'pbkdf2_sha256$1000000$yE5dP8RNEpXnBnzpYeAr4w$Q0Rvy6x1QpPlCYU8FC0GDbGLMgUQKO7Pg9PrJurRniI=', '2220020002', NOW()),
(1, 'Claudia Suni Turpo',         'c.suni@untels.edu.pe',        'pbkdf2_sha256$1000000$yE5dP8RNEpXnBnzpYeAr4w$Q0Rvy6x1QpPlCYU8FC0GDbGLMgUQKO7Pg9PrJurRniI=', '2220020003', NOW()),
(1, 'David Pari Condori',         'd.pari@untels.edu.pe',        'pbkdf2_sha256$1000000$yE5dP8RNEpXnBnzpYeAr4w$Q0Rvy6x1QpPlCYU8FC0GDbGLMgUQKO7Pg9PrJurRniI=', '2220020004', NOW()),
(1, 'Elena Calisaya Huanca',      'e.calisaya@untels.edu.pe',    'pbkdf2_sha256$1000000$yE5dP8RNEpXnBnzpYeAr4w$Q0Rvy6x1QpPlCYU8FC0GDbGLMgUQKO7Pg9PrJurRniI=', '2220020005', NOW()),
(1, 'Fabio Arocutipa Ramos',      'f.arocutipa@untels.edu.pe',   'pbkdf2_sha256$1000000$yE5dP8RNEpXnBnzpYeAr4w$Q0Rvy6x1QpPlCYU8FC0GDbGLMgUQKO7Pg9PrJurRniI=', '2220020006', NOW()),
(1, 'Gabriela Ticona Flores',     'g.ticona@untels.edu.pe',      'pbkdf2_sha256$1000000$yE5dP8RNEpXnBnzpYeAr4w$Q0Rvy6x1QpPlCYU8FC0GDbGLMgUQKO7Pg9PrJurRniI=', '2220020007', NOW()),
(1, 'Héctor Llanos Zapata',       'h.llanos@untels.edu.pe',      'pbkdf2_sha256$1000000$yE5dP8RNEpXnBnzpYeAr4w$Q0Rvy6x1QpPlCYU8FC0GDbGLMgUQKO7Pg9PrJurRniI=', '2220020008', NOW()),
(1, 'Ingrid Machaca Pilco',       'i.machaca@untels.edu.pe',     'pbkdf2_sha256$1000000$yE5dP8RNEpXnBnzpYeAr4w$Q0Rvy6x1QpPlCYU8FC0GDbGLMgUQKO7Pg9PrJurRniI=', '2220020009', NOW()),
(1, 'Josué Vargas Cutipa',        'jo.vargas@untels.edu.pe',     'pbkdf2_sha256$1000000$yE5dP8RNEpXnBnzpYeAr4w$Q0Rvy6x1QpPlCYU8FC0GDbGLMgUQKO7Pg9PrJurRniI=', '2220020010', NOW()),
(1, 'Karla Mamani Larico',        'k.mamani@untels.edu.pe',      'pbkdf2_sha256$1000000$yE5dP8RNEpXnBnzpYeAr4w$Q0Rvy6x1QpPlCYU8FC0GDbGLMgUQKO7Pg9PrJurRniI=', '2220020011', NOW()),
(1, 'Leonardo Apaza Ccallo',      'le.apaza@untels.edu.pe',      'pbkdf2_sha256$1000000$yE5dP8RNEpXnBnzpYeAr4w$Q0Rvy6x1QpPlCYU8FC0GDbGLMgUQKO7Pg9PrJurRniI=', '2220020012', NOW()),
(1, 'Milagros Quispe Sucari',     'mi.quispe@untels.edu.pe',     'pbkdf2_sha256$1000000$yE5dP8RNEpXnBnzpYeAr4w$Q0Rvy6x1QpPlCYU8FC0GDbGLMgUQKO7Pg9PrJurRniI=', '2220020013', NOW()),
(1, 'Néstor Churata Ponce',       'ne.churata@untels.edu.pe',    'pbkdf2_sha256$1000000$yE5dP8RNEpXnBnzpYeAr4w$Q0Rvy6x1QpPlCYU8FC0GDbGLMgUQKO7Pg9PrJurRniI=', '2220020014', NOW()),
(1, 'Olga Cari Catacora',         'o.cari@untels.edu.pe',        'pbkdf2_sha256$1000000$yE5dP8RNEpXnBnzpYeAr4w$Q0Rvy6x1QpPlCYU8FC0GDbGLMgUQKO7Pg9PrJurRniI=', '2220020015', NOW()),
(1, 'Pablo Huallpa Limachi',      'p.huallpa@untels.edu.pe',     'pbkdf2_sha256$1000000$yE5dP8RNEpXnBnzpYeAr4w$Q0Rvy6x1QpPlCYU8FC0GDbGLMgUQKO7Pg9PrJurRniI=', '2220020016', NOW()),
(1, 'Quirina Flores Mamani',      'q.flores@untels.edu.pe',      'pbkdf2_sha256$1000000$yE5dP8RNEpXnBnzpYeAr4w$Q0Rvy6x1QpPlCYU8FC0GDbGLMgUQKO7Pg9PrJurRniI=', '2220020017', NOW()),
(1, 'Rodrigo Inca Luque',         'ro.inca@untels.edu.pe',       'pbkdf2_sha256$1000000$yE5dP8RNEpXnBnzpYeAr4w$Q0Rvy6x1QpPlCYU8FC0GDbGLMgUQKO7Pg9PrJurRniI=', '2220020018', NOW()),
(1, 'Silvia Colque Chura',        'si.colque@untels.edu.pe',     'pbkdf2_sha256$1000000$yE5dP8RNEpXnBnzpYeAr4w$Q0Rvy6x1QpPlCYU8FC0GDbGLMgUQKO7Pg9PrJurRniI=', '2220020019', NOW()),
(1, 'Timoteo Roque Luque',        'ti.roque@untels.edu.pe',      'pbkdf2_sha256$1000000$yE5dP8RNEpXnBnzpYeAr4w$Q0Rvy6x1QpPlCYU8FC0GDbGLMgUQKO7Pg9PrJurRniI=', '2220020020', NOW()),
(1, 'Uriel Calla Huanca',         'ur.calla@untels.edu.pe',      'pbkdf2_sha256$1000000$yE5dP8RNEpXnBnzpYeAr4w$Q0Rvy6x1QpPlCYU8FC0GDbGLMgUQKO7Pg9PrJurRniI=', '2220020021', NOW()),
(1, 'Vanessa Layme Ticona',       'va.layme@untels.edu.pe',      'pbkdf2_sha256$1000000$yE5dP8RNEpXnBnzpYeAr4w$Q0Rvy6x1QpPlCYU8FC0GDbGLMgUQKO7Pg9PrJurRniI=', '2220020022', NOW()),
(1, 'Walter Catacora Pari',       'wa.catacora@untels.edu.pe',   'pbkdf2_sha256$1000000$yE5dP8RNEpXnBnzpYeAr4w$Q0Rvy6x1QpPlCYU8FC0GDbGLMgUQKO7Pg9PrJurRniI=', '2220020023', NOW()),
(1, 'Xiomara Lupaca Ramos',       'xi.lupaca@untels.edu.pe',     'pbkdf2_sha256$1000000$yE5dP8RNEpXnBnzpYeAr4w$Q0Rvy6x1QpPlCYU8FC0GDbGLMgUQKO7Pg9PrJurRniI=', '2220020024', NOW()),
(1, 'Yolanda Pinto Quispe',       'yo.pinto@untels.edu.pe',      'pbkdf2_sha256$1000000$yE5dP8RNEpXnBnzpYeAr4w$Q0Rvy6x1QpPlCYU8FC0GDbGLMgUQKO7Pg9PrJurRniI=', '2220020025', NOW());

-- =============================================================================
-- USUARIOS — ESTUDIANTES ELECTRÓNICA (25)
-- =============================================================================
INSERT INTO USUARIO (id_rol, nombre, email, password_hash, codigo_universitario, created_at) VALUES
(1, 'Abel Quispe Condori',        'ab.quispe@untels.edu.pe',     'pbkdf2_sha256$1000000$m15GEXvFrrn7KYLLuwH9n7$DXQLqeqEp9vsGZ+Vt0TfPToRd8IrrbUZ5jAf2s/iquE=', '2220030001', NOW()),
(1, 'Betsy Mamani Huanca',        'be.mamani@untels.edu.pe',     'pbkdf2_sha256$1000000$m15GEXvFrrn7KYLLuwH9n7$DXQLqeqEp9vsGZ+Vt0TfPToRd8IrrbUZ5jAf2s/iquE=', '2220030002', NOW()),
(1, 'Cristian Turpo Lazo',        'cr.turpo@untels.edu.pe',      'pbkdf2_sha256$1000000$m15GEXvFrrn7KYLLuwH9n7$DXQLqeqEp9vsGZ+Vt0TfPToRd8IrrbUZ5jAf2s/iquE=', '2220030003', NOW()),
(1, 'Delia Coaquira Flores',      'de.coaquira@untels.edu.pe',   'pbkdf2_sha256$1000000$m15GEXvFrrn7KYLLuwH9n7$DXQLqeqEp9vsGZ+Vt0TfPToRd8IrrbUZ5jAf2s/iquE=', '2220030004', NOW()),
(1, 'Edwin Hancco Pilco',         'ed.hancco@untels.edu.pe',     'pbkdf2_sha256$1000000$m15GEXvFrrn7KYLLuwH9n7$DXQLqeqEp9vsGZ+Vt0TfPToRd8IrrbUZ5jAf2s/iquE=', '2220030005', NOW()),
(1, 'Flor Cusi Mamani',           'fl.cusi@untels.edu.pe',       'pbkdf2_sha256$1000000$m15GEXvFrrn7KYLLuwH9n7$DXQLqeqEp9vsGZ+Vt0TfPToRd8IrrbUZ5jAf2s/iquE=', '2220030006', NOW()),
(1, 'Gilberto Apaza Chura',       'gi.apaza@untels.edu.pe',      'pbkdf2_sha256$1000000$m15GEXvFrrn7KYLLuwH9n7$DXQLqeqEp9vsGZ+Vt0TfPToRd8IrrbUZ5jAf2s/iquE=', '2220030007', NOW()),
(1, 'Haydée Luque Ticona',        'ha.luque@untels.edu.pe',      'pbkdf2_sha256$1000000$m15GEXvFrrn7KYLLuwH9n7$DXQLqeqEp9vsGZ+Vt0TfPToRd8IrrbUZ5jAf2s/iquE=', '2220030008', NOW()),
(1, 'Isaías Poma Roque',          'is.poma@untels.edu.pe',       'pbkdf2_sha256$1000000$m15GEXvFrrn7KYLLuwH9n7$DXQLqeqEp9vsGZ+Vt0TfPToRd8IrrbUZ5jAf2s/iquE=', '2220030009', NOW()),
(1, 'Jacqueline Cutipa Vargas',   'ja.cutipa@untels.edu.pe',     'pbkdf2_sha256$1000000$m15GEXvFrrn7KYLLuwH9n7$DXQLqeqEp9vsGZ+Vt0TfPToRd8IrrbUZ5jAf2s/iquE=', '2220030010', NOW()),
(1, 'Kenyi Limachi Ccallo',       'ke.limachi@untels.edu.pe',    'pbkdf2_sha256$1000000$m15GEXvFrrn7KYLLuwH9n7$DXQLqeqEp9vsGZ+Vt0TfPToRd8IrrbUZ5jAf2s/iquE=', '2220030011', NOW()),
(1, 'Lourdes Catacora Ponce',     'lo.catacora@untels.edu.pe',   'pbkdf2_sha256$1000000$m15GEXvFrrn7KYLLuwH9n7$DXQLqeqEp9vsGZ+Vt0TfPToRd8IrrbUZ5jAf2s/iquE=', '2220030012', NOW()),
(1, 'Manuel Cari Luque',          'ma.cari@untels.edu.pe',       'pbkdf2_sha256$1000000$m15GEXvFrrn7KYLLuwH9n7$DXQLqeqEp9vsGZ+Vt0TfPToRd8IrrbUZ5jAf2s/iquE=', '2220030013', NOW()),
(1, 'Nancy Huallpa Sucari',       'na.huallpa@untels.edu.pe',    'pbkdf2_sha256$1000000$m15GEXvFrrn7KYLLuwH9n7$DXQLqeqEp9vsGZ+Vt0TfPToRd8IrrbUZ5jAf2s/iquE=', '2220030014', NOW()),
(1, 'Orlando Colque Chura',       'or.colque@untels.edu.pe',     'pbkdf2_sha256$1000000$m15GEXvFrrn7KYLLuwH9n7$DXQLqeqEp9vsGZ+Vt0TfPToRd8IrrbUZ5jAf2s/iquE=', '2220030015', NOW()),
(1, 'Pamela Roque Layme',         'pa.roque@untels.edu.pe',      'pbkdf2_sha256$1000000$m15GEXvFrrn7KYLLuwH9n7$DXQLqeqEp9vsGZ+Vt0TfPToRd8IrrbUZ5jAf2s/iquE=', '2220030016', NOW()),
(1, 'Quintín Pinto Inca',         'qu.pinto@untels.edu.pe',      'pbkdf2_sha256$1000000$m15GEXvFrrn7KYLLuwH9n7$DXQLqeqEp9vsGZ+Vt0TfPToRd8IrrbUZ5jAf2s/iquE=', '2220030017', NOW()),
(1, 'Roxana Calla Churata',       'ro.calla@untels.edu.pe',      'pbkdf2_sha256$1000000$m15GEXvFrrn7KYLLuwH9n7$DXQLqeqEp9vsGZ+Vt0TfPToRd8IrrbUZ5jAf2s/iquE=', '2220030018', NOW()),
(1, 'Samuel Coyla Larico',        'sa.coyla@untels.edu.pe',      'pbkdf2_sha256$1000000$m15GEXvFrrn7KYLLuwH9n7$DXQLqeqEp9vsGZ+Vt0TfPToRd8IrrbUZ5jAf2s/iquE=', '2220030019', NOW()),
(1, 'Teresa Ticona Ccahuana',     'te.ticona@untels.edu.pe',     'pbkdf2_sha256$1000000$m15GEXvFrrn7KYLLuwH9n7$DXQLqeqEp9vsGZ+Vt0TfPToRd8IrrbUZ5jAf2s/iquE=', '2220030020', NOW()),
(1, 'Ulises Flores Pari',         'ul.flores@untels.edu.pe',     'pbkdf2_sha256$1000000$m15GEXvFrrn7KYLLuwH9n7$DXQLqeqEp9vsGZ+Vt0TfPToRd8IrrbUZ5jAf2s/iquE=', '2220030021', NOW()),
(1, 'Verónica Hancco Vargas',     've.hancco@untels.edu.pe',     'pbkdf2_sha256$1000000$m15GEXvFrrn7KYLLuwH9n7$DXQLqeqEp9vsGZ+Vt0TfPToRd8IrrbUZ5jAf2s/iquE=', '2220030022', NOW()),
(1, 'Wilmer Mamani Cusi',         'wi.mamani@untels.edu.pe',     'pbkdf2_sha256$1000000$m15GEXvFrrn7KYLLuwH9n7$DXQLqeqEp9vsGZ+Vt0TfPToRd8IrrbUZ5jAf2s/iquE=', '2220030023', NOW()),
(1, 'Xiomara Turpo Apaza',        'xio.turpo@untels.edu.pe',     'pbkdf2_sha256$1000000$m15GEXvFrrn7KYLLuwH9n7$DXQLqeqEp9vsGZ+Vt0TfPToRd8IrrbUZ5jAf2s/iquE=', '2220030024', NOW()),
(1, 'Yenny Condori Pilco',        'ye.condori@untels.edu.pe',    'pbkdf2_sha256$1000000$m15GEXvFrrn7KYLLuwH9n7$DXQLqeqEp9vsGZ+Vt0TfPToRd8IrrbUZ5jAf2s/iquE=', '2220030025', NOW());

-- =============================================================================
-- PERFILES ESTUDIANTE
-- Ciclos variados para que sea más realista
-- Sistemas  → id_carrera = 1
-- Ambiental → id_carrera = 2
-- Electrónica → id_carrera = 3
-- =============================================================================

-- Sistemas (incluye tu usuario de prueba)
INSERT INTO PERFIL_ESTUDIANTE (id_usuario, id_carrera, ciclo)
SELECT u.id_usuario, 1,
    CASE (ROW_NUMBER() OVER (ORDER BY u.id_usuario) % 8)
        WHEN 0 THEN 8 WHEN 1 THEN 1 WHEN 2 THEN 2 WHEN 3 THEN 3
        WHEN 4 THEN 4 WHEN 5 THEN 5 WHEN 6 THEN 6 ELSE 7
    END
FROM USUARIO u
WHERE u.codigo_universitario IN (
    '2223010267',
    '2220010001','2220010002','2220010003','2220010004','2220010005',
    '2220010006','2220010007','2220010008','2220010009','2220010010',
    '2220010011','2220010012','2220010013','2220010014','2220010015',
    '2220010016','2220010017','2220010018','2220010019','2220010020',
    '2220010021','2220010022','2220010023','2220010024'
);

-- Ambiental
INSERT INTO PERFIL_ESTUDIANTE (id_usuario, id_carrera, ciclo)
SELECT u.id_usuario, 2,
    CASE (ROW_NUMBER() OVER (ORDER BY u.id_usuario) % 8)
        WHEN 0 THEN 8 WHEN 1 THEN 1 WHEN 2 THEN 2 WHEN 3 THEN 3
        WHEN 4 THEN 4 WHEN 5 THEN 5 WHEN 6 THEN 6 ELSE 7
    END
FROM USUARIO u
WHERE u.codigo_universitario IN (
    '2220020001','2220020002','2220020003','2220020004','2220020005',
    '2220020006','2220020007','2220020008','2220020009','2220020010',
    '2220020011','2220020012','2220020013','2220020014','2220020015',
    '2220020016','2220020017','2220020018','2220020019','2220020020',
    '2220020021','2220020022','2220020023','2220020024','2220020025'
);

-- Electrónica
INSERT INTO PERFIL_ESTUDIANTE (id_usuario, id_carrera, ciclo)
SELECT u.id_usuario, 3,
    CASE (ROW_NUMBER() OVER (ORDER BY u.id_usuario) % 8)
        WHEN 0 THEN 8 WHEN 1 THEN 1 WHEN 2 THEN 2 WHEN 3 THEN 3
        WHEN 4 THEN 4 WHEN 5 THEN 5 WHEN 6 THEN 6 ELSE 7
    END
FROM USUARIO u
WHERE u.codigo_universitario IN (
    '2220030001','2220030002','2220030003','2220030004','2220030005',
    '2220030006','2220030007','2220030008','2220030009','2220030010',
    '2220030011','2220030012','2220030013','2220030014','2220030015',
    '2220030016','2220030017','2220030018','2220030019','2220030020',
    '2220030021','2220030022','2220030023','2220030024','2220030025'
);