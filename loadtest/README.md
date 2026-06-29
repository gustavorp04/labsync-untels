# Pruebas de carga y concurrencia — LabSync UNTELS

Mide **cuánto aguanta** el sistema y verifica que la lógica de reservas **no
permite doble reserva** bajo concurrencia. Todo corre en **local** contra el
stack de `docker-compose`. No toca producción.

## Qué hay aquí

| Archivo | Para qué |
|---|---|
| `requirements.txt` | Instala Locust |
| `locustfile.py` | Los dos escenarios (carga y concurrencia) |
| `README.md` | Esto |
| `../backend/.../commands/seed_carga.py` | Comando Django que crea estudiantes/equipos/horario y los **tokens** |

> El comando escribe `backend/loadtest_tokens.json` (no se commitea). El
> locustfile lee ese archivo y autentica con `Authorization: Bearer`, así **no
> golpea el login** y evita el límite de 5 intentos/min por IP que rompería el test.

## Pasos

### 1. Levantar el sistema en local
```bash
docker-compose up -d --build
```
El backend corre con **gunicorn (2 workers)**, parecido a producción.

### 2. Preparar datos + tokens (una vez)
```bash
docker exec -it labsync_backend python manage.py seed_carga
# opciones: --count 200  --activos 300  --dias 2
```
Crea 200 estudiantes (`LOAD0001`…`LOAD0200`), asegura un laboratorio con ≥300
equipos operativos y un horario reservable, y genera `backend/loadtest_tokens.json`.

### 3. Instalar Locust (en el host, no en Docker)
```bash
pip install -r loadtest/requirements.txt
```

### 4A. Escenario CARGA — ¿cuánto aguanta?
Mayormente lecturas (horarios, mapa de equipos) + reservas a equipos variados.
```bash
locust -f loadtest/locustfile.py CargaUser --host http://localhost:8000
```
Abre **http://localhost:8089**, pon **Number of users = 200**, **Spawn rate = 20**,
y observa en vivo: peticiones/seg (RPS), latencia p95 y % de fallos.

Sin interfaz (genera CSV):
```bash
locust -f loadtest/locustfile.py CargaUser --host http://localhost:8000 \
       --headless -u 200 -r 20 -t 5m --csv=loadtest/resultado
```

### 4B. Escenario CONCURRENCIA — ¿se rompe la integridad?
Los 200 usuarios reservan **el mismo equipo** a la vez. El resultado correcto es
**exactamente 1 reserva creada (201)** y el resto rechazado (409). Así se valida
el `select_for_update()` de `crear_reserva_estudiante`.
```bash
locust -f loadtest/locustfile.py ConcurrenciaUser --host http://localhost:8000 \
       --headless -u 200 -r 200 -t 1m
```
Luego confirma en la BD que solo hay UNA reserva activa para ese equipo+horario:
```bash
docker exec -it labsync_db psql -U postgres -d LabSyncUNTELS -c \
"SELECT id_activo, COUNT(*) FROM reserva_detalle rd \
 JOIN reserva r ON r.id_reserva=rd.id_reserva \
 WHERE r.estado IN ('Programada','Pendiente') GROUP BY id_activo HAVING COUNT(*)>1;"
```
Si **no devuelve filas**, no hubo doble reserva. ✅

## Cómo leer los resultados

| Métrica | Sano | Alerta |
|---|---|---|
| Latencia p95 | < 500 ms | > 1.5 s |
| % de fallos (5xx) | < 1 % | > 5 % |
| RPS al subir usuarios | sube y se estabiliza | se aplana o cae |

Nota: en el escenario de carga, las respuestas **409** cuentan como éxito (son
reglas de negocio: equipo ya tomado o el alumno ya reservó ese bloque), no errores.

## Cosas a vigilar en local

- **Conexiones PostgreSQL:** con 200 usuarios puedes topar `max_connections`
  (100 por defecto). Si ves *"too many connections"*, ese es tu límite real.
- **Caché por worker:** sin `REDIS_URL`, cada worker de gunicorn tiene su
  `LocMemCache`. Para el test no afecta la corrección, solo la tasa de aciertos.
- **Limpieza:** los estudiantes `LOAD####` quedan en la BD. Re-ejecutar
  `seed_carga` refresca los tokens sin duplicarlos.
