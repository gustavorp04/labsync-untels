from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.hashers import check_password
from django.utils.crypto import get_random_string
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.contrib.auth.hashers import make_password
from .models import Usuario


# =========================
# LOGIN
# =========================
@api_view(['POST'])
def login(request):
    print("🔥 LOGIN HIT")
    print(request.data)

    usuario = request.data.get('usuario')
    password = request.data.get('password')
    rol_seleccionado = request.data.get('rol')

    try:
        user = Usuario.objects.get(codigo_universitario=usuario)
    except Usuario.DoesNotExist:
        return Response({'error': 'Usuario no existe'}, status=400)

    if not check_password(password, user.password_hash):
        return Response({'error': 'Contraseña incorrecta'}, status=400)

    if user.rol != rol_seleccionado:
        return Response({'error': 'Rol incorrecto'}, status=403)

    return Response({
        'mensaje': 'Login exitoso',
        'user_id': user.id,
        'nombre': user.nombre,
        'rol': user.rol
    })


# =========================
# FORGOT PASSWORD
# =========================
@api_view(['POST'])
def forgot_password(request):
    email = request.data.get("email")

    try:
        user = Usuario.objects.get(email=email)
    except Usuario.DoesNotExist:
        return Response({"error": "Email no existe"}, status=400)

    token = get_random_string(6).upper()

    # guardar token en BD
    user.reset_token = token
    user.save()

    # enviar correo
    send_reset_email(email, token)

    return Response({"mensaje": "Correo enviado"})


# =========================
# EMAIL RESET
# =========================
def send_reset_email(email, token):
    link = f"http://localhost:3000/reset-password?token={token}"

    subject = "Recuperación de contraseña"

    text_content = f"Usa este link para resetear tu contraseña: {link}"

    html_content = f"""
    <h2>Recuperación de contraseña</h2>
    <p>Haz clic en el botón para cambiar tu contraseña:</p>

    <a href="{link}" style="
        background-color:#4CAF50;
        color:white;
        padding:10px 20px;
        text-decoration:none;
        border-radius:5px;
        display:inline-block;
    ">
        Restablecer contraseña
    </a>

    <p>Si no pediste esto, ignora el mensaje.</p>
    """

    msg = EmailMultiAlternatives(
        subject,
        text_content,
        settings.EMAIL_HOST_USER,
        [email]
    )

    msg.attach_alternative(html_content, "text/html")
    msg.send()

@api_view(['POST'])
def reset_password(request):
    token = request.data.get("token")
    password = request.data.get("password")

    if not token or not password:
        return Response({"error": "Datos incompletos"}, status=400)

    try:
        user = Usuario.objects.get(reset_token=token)
    except Usuario.DoesNotExist:
        return Response({"error": "Token inválido"}, status=400)

    user.password_hash = make_password(password)
    user.reset_token = None
    user.save()

    return Response({"mensaje": "Contraseña actualizada"})