"""
Валидация и санитизация входных данных
"""
import bleach
import re
from typing import Optional
from pydantic import field_validator
import logging

logger = logging.getLogger(__name__)

# Разрешенные HTML теги для контента
ALLOWED_TAGS = [
    'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre'
]

ALLOWED_ATTRIBUTES = {
    'a': ['href', 'title'],
    'img': ['src', 'alt', 'title'],
}

def sanitize_html(text: str) -> str:
    """
    Санитизация HTML контента
    Удаляет опасные теги и атрибуты, оставляя только безопасные
    """
    if not text:
        return text
    
    # Очистка HTML
    cleaned = bleach.clean(
        text,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        strip=True
    )
    
    # Удаление javascript: и data: ссылок
    cleaned = re.sub(r'javascript:', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'data:', '', cleaned, flags=re.IGNORECASE)
    
    return cleaned


def validate_url(url: Optional[str]) -> Optional[str]:
    """
    Валидация URL
    Проверяет что URL начинается с http:// или https://
    """
    if not url:
        return url
    
    url = url.strip()
    
    # Проверка протокола
    if not url.startswith(('http://', 'https://')):
        raise ValueError('URL должен начинаться с http:// или https://')
    
    # Проверка на javascript: и data:
    if 'javascript:' in url.lower() or 'data:' in url.lower():
        raise ValueError('Недопустимый URL')
    
    # Базовая проверка формата
    url_pattern = re.compile(
        r'^https?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
        r'localhost|'  # localhost...
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE)
    
    if not url_pattern.match(url):
        raise ValueError('Неверный формат URL')
    
    return url


def validate_discord_url(url: Optional[str]) -> Optional[str]:
    """Валидация Discord URL (invite или channel)"""
    if not url:
        return url
    
    url = url.strip()
    
    # Разрешенные паттерны Discord
    discord_patterns = [
        r'^https://discord\.gg/[a-zA-Z0-9]+$',
        r'^https://discord\.com/invite/[a-zA-Z0-9]+$',
        r'^https://discord\.com/channels/\d+/\d+$',
    ]
    
    for pattern in discord_patterns:
        if re.match(pattern, url):
            return url
    
    raise ValueError('Неверный формат Discord URL')


def validate_telegram_url(url: Optional[str]) -> Optional[str]:
    """Валидация Telegram URL"""
    if not url:
        return url
    
    url = url.strip()
    
    # Разрешенные паттерны Telegram
    telegram_patterns = [
        r'^https://t\.me/[a-zA-Z0-9_]+$',
        r'^https://telegram\.me/[a-zA-Z0-9_]+$',
    ]
    
    for pattern in telegram_patterns:
        if re.match(pattern, url):
            return url
    
    raise ValueError('Неверный формат Telegram URL')


class ContentValidationMixin:
    """Mixin для валидации контента в Pydantic моделях"""
    
    @field_validator('title', mode='before')
    @classmethod
    def validate_title(cls, v: str) -> str:
        """Валидация заголовка"""
        if not v or not v.strip():
            raise ValueError('Заголовок не может быть пустым')
        
        v = v.strip()
        
        if len(v) > 200:
            raise ValueError('Заголовок не может быть длиннее 200 символов')
        
        # Удаляем HTML теги из заголовка
        v = bleach.clean(v, tags=[], strip=True)
        
        return v
    
    @field_validator('content', mode='before')
    @classmethod
    def validate_content(cls, v: Optional[str]) -> Optional[str]:
        """Валидация и санитизация контента"""
        if not v:
            return v
        
        v = v.strip()
        
        if len(v) > 10000:
            raise ValueError('Контент не может быть длиннее 10000 символов')
        
        # Санитизация HTML
        v = sanitize_html(v)
        
        return v
    
    @field_validator('description', mode='before')
    @classmethod
    def validate_description(cls, v: Optional[str]) -> Optional[str]:
        """Валидация описания"""
        if not v:
            return v
        
        v = v.strip()
        
        if len(v) > 2000:
            raise ValueError('Описание не может быть длиннее 2000 символов')
        
        # Санитизация HTML
        v = sanitize_html(v)
        
        return v
