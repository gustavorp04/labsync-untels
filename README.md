# 🧠 LabSync UNTELS - Gestión de Laboratorios

Sistema web profesional para la **gestión y reserva de aulas/laboratorios** en la UNTELS. Desarrollado con una arquitectura moderna desacoplada (Frontend/Backend) y preparado para escalabilidad.

---

## 📌 Descripción General
LabSync UNTELS centraliza la administración de recursos académicos, permitiendo a la comunidad universitaria:
- **Reservar laboratorios** de forma eficiente.
- **Gestionar activos** e incidencias en tiempo real.
- **Controlar accesos** mediante un sistema robusto de roles.
- **Recuperación segura de cuenta** mediante tokens dinámicos vía email.

---

## 🏗️ Arquitectura y Stack Tecnológico

### 🔙 Backend (API)
- **Python 3.12** + **Django REST Framework**
- **PostgreSQL**: Base de datos relacional (Esquema v2.0).
- **Sistema de Salud**: Endpoint de monitoreo real de servicios.

### 🔜 Frontend (UI)
- **React 19**
- **React Router Dom 7**: Gestión de navegación.
- **Axios**: Comunicación asíncrona con el backend.
- **Iconografía Profesional**: SVGs vectoriales integrados.

### 🔐 Seguridad & Servicios
- **Hashing de Contraseñas**: PBKDF2 (Nivel bancario).
- **SMTP Gmail**: Envío de correos de recuperación automáticos.
- **Protección de Rutas**: Middlewares en React para filtrado por rol.

---

## 🚀 Funcionalidades Clave

### 🛠️ Sistema de Salud (Health Check)
Implementamos un endpoint en `/api/health/` que realiza un **ping real** a la base de datos (`SELECT 1`). Esto permite monitorear la disponibilidad del sistema en tiempo real.

### 🔑 Recuperación de Contraseña
Flujo seguro integrado:
1. Solicitud de código vía email (Token de 6 dígitos).
2. Validación de expiración (15 minutos).
3. Cambio de clave con requisitos de complejidad (Mayúsculas, Números, Símbolos).

### 👁️ UX Mejorada
Inclusión de funcionalidad de **visualización de contraseñas** con iconos vectoriales en todos los formularios de autenticación.

---

## 📁 Estructura del Proyecto
```text
labsync-untels/
├── backend/                # Lógica del Servidor (Django)
│   ├── config/             # Configuración (settings, urls, wsgi)
│   ├── reservas/           # App principal (models, views, api)
│   └── manage.py           
├── frontend/               # Interfaz de Usuario (React)
│   ├── src/
│   │   ├── pages/auth/     # Login y Recuperación
│   │   ├── services/       # Conexión API
│   │   └── styles/         # Diseño CSS modular
│   └── package.json
└── .github/workflows/      # Pipeline de Integración Continua (CI)
```

---

## ⚙️ Configuración y Ejecución

### Requisitos
- Python 3.12+
- Node.js 18+
- PostgreSQL activo

### Instalación Rápida
1. **Backend:**
   ```bash
   cd backend
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py runserver
   ```
2. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm start
   ```

---

## 📌 Estado del Proyecto (Roadmap)
- [x] Sincronización con PostgreSQL (Esquema SQL 2.0)
- [x] Sistema de Health Check Pro
- [x] Iconografía Profesional SVG
- [x] Recuperación de cuenta vía Email
- [x] Pipeline CI (GitHub Actions) Configurado
- [ ] Dockerización del entorno
- [ ] Reportes estadísticos de uso de laboratorios

---
**Desarrollado para la UNTELS** - *Optimización y Control Académico*
