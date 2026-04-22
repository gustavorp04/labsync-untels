# reservas/urls.py
from django.urls import path
from .views import login
from .views import health_check

urlpatterns = [
    path('login/', login),
    path('health/', health_check),
    
]