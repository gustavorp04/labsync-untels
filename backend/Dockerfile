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

# Al arrancar: migrate, inyectar coordenadas de mapas (seed), luego gunicorn
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8080", "--workers", "4", "--threads", "8"]
