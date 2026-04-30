import re
import logging

class PIIMaskingFilter(logging.Filter):
    """
    Filtro de logging para cumplir con el PBI-18 (Privacidad).
    Busca patrones de PII (Emails, Códigos, Nombres) y los seudonimiza.
    """
    
    # Patrones comunes de PII en LabSync
    PATTERNS = {
        # Email: usuario@dominio.com -> u******@dominio.com
        'email': r'[\w\.-]+@[\w\.-]+\.\w+',
        # Código Universitario: 2023100267 -> 2023******
        'codigo': r'\b\d{10}\b|\b[A-Z]{3}\d{4}\b|\b[D]\d{4}\b',
    }

    def filter(self, record):
        if not isinstance(record.msg, str):
            return True
            
        message = record.msg
        
        # 1. Seudonimizar Emails
        message = re.sub(self.PATTERNS['email'], self._mask_email, message)
        
        # 2. Seudonimizar Códigos Universitarios
        message = re.sub(self.PATTERNS['codigo'], self._mask_code, message)
        
        record.msg = message
        return True

    def _mask_email(self, match):
        email = match.group(0)
        user, domain = email.split('@')
        if len(user) <= 1:
            return f"*@{domain}"
        return f"{user[0]}{'*' * 5}@{domain}"

    def _mask_code(self, match):
        code = match.group(0)
        if len(code) <= 4:
            return "****"
        return f"{code[:4]}{'*' * (len(code)-4)}"
