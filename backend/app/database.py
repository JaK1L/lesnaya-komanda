"""
Модуль для работы с базой данных
"""
import asyncio
import asyncpg
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional
from .config import settings


class Database:
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
        self._connect_lock: Optional[asyncio.Lock] = None

    def _get_lock(self) -> asyncio.Lock:
        if self._connect_lock is None:
            self._connect_lock = asyncio.Lock()
        return self._connect_lock

    async def connect(self):
        """Создание пула соединений"""
        # Убираем channel_binding из URL, т.к. asyncpg его не поддерживает
        db_url = settings.DATABASE_URL.replace('&channel_binding=require', '').replace('?channel_binding=require&', '?').replace('?channel_binding=require', '')

        self.pool = await asyncpg.create_pool(
            db_url,
            min_size=5,
            max_size=20,
            command_timeout=60
        )

    async def disconnect(self):
        """Закрытие пула соединений"""
        if self.pool:
            await self.pool.close()

    @asynccontextmanager
    async def get_connection(self) -> AsyncGenerator[asyncpg.Connection, None]:
        """Контекстный менеджер для получения соединения"""
        if not self.pool:
            async with self._get_lock():
                if not self.pool:
                    await self.connect()

        async with self.pool.acquire() as connection:
            yield connection


# Глобальный экземпляр базы данных
database = Database()


# Зависимость для получения соединения
async def get_db():
    async with database.get_connection() as conn:
        yield conn