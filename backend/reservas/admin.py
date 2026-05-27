from django.contrib import admin
from django.apps import apps

# Registra dinámicamente todos los modelos de la app 'reservas'
app = apps.get_app_config('reservas')

# N-07: Comentado registro dinámico de todos los modelos.
# Si se desea usar Django Admin, se deben registrar explícitamente los modelos
# y proveer una clase de autenticación apropiada, ya que Usuario no hereda de AbstractUser.
#
# for model_name, model in app.models.items():
#     try:
#         admin.site.register(model)
#     except admin.sites.AlreadyRegistered:
#         pass