-- =============================================================================
-- LabSync UNTELS — Script DDL PostgreSQL
-- Versión: 2.1 (Modelo Corregido + cantidad_alumnos)
-- Asignatura: Desarrollo de Software — UNTELS 2026
-- =============================================================================

-- Limpiar esquema previo (orden inverso a las dependencias)
DROP TABLE IF EXISTS INCIDENCIA          CASCADE;
DROP TABLE IF EXISTS ASISTENCIA          CASCADE;
DROP TABLE IF EXISTS PENALIZACION        CASCADE;
DROP TABLE IF EXISTS RESERVA_DETALLE     CASCADE;
DROP TABLE IF EXISTS RESERVA             CASCADE;
DROP TABLE IF EXISTS HORARIO_DISPONIBLE  CASCADE;
DROP TABLE IF EXISTS ACTIVO_LABORATORIO  CASCADE;
DROP TABLE IF EXISTS LABORATORIO         CASCADE;
DROP TABLE IF EXISTS TIPO_ACTIVO         CASCADE;
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

CREATE TABLE TIPO_ACTIVO (
    id_tipo_activo  SERIAL       PRIMARY KEY,
    nombre          VARCHAR(50)  NOT NULL UNIQUE
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
    habilitado        BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE TABLE ACTIVO_LABORATORIO (
    id_activo         SERIAL       PRIMARY KEY,
    id_laboratorio    INT          NOT NULL REFERENCES LABORATORIO(id_laboratorio),
    id_tipo_activo    INT          NOT NULL REFERENCES TIPO_ACTIVO(id_tipo_activo),
    num_serie         VARCHAR(60)  NOT NULL UNIQUE,
    codigo_patrimonio VARCHAR(30),
    estado            VARCHAR(20)  NOT NULL DEFAULT 'Operativo'
                           CHECK (estado IN ('Operativo', 'Mantenimiento', 'Dado de baja')),
    updated_at        TIMESTAMP    NOT NULL DEFAULT NOW()
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
                                CHECK (estado IN ('Programada', 'Cancelada', 'Completada', 'No-show')),
    created_at              TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP    NOT NULL DEFAULT NOW()
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

-- =============================================================================
-- DATOS SEMILLA (seed) 
-- =============================================================================
INSERT INTO ROL (nombre) VALUES ('estudiante'), ('docente'), ('admin_lab'), ('jefatura');
INSERT INTO TIPO_LABORATORIO (nombre, min_equipos, tipo_equipo_minimo) VALUES
    ('Computación', 10, 'CPU'),
    ('Ambiental',    3, 'Mesa'),
    ('Electrónica',  3, 'Mesa');
INSERT INTO TIPO_ACTIVO (nombre) VALUES ('CPU'), ('Monitor'), ('Teclado'), ('Mouse'), ('Mesa'), ('Silla');
INSERT INTO FACULTAD (nombre) VALUES ('Facultad de Ingeniería y Gestión');
INSERT INTO CARRERA (id_facultad, nombre) VALUES
    (1, 'Ingeniería de Sistemas'),
    (1, 'Ingeniería Ambiental'),
    (1, 'Ingeniería Electrónica');