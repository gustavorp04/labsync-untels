# 🚀 LabSync UNTELS - Guía de Instalación Rápida

Sigue estos 4 pasos para tener el sistema funcionando en cualquier computadora en menos de 5 minutos.

### 📋 Requisitos Previos
*   Tener instalado **Docker Desktop**. [Descargar aquí](https://www.docker.com/products/docker-desktop/)

---

### 🛠️ Pasos para Iniciar

#### 1. Encender los motores
Abre una terminal en la carpeta del proyecto y ejecuta:
```bash
docker-compose up --build
```
*Espera a que las letras dejen de moverse. Esto crea la Base de Datos, el Backend y el Frontend automáticamente.*

#### 2. Crear las tablas (Estructura)
Sin cerrar la terminal anterior, abre una **nueva terminal** y escribe:
```bash
docker exec -it labsync_backend python manage.py migrate
```

#### 3. Llenar de vida el sistema (Datos de prueba)
En la misma terminal, ejecuta el script maestro:
```bash
docker exec -it labsync_backend python seed_completo.py
```

#### 4. ¡A probar!
*   **Frontend (Panel):** [http://localhost:3000](http://localhost:3000)
*   **Backend (API):** [http://localhost:8000/api/](http://localhost:8000/api/)

---

### 🔑 Cuentas de Prueba (Para entrar ya mismo)

| Rol | Usuario (Código) | Contraseña |
| :--- | :--- | :--- |
| **Administrador** | `ADM0001` | `AdminLab_2026` |
| **Docente (Sistemas)** | `D0001` | `DocSist_2026` |
| **Estudiante (Fiorella)** | `2223010267` | `EstSist_2026` |
| **Jefatura** | `JEF0001` | `Jefatura_2026` |

---
*Nota: Si necesitas entrar con tu correo personal, usa `gustavorpd04@gmail.com` con la clave `AdminLab_2026`.*
