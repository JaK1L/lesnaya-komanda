"""
Rate limiting middleware для защиты от DDoS и брутфорса
"""
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
import logging

logger = logging.getLogger(__name__)

# Создаем limiter
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200/minute"],  # Глобальный лимит
    storage_uri="memory://",  # Можно заменить на Redis: "redis://localhost:6379"
)

def setup_rate_limiting(app):
    """Настройка rate limiting для приложения"""
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    logger.info("✅ Rate limiting настроен: 200 запросов/минуту (глобально)")
