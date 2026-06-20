# LabSync UNTELS

Sistema integral para la gestión de reservas de laboratorios y auditoría de activos tecnológicos en la **Universidad Nacional Tecnológica de Lima Sur (UNTELS)**.

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Python 3.11 · Django 5.2.13 · Django REST Framework 3.17.1 |
| Frontend | React 19 · Axios · React Router |
| Base de datos | PostgreSQL 15 |
| Autenticación | httpOnly cookie (sesión propia, sin JWT externo) |
| Contenedores | Docker · Docker Compose |
| Deploy | Render (backend) · Vercel (frontend) |

## Estructura del repositorio

```
labsync-untels/
├── backend/
│   ├── config/             # settings.py, urls.py, wsgi/asgi
│   ├── reservas/
│   │   ├── models.py       # Modelos Django (todos en un solo archivo)
│   │   ├── views/          # Vistas por dominio (auth, reserva, laboratorio...)
│   │   ├── services/       # Lógica de negocio (auth_service, reserva_service, laboratorio_service)
│   │   ├── serializers/    # Serializers DRF por dominio
│   │   ├── migrations/     # Migraciones Django
│   │   └── utils/          # auth.py (permisos), logging_filters.py
│   ├── scripts sql/        # Schema y seeds PostgreSQL
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── pages/          # Por rol: estudiante/, docente/, admin/, jefatura/
│       ├── services/       # api.js, auth.js, reservaService.js, laboratorioService.js
│       └── components/     # LabMap, ProtectedRoute, ThemeToggle
├── docker-compose.yml
└── .env                    # Variables de entorno (NO commitear)
```

## Configuración rápida con Docker

### 1. Requisitos previos
- Docker Desktop instalado y corriendo
- Git

### 2. Clonar el repositorio

```bash
git clone https://github.com/gustavorp04/labsync-untels.git
cd labsync-untels
```

### 3. Crear el archivo `.env` en la raíz

```env
DB_PASS=tu_contraseña_segura
```

### 4. Levantar los servicios

```bash
docker-compose up -d --build
```

Esto inicia:
- **PostgreSQL 15** en `localhost:5432`
- **Django API** en `http://localhost:8000`
- **React dev server** en `http://localhost:3000`

### 5. Aplicar migraciones y cargar datos de prueba

```bash
# Migraciones (se ejecutan automáticamente al arrancar el backend, pero si falla:)
docker exec -it labsync_backend python manage.py migrate

# Cargar schema base
docker exec -i labsync_db psql -U postgres -d LabSyncUNTELS < "backend/scripts sql/labsync_schema.sql"

# Cargar datos de prueba
docker exec -i labsync_db psql -U postgres -d LabSyncUNTELS < "backend/scripts sql/seed_demo.sql"
docker exec -i labsync_db psql -U postgres -d LabSyncUNTELS < "backend/scripts sql/seed_laboratorios.sql"
```

### 6. Abrir la aplicación

Navega a [http://localhost:3000](http://localhost:3000)

## Configuración local sin Docker

### Backend

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt

# Variables de entorno mínimas
export DATABASE_URL=postgres://postgres:tu_pass@localhost:5432/LabSyncUNTELS
export DJANGO_DEBUG=True

python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
# Crea frontend/.env con la URL del backend:
echo "REACT_APP_API_URL=http://localhost:8000" > .env
npm start
```

## Credenciales de prueba

| Rol | Código | Contraseña | URL de login |
|---|---|---|---|
| Administrador de Lab | `ADM0001` | `AdminLab_2026` | `/login-admin` |
| Jefatura | `JEF0001` | `Jefatura_2026` | `/login-jefatura` |
| Docente | `D0001` | `DocSist_2026` | `/login-docente` |
| Estudiante | `202310001` | `EstSist_2026` | `/login-estudiante` |

> Credenciales adicionales de prueba en `backend/scripts sql/seed_demo.sql`.

## Funcionalidades principales

### Estudiantes
- Reserva de PC/puesto en laboratorio por horario disponible
- Declaración jurada al reservar
- Vista de mis reservas con estados en tiempo real
- Pantalla de penalización con cuenta regresiva (bloqueo de 2 semanas por no presentarse)

### Docentes
- Reserva prioritaria de laboratorio completo (desplaza reservas de estudiantes)
- Historial de reservas

### Administrador de Laboratorio
- Gestión de inventario de activos (PCs, monitores, periféricos)
- Cambio de estado de equipos con motivo e imagen opcional de evidencia
- Registro de incidencias con imagen opcional
- Inhabilitación de laboratorio completo con motivo e imagen opcional
- Validación de asistencia y marcado de no-show
- Cancelación de reservas

### Jefatura
- Dashboard con métricas de uso
- Descarga de reportes en Excel
- Supervisión de reservas y usuarios

### Sistema
- APScheduler para tareas automáticas: purga de pendientes expirados, notificaciones 24h antes, penalizaciones por no-show
- Emails automáticos con SMTP (Gmail)
- Rate limiting en endpoints de login (5 intentos/min)
- Sesiones via httpOnly cookie (resistente a XSS)

## Variables de entorno

| Variable | Descripción | Default dev |
|---|---|---|
| `SECRET_KEY` | Clave secreta Django | valor de desarrollo |
| `DATABASE_URL` | URL completa de PostgreSQL | — |
| `DJANGO_DEBUG` | Modo debug | `False` |
| `ALLOWED_HOSTS` | Hosts permitidos (separados por coma) | `localhost,127.0.0.1` |
| `CORS_ALLOWED_ORIGINS` | Orígenes CORS permitidos | `http://localhost:3000` |
| `EMAIL_HOST_USER` | Cuenta Gmail para envío de emails | — |
| `EMAIL_HOST_PASSWORD` | App Password de Gmail | — |

## Documentación de la API

Con el servidor corriendo, la documentación OpenAPI 3.0 está disponible en:

```
http://localhost:8000/api/docs/
```

## Licencia

Proyecto académico — UNTELS, Ciclo VIII, 2026.
