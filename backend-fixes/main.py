from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, streamers, news  # твои роуты
import os

app = FastAPI()

# ─── CORS ──────────────────────────────────────────────────────────
# Читаем из переменных окружения — так безопаснее и гибче
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000"          # fallback для локальной разработки
).split(",")

# Продакшн origins добавляем явно, чтобы не забыть
PRODUCTION_ORIGINS = [
    "https://lesnaya-komanda.vercel.app",
    "https://www.lesnaya-komanda.vercel.app",
]

all_origins = list(set(ALLOWED_ORIGINS + PRODUCTION_ORIGINS))

app.add_middleware(
    CORSMiddleware,
    allow_origins=all_origins,       # только конкретные домены, НЕ "*"
    allow_credentials=True,          # нужно для JWT-кук
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
    expose_headers=["X-Total-Count"], # если используешь пагинацию
    max_age=600,                      # браузер кэширует preflight 10 минут
)

# ─── Твои роуты ────────────────────────────────────────────────────
app.include_router(auth.router,      prefix="/api/auth",      tags=["auth"])
app.include_router(streamers.router, prefix="/api/streamers", tags=["streamers"])
app.include_router(news.router,      prefix="/api/news",      tags=["news"])

@app.get("/health")
async def health():
    return {"status": "ok"}
