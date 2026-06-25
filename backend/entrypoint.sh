#!/bin/sh
set -e

# Aplicar migraciones pendientes contra la BD real (Cloud Run inyecta DATABASE_URL).
# Sin este paso, un deploy que incluya migraciones nuevas (p. ej. 0009_image_fields)
# deja la BD sin las columnas que el código espera -> 500 en /laboratorios, /reservas, etc.
echo "==> Aplicando migraciones..."
python manage.py migrate --no-input

echo "==> Iniciando gunicorn..."
exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:8080 \
    --workers 2 \
    --threads 4 \
    --worker-class gthread \
    --timeout 120
