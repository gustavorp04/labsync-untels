# 🚀 LabSync UNTELS - Guía de Instalación Rápida

Sigue estos pasos para tener el sistema funcionando perfectamente.

### 📋 Requisitos Previos
*   Tener instalado **Docker Desktop**.

---

### 🛠️ Pasos para Iniciar

#### Paso 0: Limpieza (VITAL si ya intentaste instalarlo antes)
Si ya intentaste levantar el sistema y te dio error, ejecuta este comando para limpiar la base de datos vieja:
```bash
docker-compose down -v
```
*(El `-v` borra los datos viejos que están causando conflicto).*

#### Paso 1: Encender el sistema
Abre una terminal en la carpeta del proyecto y ejecuta:
```bash
docker-compose up --build
```

#### Paso 2: Sincronizar Base de Datos (Estructura Limpia)
Abre **otra terminal** y ejecuta el comando de migración:
```bash
docker exec -it labsync_backend python manage.py migrate
```
*Si esto te pide hacer makemigrations, no es necesario, yo ya las subí listas para ti.*

#### Paso 3: Cargar datos de prueba
En la misma terminal, ejecuta el script maestro:
```bash
docker exec -it labsync_backend python seed_completo.py
```

#### Paso 4: ¡A disfrutar!
*   **Frontend (Panel):** [http://localhost:3000](http://localhost:3000)

---

### 🔑 Cuentas de Prueba

| Rol | Usuario (Código) | Contraseña |
| :--- | :--- | :--- |
| **Administrador** | `ADM0001` | `AdminLab_2026` |
| **Docente (Sistemas)** | `D0001` | `DocSist_2026` |
| **Estudiante (Fiorella)** | `2223010267` | `EstSist_2026` |

---
*Nota: Para usar tu correo personal `gustavorpd04@gmail.com`, la clave es `AdminLab_2026`.*
