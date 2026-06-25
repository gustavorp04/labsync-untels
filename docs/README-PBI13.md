# LabSync UNTELS — Documentación de Arranque (Onboarding) y API

---

## 1. Requisitos Previos

> **Objetivo:** Garantizar que todo desarrollador cuente con el entorno necesario antes de clonar o iniciar el proyecto.

- **Docker Desktop**
  - Motor de contenedores necesario para ejecutar los servicios aislados (PostgreSQL, Django‑Gunicorn y React). Docker provee la red virtual que permite que el backend y el frontend se comuniquen mediante los puertos `8000` y `3000` sin conflictos de dependencias del host.
- **Git**
  - Control de versiones distribuido. Permite clonar el repositorio, gestionar ramas y aplicar cambios de manera colaborativa.
- **Python 3.10+**
  - Versión mínima requerida por Django 4.x y `drf‑spectacular`. Se usa para ejecutar el backend, instalar dependencias (`pip`), y correr scripts de inicialización.
- **Node.js (v16 o superior) con npm**
  - Entorno de ejecución para el cliente React. npm gestiona los paquetes JavaScript, compila el código fuente y sirve la UI en `http://localhost:3000`.

Cada uno de estos componentes debe estar accesible en el **PATH** del sistema operativo para que los comandos descritos más adelante se ejecuten sin errores.

---

## 2. Despliegue con Docker (Método Recomendado)

### 2.1. Clonar el repositorio
```bash
git clone https://github.com/gustavorp04/labsync-untels.git
cd labsync-untels
```

### 2.2. Configuración del archivo `.env`
En la raíz del proyecto debe existir **únicamente** el siguiente archivo:
```
DB_PASS=bdcontra
```
> **Nota técnica:** La variable `DATABASE_URL` **no** es proporcionada por el usuario. Docker‑Compose la genera automáticamente al combinar:
> - Host: `postgres`
> - Puerto: `5432`
> - Usuario: `labsync`
> - Contraseña: el valor de `DB_PASS`
> - Base de datos: `labsync`
> De modo que la cadena resultante tiene la forma:
> ````text
> postgres://labsync:bdcontra@postgres:5432/labsync
> ````
>
> Esta generación ocurre en tiempo de *compose* mediante la interpolación de variables de entorno, garantizando que la credencial nunca quede expuesta en el código fuente.

### 2.3. Construir y levantar los contenedores
```bash
docker-compose up -d --build
```
Este comando ejecuta los siguientes pasos internos:
1. **Construcción** de imágenes Docker para:
   - `backend` – basada en Python 3.10, instala dependencias (incluido `drf‑spectacular`) y configura Gunicorn como servidor WSGI.
   - `frontend` – basada en Node.js, ejecuta `npm install` y sirve la aplicación React.
   - `postgres` – imagen oficial de PostgreSQL 15.
2. **Creación** de la red `labsync_default` que conecta los contenedores.
3. **Inicialización** de volúmenes persistentes para la base de datos.
4. **Arranque** de los procesos:
   - `Gunicorn` (`/app/entrypoint.sh`) escuchando en **puerto 8000**.
   - `React dev server` escuchando en **puerto 3000**.
   - `PostgreSQL` escuchando en **puerto 5432** dentro de la red interna.

### 2.4. Poblado inicial de la base de datos (script *seed*)
```bash
docker exec -it labsync_backend sh -c "cd /app && PYTHONPATH=. python scripts/seed.py"
```
**Detalles del flujo interno:**
- El script `seed.py` **inicia una transacción atómica** que:
  1. **Elimina** (DROP) todas las tablas existentes para evitar residuos de instalaciones previas.
  2. **Ejecuta** los archivos SQL en el siguiente orden:
     - `labsync_schema.sql` – definición completa del esquema (tablas, índices, constraints).
     - `seed_demo.sql` – carga de usuarios de prueba: **estudiantes**, **docentes**, y **administrador**. Estos usuarios son críticos para pruebas de autenticación.
     - `seed_laboratorios.sql` – inserta datos de laboratorios y estaciones de trabajo.
  3. **Importa** el archivo CSV `backend/horarios.csv` mediante `COPY` para poblar la tabla de horarios.
- Cada paso registra información en la salida del contenedor, facilitando la auditoría de la carga.
- Al finalizar, la base de datos está lista para ser consumida por el backend.

### 2.5. URLs de acceso locales
- **Frontend (React):** `http://localhost:3000`
- **Backend (Django API):** `http://localhost:8000`
- **Swagger UI:** `http://localhost:8000/api/docs/`

---

## 3. Despliegue sin Docker (Entorno Local Nativo)

Esta ruta está pensada para desarrolladores que prefieren ejecutar los componentes directamente sobre el host, tanto en **Windows** como en **Linux/macOS**.

