# 🚀 LabSync UNTELS - Guía de Instalación Rápida

Sigue estos 4 pasos para tener el sistema funcionando en cualquier computadora.

### 📋 Requisitos Previos
*   Tener instalado **Docker Desktop**. [Descargar aquí](https://www.docker.com/products/docker-desktop/)

---

### 🛠️ Pasos para Iniciar

#### 1. Encender el sistema
Abre una terminal en la carpeta del proyecto y ejecuta:
```bash
docker-compose up --build
```
*Este paso crea la Base de Datos, el Backend y el Frontend automáticamente.*

#### 2. Sincronizar Base de Datos (Estructura)
Abre **otra terminal** y ejecuta estos dos comandos en orden:
```bash
# 1. Preparar las tablas
docker exec -it labsync_backend python manage.py makemigrations

# 2. Aplicar las tablas
docker exec -it labsync_backend python manage.py migrate
```

#### 3. Cargar datos de prueba (Usuarios y Labs)
En la misma terminal, ejecuta el script maestro:
```bash
docker exec -it labsync_backend python seed_completo.py
```

#### 4. ¡Listo para usar!
*   **Frontend (Panel):** [http://localhost:3000](http://localhost:3000)
*   **Backend (API):** [http://localhost:8000/api/](http://localhost:8000/api/)

---

### 🔑 Cuentas de Prueba

| Rol | Usuario (Código) | Contraseña |
| :--- | :--- | :--- |
| **Administrador** | `ADM0001` | `AdminLab_2026` |
| **Docente (Sistemas)** | `D0001` | `DocSist_2026` |
| **Estudiante (Fiorella)** | `2223010267` | `EstSist_2026` |

---
*Nota: Para usar tu correo personal `gustavorpd04@gmail.com`, la clave es `AdminLab_2026`.*
