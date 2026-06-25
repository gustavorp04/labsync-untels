FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV DJANGO_DEBUG False

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app/

# Recolectar estáticos con una SECRET_KEY temporal solo para el build
RUN SECRET_KEY="build-temp-key" python manage.py collectstatic --no-input

# Normalizar saltos de línea (por si se editó en Windows) y dar permisos de ejecución
RUN sed -i 's/\r$//' /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Al arrancar: migrate (aplica migraciones pendientes) y luego gunicorn
CMD ["/app/entrypoint.sh"]