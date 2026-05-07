from django.contrib import admin
from django.apps import apps

# Registra dinámicamente todos los modelos de la app 'reservas'
app = apps.get_app_config('reservas')

for model_name, model in app.models.items():
    try:
        admin.site.register(model)
    except admin.sites.AlreadyRegistered:
        pass