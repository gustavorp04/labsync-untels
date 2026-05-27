-- =============================================================================
-- LabSync UNTELS — Script DDL PostgreSQL
-- Versión: 2.1 (Modelo Corregido + cantidad_alumnos)
-- Asignatura: Desarrollo de Software — UNTELS 2026
-- =============================================================================

-- Limpiar esquema previo (orden inverso a las dependencias)
DROP TABLE IF EXISTS PENALIZACION        CASCADE;
DROP TABLE IF EXISTS HISTORIAL_MANTENIMIENTO CASCADE;
DROP TABLE IF EXISTS HISTORIAL_RESERVA      CASCADE;
DROP TABLE IF EXISTS INCIDENCIA          CASCADE;
DROP TABLE IF EXISTS ASISTENCIA          CASCADE;
DROP TABLE IF EXISTS RESERVA_DETALLE     CASCADE;
DROP TABLE IF EXISTS RESERVA             CASCADE;
DROP TABLE IF EXISTS HORARIO_DISPONIBLE  CASCADE;
DROP TABLE IF EXISTS ACTIVO_LABORATORIO  CASCADE;
DROP TABLE IF EXISTS LABORATORIO         CASCADE;
DROP TABLE IF EXISTS TIPO_ACTIVO         CASCADE;
DROP TABLE IF EXISTS CATEGORIA_ACTIVO    CASCADE;
DROP TABLE IF EXISTS TIPO_LABORATORIO    CASCADE;
DROP TABLE IF EXISTS PASSWORD_RESET      CASCADE;
DROP TABLE IF EXISTS PERFIL_DOCENTE      CASCADE;
DROP TABLE IF EXISTS PERFIL_ESTUDIANTE   CASCADE;
DROP TABLE IF EXISTS USUARIO             CASCADE;
DROP TABLE IF EXISTS CARRERA             CASCADE;
DROP TABLE IF EXISTS FACULTAD            CASCADE;
DROP TABLE IF EXISTS ROL                 CASCADE;

-- =============================================================================
-- ① CATÁLOGOS BASE
-- =============================================================================

CREATE TABLE ROL (
    id_rol   SERIAL       PRIMARY KEY,
    nombre   VARCHAR(50)  NOT NULL UNIQUE
);

CREATE TABLE FACULTAD (
    id_facultad  SERIAL         PRIMARY KEY,
    nombre       VARCHAR(100)  NOT NULL UNIQUE
);

CREATE TABLE CARRERA (
    id_carrera   SERIAL        PRIMARY KEY,
    id_facultad  INT           NOT NULL REFERENCES FACULTAD(id_facultad),
    nombre       VARCHAR(100)  NOT NULL
);

CREATE TABLE TIPO_LABORATORIO (
    id_tipo               SERIAL       PRIMARY KEY,
    nombre                VARCHAR(60)  NOT NULL UNIQUE,
    min_equipos           INT          NOT NULL CHECK (min_equipos > 0),
    tipo_equipo_minimo    VARCHAR(20)  NOT NULL
);

CREATE TABLE CATEGORIA_ACTIVO (
    id_categoria  SERIAL        PRIMARY KEY,
    nombre        VARCHAR(60)   NOT NULL,
    descripcion   VARCHAR(200)
);

CREATE TABLE TIPO_ACTIVO (
    id_tipo_activo  SERIAL       PRIMARY KEY,
    id_categoria    INT          NOT NULL REFERENCES CATEGORIA_ACTIVO(id_categoria),
    nombre          VARCHAR(50)  NOT NULL UNIQUE,
    descripcion     VARCHAR(200)
);

-- =============================================================================
-- ② GESTIÓN DE USUARIOS
-- =============================================================================

