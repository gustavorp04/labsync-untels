FROM python:3.10-slim

# Evitar que Python genere archivos .pyc y que el buffer se sature
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

# Instalar dependencias del sistema necesarias para psycopg2
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias de Python
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el proyecto
COPY . /app/

# Cloud Run inyecta automáticamente la variable $PORT (usualmente 8080)
# Usamos workers y threads para manejar la alta concurrencia de la prueba
CMD gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 4 --threads 8