### 3.1. Preparar el entorno Python
```bash
# En Windows (PowerShell)
python -m venv venv
.\\venv\\Scripts\\Activate.ps1   # o Activate.bat para cmd
# En Linux/macOS
python3 -m venv venv
source venv/bin/activate
```
### 3.2. Instalar dependencias del backend
```bash
pip install -r backend/requirements.txt
```
### 3.3. Crear la base de datos PostgreSQL local
```sql
-- Ejecutar en psql (o PgAdmin)
CREATE DATABASE labsync;
CREATE USER labsync WITH PASSWORD 'bdcontra';
GRANT ALL PRIVILEGES ON DATABASE labsync TO labsync;
```
### 3.4. Definir la variable de entorno `DATABASE_URL`
```bash
# Windows PowerShell
$env:DATABASE_URL = "postgres://labsync:bdcontra@localhost:5432/labsync"
# Linux/macOS
export DATABASE_URL="postgres://labsync:bdcontra@localhost:5432/labsync"
```
> **Importante:** `DATABASE_URL` es la única variable que el backend consulta; el archivo `.env` sigue conteniendo solo `DB_PASS` para la composición con Docker.

### 3.5. Ejecutar migraciones y cargar datos iniciales
```bash
python manage.py migrate        # Genera tablas según el modelo Django
python scripts/seed.py          # Ejecuta el mismo flujo ATÓMICO descrito en la sección Docker
```
### 3.6. Levantar los servidores de desarrollo
- **Backend Django (puerto 8000)**
```bash
python manage.py runserver 0.0.0.0:8000
```
- **Frontend React (puerto 3000)**
```bash
cd frontend
npm install
npm start
```
### 3.7. Verificación rápida
- Acceder a `http://localhost:8000/api/docs/` para confirmar que Swagger está activo.
- Acceder a `http://localhost:3000` para observar la UI del cliente.

---

## 4. Documentación de la API (Swagger / OpenAPI con **drf‑spectacular**)

### 4.1. Visión general
La API está **expuesta bajo el estándar OpenAPI 3.0** mediante la librería **drf‑spectacular**. El endpoint interactivo está disponible en:
```
http://localhost:8000/api/docs/
```
Este portal muestra la especificación generada automáticamente a partir de los *viewsets*, *serializers* y *router* de Django Rest Framework.

### 4.2. Comportamiento real de los endpoints críticos
| Endpoint | Método | Estado sin autenticación (Swagger) | Comentario técnico |
|----------|--------|-----------------------------------|--------------------|
| `/api/auth/admin/login/` | `POST` | **400 Bad Request** – `{ "error": "Faltan datos obligatorios" }` | La vista **LoginView** requiere los campos `username` y `password`. Swagger no genera automáticamente un formulario de entrada porque la introspección del serializer marca los campos como `write_only`. Al enviar el cuerpo vacío el validador dispara el error de campos obligatorios.
| `/api/auth/estudiante/login/` | `POST` | **400 Bad Request** – mismo mensaje anterior. | Idéntico al login de admin; la ausencia de datos provoca la validación de `AuthenticationSerializer`.
| `/api/v1/laboratorios/{id_laboratorio}/` | `GET` | **403 Forbidden** – `{ "detail": "Authentication credentials were not provided." }` | Este endpoint está protegido por `CustomTokenAuthentication`. Sin token JWT o token de sesión, el permiso `IsAuthenticated` rechaza la solicitud.

### 4.3. Ingeniería de pruebas avanzadas – *Sesión compartida entre Frontend y Swagger*
Para validar el flujo completo (incluyendo autorización) sin generar tokens manualmente, se puede **aprovechar la cookie de sesión** que el frontend React establece al iniciar sesión:
1. **Iniciar sesión** en la aplicación React (`http://localhost:3000`). Use las credenciales de *admin* o *estudiante* que fueron creadas por `seed_demo.sql`.
2. **Abrir Swagger** en una nueva pestaña (`http://localhost:8000/api/docs/`).
3. **Refrescar** la pestaña de Swagger con **F5** para que el navegador envíe la cookie de sesión previamente obtenida al backend.
4. Navegar al endpoint `GET /api/v1/laboratorios/{id_laboratorio}/` dentro de la UI de Swagger.
5. Introducir un **ID válido** (por ejemplo `1`) y pulsar **Execute**.
6. El backend reconocerá la cookie de sesión, autorizará la solicitud y devolverá **200 OK** con el payload JSON que representa el laboratorio solicitado.

> **Nota de seguridad:** Esta técnica sólo funciona en entornos locales donde ambos servicios comparten el mismo dominio (`localhost`). En producción, los orígenes difieren y las cookies están restringidas por `SameSite`.

---

## 5. Buenas Prácticas y Tips finales
- **Versionado de la API:** Cada cambio mayor en la especificación debe acompañarse de un bump de la versión en `SPECTACULAR_SETTINGS['VERSION']`.
- **Control de credenciales:** Nunca commitear el archivo `.env`. Utilizar mecanismos de gestión de secretos (ex.: Docker secrets) para entornos productivos.
- **Testing:** Añadir pruebas unitarias para los *viewsets* protegidos y validar que los esquemas generados coinciden con los *schemas* esperados en CI.
- **Linting/Formatting:** Usar `black` y `isort` para mantener el código consistente.

---

*Documentado y preparado por el equipo LabSync UNTELS*
