"""
Connection Manager для управления WebSocket соединениями
"""
from fastapi import WebSocket
from typing import Dict, List
from datetime import datetime, timedelta
import logging
import json
import asyncio
from typing import Optional

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Управление активными WebSocket соединениями с rate limiting и message batching"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        # IP -> список timestamp подключений для rate limiting
        self.connection_attempts: Dict[str, List[datetime]] = {}
        self.rate_limit_window = timedelta(minutes=1)
        self.max_connections_per_minute = 5
        
        # Message batching
        self.message_buffer: List[dict] = []
        self.batch_window_ms = 50  # 50ms окно для батчинга
        self.batch_task: Optional[asyncio.Task] = None
    
    def check_rate_limit(self, ip_address: str) -> bool:
        """
        Проверить rate limit для IP адреса
        Возвращает True если можно подключиться, False если превышен лимит
        """
        now = datetime.now()
        
        # Инициализируем список для нового IP
        if ip_address not in self.connection_attempts:
            self.connection_attempts[ip_address] = []
        
        # Удаляем старые попытки за пределами временного окна
        self.connection_attempts[ip_address] = [
            timestamp for timestamp in self.connection_attempts[ip_address]
            if now - timestamp < self.rate_limit_window
        ]
        
        # Проверяем количество попыток
        if len(self.connection_attempts[ip_address]) >= self.max_connections_per_minute:
            logger.warning(f"Rate limit exceeded for IP: {ip_address}")
            return False
        
        # Добавляем текущую попытку
        self.connection_attempts[ip_address].append(now)
        return True
    
    async def add_connection(self, websocket: WebSocket, client_id: str, ip_address: str) -> None:
        """
        Добавить новое соединение в список активных
        
        Args:
            websocket: WebSocket соединение
            client_id: Уникальный идентификатор клиента
            ip_address: IP адрес клиента
        """
        self.active_connections[client_id] = websocket
        logger.info(f"WebSocket connected: {client_id}, IP: {ip_address}, Total connections: {len(self.active_connections)}")
    
    def remove_connection(self, client_id: str) -> None:
        """
        Удалить соединение из списка активных
        
        Args:
            client_id: Уникальный идентификатор клиента
        """
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            logger.info(f"WebSocket disconnected: {client_id}, Total connections: {len(self.active_connections)}")
    
    def get_active_connections(self) -> Dict[str, WebSocket]:
        """
        Получить все активные соединения
        
        Returns:
            Словарь с активными соединениями {client_id: websocket}
        """
        return self.active_connections
    
    async def broadcast_message(self, message: dict) -> None:
        """
        Отправить сообщение всем активным клиентам
        Реализует error isolation - ошибка одного клиента не влияет на других
        
        Args:
            message: Словарь с данными для отправки (будет сериализован в JSON)
        """
        disconnected_clients = []
        
        for client_id, websocket in self.active_connections.items():
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Broadcast failed to client {client_id}: {e}")
                disconnected_clients.append(client_id)
        
        # Удаляем отключенные соединения
        for client_id in disconnected_clients:
            self.remove_connection(client_id)
    
    def get_connection_count(self) -> int:
        """Получить количество активных соединений"""
        return len(self.active_connections)
    
    async def _flush_batch(self) -> None:
        """Отправить накопленные сообщения"""
        if not self.message_buffer:
            return
        
        # Если одно сообщение - отправляем как есть
        if len(self.message_buffer) == 1:
            await self.broadcast_message(self.message_buffer[0])
        else:
            # Несколько сообщений - отправляем как batch
            batch_message = {
                "type": "batch",
                "timestamp": datetime.now().isoformat(),
                "messages": self.message_buffer
            }
            await self.broadcast_message(batch_message)
        
        self.message_buffer = []
        self.batch_task = None
    
    async def queue_message(self, message: dict) -> None:
        """
        Добавить сообщение в очередь для батчинга
        Сообщения будут отправлены через batch_window_ms миллисекунд
        
        Args:
            message: Словарь с данными для отправки
        """
        self.message_buffer.append(message)
        
        # Если batch task еще не запущен, запускаем
        if self.batch_task is None:
            self.batch_task = asyncio.create_task(self._batch_timer())
    
    async def _batch_timer(self) -> None:
        """Таймер для батчинга сообщений"""
        await asyncio.sleep(self.batch_window_ms / 1000)
        await self._flush_batch()