CREATE TABLE USUARIO (
    id_usuario           SERIAL        PRIMARY KEY,
    id_rol               INT           NOT NULL REFERENCES ROL(id_rol),
    nombre               VARCHAR(120)  NOT NULL,
    email                VARCHAR(150)  NOT NULL UNIQUE,
    password_hash        VARCHAR(255)  NOT NULL,
    codigo_universitario VARCHAR(20)   NOT NULL UNIQUE,
    created_at           TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE PERFIL_ESTUDIANTE (
    id_perfil   SERIAL  PRIMARY KEY,
    id_usuario  INT     NOT NULL UNIQUE REFERENCES USUARIO(id_usuario) ON DELETE CASCADE,
    id_carrera  INT     NOT NULL REFERENCES CARRERA(id_carrera),
    ciclo       SMALLINT NOT NULL CHECK (ciclo BETWEEN 1 AND 12)
);

CREATE TABLE PERFIL_DOCENTE (
    id_perfil     SERIAL        PRIMARY KEY,
    id_usuario    INT           NOT NULL UNIQUE REFERENCES USUARIO(id_usuario) ON DELETE CASCADE,
    departamento  VARCHAR(100)  NOT NULL
);

CREATE TABLE PASSWORD_RESET (
    id               SERIAL        PRIMARY KEY,
    id_usuario       INT           NOT NULL REFERENCES USUARIO(id_usuario) ON DELETE CASCADE,
    token_hash       VARCHAR(255)  NOT NULL UNIQUE,
    fecha_expiracion TIMESTAMP     NOT NULL,
    usado            BOOLEAN       NOT NULL DEFAULT FALSE
);

-- =============================================================================
-- ③ INFRAESTRUCTURA DE LABORATORIOS
-- =============================================================================

CREATE TABLE LABORATORIO (
    id_laboratorio    SERIAL       PRIMARY KEY,
    id_tipo           INT          NOT NULL REFERENCES TIPO_LABORATORIO(id_tipo),
    id_facultad       INT          NOT NULL REFERENCES FACULTAD(id_facultad),
    nombre            VARCHAR(100) NOT NULL,
    codigo_patrimonio VARCHAR(30)  NOT NULL UNIQUE,
    aforo_maximo      INT          NOT NULL CHECK (aforo_maximo > 0),
    habilitado        BOOLEAN      NOT NULL DEFAULT FALSE,
    tipo_layout       VARCHAR(10)  NOT NULL DEFAULT 'GRID'
);

CREATE TABLE ACTIVO_LABORATORIO (
    id_activo         SERIAL       PRIMARY KEY,
    id_laboratorio    INT          NOT NULL REFERENCES LABORATORIO(id_laboratorio),
    id_tipo_activo    INT          NOT NULL REFERENCES TIPO_ACTIVO(id_tipo_activo),
    num_serie         VARCHAR(60)  NOT NULL UNIQUE,
    codigo_patrimonio VARCHAR(30),
    estado            VARCHAR(20)  NOT NULL DEFAULT 'Operativo'
                           CHECK (estado IN ('Operativo', 'Mantenimiento', 'Dado de baja')),
    updated_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
    fila              INT,
    columna           INT
);

CREATE TABLE HORARIO_DISPONIBLE (
    id_horario        SERIAL    PRIMARY KEY,
    id_laboratorio    INT       NOT NULL REFERENCES LABORATORIO(id_laboratorio),
    fecha             DATE      NOT NULL,
    hora_inicio       TIME      NOT NULL,
    hora_fin          TIME      NOT NULL,
    capacidad_total   INT       NOT NULL CHECK (capacidad_total > 0),
    capacidad_ocupada INT       NOT NULL DEFAULT 0 CHECK (capacidad_ocupada >= 0),
    estado            VARCHAR(20) NOT NULL DEFAULT 'Disponible'
                          CHECK (estado IN ('Disponible', 'Completo', 'Bloqueado')),
    CONSTRAINT uq_horario UNIQUE (id_laboratorio, fecha, hora_inicio),
    CONSTRAINT ck_horas   CHECK  (hora_fin > hora_inicio),
    CONSTRAINT ck_capacidad CHECK (capacidad_ocupada <= capacidad_total)
);

-- =============================================================================
-- ④ GESTIÓN DE RESERVAS
-- =============================================================================

CREATE TABLE RESERVA (
    id_reserva              SERIAL       PRIMARY KEY,
    id_usuario              INT          NOT NULL REFERENCES USUARIO(id_usuario),
    id_horario              INT          NOT NULL REFERENCES HORARIO_DISPONIBLE(id_horario),
    cantidad_alumnos        INT          NOT NULL CHECK (cantidad_alumnos > 0),
    acepto_declaracion_jurada BOOLEAN    NOT NULL DEFAULT FALSE,
    estado                  VARCHAR(20)  NOT NULL DEFAULT 'Programada'
                                CHECK (estado IN ('Programada', 'Cancelada', 'Completada', 'No-show', 'Pendiente')),
    created_at              TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE HISTORIAL_RESERVA (
    id_historial     SERIAL       PRIMARY KEY,
    id_reserva       INT          NOT NULL REFERENCES RESERVA(id_reserva) ON DELETE CASCADE,
    estado_anterior  VARCHAR(20)  NOT NULL,
    estado_nuevo     VARCHAR(20)  NOT NULL,
    fecha_cambio     TIMESTAMP    NOT NULL DEFAULT NOW(),
    usuario_cambio   INT          REFERENCES USUARIO(id_usuario) ON DELETE SET NULL,
    observacion      TEXT
);

CREATE TABLE RESERVA_DETALLE (
    id_detalle  SERIAL  PRIMARY KEY,
    id_reserva  INT     NOT NULL REFERENCES RESERVA(id_reserva)          ON DELETE CASCADE,
    id_activo   INT     NOT NULL REFERENCES ACTIVO_LABORATORIO(id_activo),
    CONSTRAINT uq_detalle UNIQUE (id_reserva, id_activo)
);

CREATE TABLE ASISTENCIA (
    id_asistencia  SERIAL     PRIMARY KEY,
    id_reserva     INT        NOT NULL UNIQUE REFERENCES RESERVA(id_reserva) ON DELETE CASCADE,
    hora_ingreso   TIMESTAMP,
    hora_salida    TIMESTAMP,
    asistio        BOOLEAN    NOT NULL DEFAULT FALSE,
    CONSTRAINT ck_horario_asistencia CHECK (
        hora_salida IS NULL OR hora_salida > hora_ingreso
    )
);

CREATE TABLE INCIDENCIA (
    id_incidencia       SERIAL       PRIMARY KEY,
    id_detalle          INT          NOT NULL REFERENCES RESERVA_DETALLE(id_detalle),
    id_activo           INT          NOT NULL REFERENCES ACTIVO_LABORATORIO(id_activo),
    descripcion_dano    TEXT         NOT NULL,
    fecha_reporte       TIMESTAMP    NOT NULL DEFAULT NOW(),
    estado_activo_post  VARCHAR(20)  NOT NULL
                            CHECK (estado_activo_post IN ('Mantenimiento', 'Dado de baja'))
);

-- =============================================================================
-- ⑤ PENALIZACIONES
-- =============================================================================

CREATE TABLE PENALIZACION (
    id_penalizacion  SERIAL     PRIMARY KEY,
    id_usuario       INT        NOT NULL REFERENCES USUARIO(id_usuario),
    id_reserva       INT        NOT NULL UNIQUE REFERENCES RESERVA(id_reserva),
    fecha_inicio     TIMESTAMP  NOT NULL DEFAULT NOW(),
    fecha_fin        TIMESTAMP  NOT NULL,
    CONSTRAINT ck_penalizacion_fechas CHECK (fecha_fin > fecha_inicio)
);

-- =============================================================================
-- ⑥ BITÁCORA Y SEGUIMIENTO
-- =============================================================================

CREATE TABLE HISTORIAL_MANTENIMIENTO (
    id_historial     SERIAL       PRIMARY KEY,
    id_activo        INT          NOT NULL REFERENCES ACTIVO_LABORATORIO(id_activo),
    estado_anterior  VARCHAR(20)  NOT NULL,
    estado_nuevo     VARCHAR(20)  NOT NULL,
    motivo           TEXT,
    id_incidencia    INT          REFERENCES INCIDENCIA(id_incidencia),
    fecha_cambio     TIMESTAMP    NOT NULL DEFAULT NOW(),
    registrado_por   INT          NOT NULL REFERENCES USUARIO(id_usuario)
);

-- =============================================================================
-- ⑦ CONFIGURACIÓN Y REGLAS DE NEGOCIO
-- =============================================================================

CREATE TABLE CONFIGURACION_SISTEMA (
    id_config         SERIAL       PRIMARY KEY,
    clave             VARCHAR(50)  NOT NULL UNIQUE,
    valor             TEXT         NOT NULL,
    descripcion       TEXT,
    updated_at        TIMESTAMP    DEFAULT NOW()
);

-- =============================================================================
-- ÍNDICES
-- =============================================================================
CREATE INDEX idx_horario_lab_fecha   ON HORARIO_DISPONIBLE(id_laboratorio, fecha);
CREATE INDEX idx_reserva_usuario     ON RESERVA(id_usuario);
CREATE INDEX idx_activo_lab_estado   ON ACTIVO_LABORATORIO(id_laboratorio, estado);
CREATE INDEX idx_penalizacion_usuario ON PENALIZACION(id_usuario, fecha_fin);

-- =============================================================================
-- FUNCIONES Y TRIGGERS
-- =============================================================================

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reserva_updated_at
    BEFORE UPDATE ON RESERVA
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_activo_updated_at
    BEFORE UPDATE ON ACTIVO_LABORATORIO
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Función para actualizar habilitación de laboratorio según mínimos
CREATE OR REPLACE FUNCTION fn_verificar_habilitacion_laboratorio()
RETURNS TRIGGER AS $$
DECLARE
    v_min_equipos        INT;
    v_tipo_equipo        VARCHAR(20);
    v_count_operativos   INT;
BEGIN
    SELECT tl.min_equipos, tl.tipo_equipo_minimo
    INTO v_min_equipos, v_tipo_equipo
    FROM LABORATORIO l
    JOIN TIPO_LABORATORIO tl ON l.id_tipo = tl.id_tipo
    WHERE l.id_laboratorio = NEW.id_laboratorio;

    SELECT COUNT(*)
    INTO v_count_operativos
    FROM ACTIVO_LABORATORIO al
    JOIN TIPO_ACTIVO ta ON al.id_tipo_activo = ta.id_tipo_activo
    WHERE al.id_laboratorio = NEW.id_laboratorio
      AND ta.nombre          = v_tipo_equipo
      AND al.estado          = 'Operativo';

    UPDATE LABORATORIO
    SET habilitado = (v_count_operativos >= v_min_equipos)
    WHERE id_laboratorio = NEW.id_laboratorio;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_verificar_habilitacion
    AFTER INSERT OR UPDATE OF estado ON ACTIVO_LABORATORIO
    FOR EACH ROW EXECUTE FUNCTION fn_verificar_habilitacion_laboratorio();

-- Función para validar que no se reserven equipos dañados
CREATE OR REPLACE FUNCTION fn_validar_activo_operativo()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM ACTIVO_LABORATORIO 
        WHERE id_activo = NEW.id_activo AND estado = 'Operativo'
    ) THEN
        RAISE EXCEPTION 'EL EQUIPO SELECCIONADO NO ESTÁ OPERATIVO PARA RESERVA.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_activo_reserva
    BEFORE INSERT ON RESERVA_DETALLE
    FOR EACH ROW EXECUTE FUNCTION fn_validar_activo_operativo();

-- =============================================================================
-- DATOS SEMILLA (seed) 
-- =============================================================================
INSERT INTO CONFIGURACION_SISTEMA (clave, valor, descripcion) VALUES
    ('SEMESTRE_ACTUAL', '2026-I', 'Semestre académico vigente'),
    ('DIAS_ANTICIPACION_RESERVA', '1', 'Días mínimos de anticipación para reservar'),
    ('MIN_ESTUDIANTES_RESERVA', '10', 'Mínimo de alumnos para habilitar reserva individual');

INSERT INTO ROL (nombre) VALUES ('estudiante'), ('docente'), ('admin_lab'), ('jefatura');
INSERT INTO TIPO_LABORATORIO (nombre, min_equipos, tipo_equipo_minimo) VALUES
    ('Cómputo',     10, 'CPU'),
    ('Electrónica',  3, 'Mesa'),
    ('Ambiental',    3, 'Mesa'),
    ('Física',       3, 'Mesa');
INSERT INTO CATEGORIA_ACTIVO (nombre, descripcion) VALUES 
    ('Cómputo',     'Equipos informáticos y periféricos'),
    ('Mobiliario',  'Muebles de laboratorio y oficina'),
    ('Redes',       'Equipos de redes y conectividad'),
    ('Electrónica', 'Instrumentos y componentes electrónicos'),
    ('Ciencias',    'Instrumentos de laboratorio de ciencias');

INSERT INTO TIPO_ACTIVO (id_categoria, nombre) VALUES 
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
    (5, 'Dinamómetro'), (5, 'Fuente DC'), (5, 'Cronómetro');
INSERT INTO FACULTAD (nombre) VALUES ('Facultad de Ingeniería y Gestión');
INSERT INTO CARRERA (id_facultad, nombre) VALUES
    (1, 'Ingeniería de Sistemas'),
    (1, 'Ingeniería Ambiental'),
    (1, 'Ingeniería Electrónica'),
    (1, 'Ingeniería Mecánica');
