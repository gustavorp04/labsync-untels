"""Validaciones reutilizables de entrada (S-8)."""

# Límite de tamaño y tipos permitidos para imágenes subidas (incidencias,
# inhabilitaciones, mantenimiento). Evita DoS por subida de archivos enormes
# y rechaza contenido que no sea una imagen esperada (CWE-434).
MAX_IMAGEN_BYTES = 5 * 1024 * 1024  # 5 MB
EXTENSIONES_IMAGEN_PERMITIDAS = ('.jpg', '.jpeg', '.png', '.webp')
CONTENT_TYPES_IMAGEN_PERMITIDOS = ('image/jpeg', 'image/png', 'image/webp')


def validar_imagen(imagen):
    """Valida un archivo subido (UploadedFile) que se espera sea una imagen.

    Devuelve un mensaje de error (str) si no es válida, o None si está OK o si
    no se subió ninguna imagen (la imagen es opcional en los endpoints).
    """
    if imagen is None:
        return None

    if imagen.size > MAX_IMAGEN_BYTES:
        return f"La imagen supera el tamaño máximo permitido ({MAX_IMAGEN_BYTES // (1024 * 1024)} MB)."

    nombre = (imagen.name or '').lower()
    if not nombre.endswith(EXTENSIONES_IMAGEN_PERMITIDAS):
        return "Formato de imagen no permitido. Use JPG, PNG o WEBP."

    content_type = getattr(imagen, 'content_type', '') or ''
    if content_type and content_type not in CONTENT_TYPES_IMAGEN_PERMITIDOS:
        return "El tipo de contenido de la imagen no es válido."

    return None
