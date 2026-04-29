# LabSync UNTELS 🔬💻

Sistema integral para la gestión de reservas de laboratorios y auditoría de activos tecnológicos en la **Universidad Nacional Tecnológica de Lima Sur (UNTELS)**.

## 🏗️ Arquitectura del Sistema
El proyecto sigue un patrón de **Arquitectura Desacoplada (Client-Server)**:
- **Frontend:** Single Page Application (SPA) desarrollada con React.js.
- **Backend:** API REST robusta construida con Django Rest Framework (DRF).
- **Base de Datos:** PostgreSQL para almacenamiento relacional persistente.
- **Contenedores:** Orquestación completa mediante Docker y Docker Compose.

## 📁 Estructura del Directorio
```text
reserva_aulas/
├── backend/                # Lógica de servidor y API REST (Django)
│   ├── config/             # Configuración central del proyecto
│   ├── reservas/           # Aplicación principal (Modelos, Vistas, Serializadores)
│   └── seed_completo.py    # Script maestro de carga de datos
├── frontend/               # Interfaz de usuario (React)
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── pages/          # Vistas principales (Admin, Docente, Estudiante)
│   │   └── services/       # Comunicación con la API
├── scripts sql/            # Scripts oficiales de Base de Datos (Schema & Seeds)
└── docker-compose.yml      # Configuración de contenedores
```

## 🛠️ Tecnologías Utilizadas
- **Backend:** Python 3.10+, Django 5.x, Django Rest Framework.
- **Frontend:** React 18, Hooks (useState, useEffect), Axios.
- **Base de Datos:** PostgreSQL 15.
- **DevOps:** Docker, GitHub Actions (CI/CD).

## 🚀 Instalación y Uso

### Clonar el repositorio
```bash
git clone https://github.com/gustavorp04/labsync-untels.git
cd labsync-untels
```

### Ejecución con Docker
1. Levantar los servicios:
   ```bash
   docker-compose up -d --build
   ```
2. Poblar la base de datos con datos reales de la universidad:
   ```bash
   docker exec -it labsync_backend python seed_completo.py
   ```

## 👥 Roles del Sistema
1. **Administrador de Laboratorio:** Gestión de incidencias, validación de reservas y auditoría de equipos.
2. **Jefatura de Laboratorio:** Supervisión general y reportes de uso.
3. **Docente:** Reserva de ambientes para clases extra y laboratorios libres.
4. **Estudiante:** Consulta de disponibilidad y gestión de perfil.

## 🔑 Credenciales de Prueba
- **Administrador:** `ADM0001` / `AdminLab_2026`
- **Docente:** `D0001` / `DocSist_2026`
- **Estudiante:** `202310001` / `EstSist_2026`

## 📄 Licencia
Este proyecto es de uso académico para la UNTELS - Ciclo VIII.
