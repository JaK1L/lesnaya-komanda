"""
WebSocket endpoint для real-time обновлений Discord
"""
from fastapi import WebSocket, WebSocketDisconnect, status
from ..services.connection_manager import ConnectionManager
from ..services.discord_monitor import DiscordMonitor
from ..database import database
from datetime import datetime
import logging
import json

logger = logging.getLogger(__name__)

# Глобальный экземпляр менеджера соединений
manager = ConnectionManager()


async def discord_websocket(websocket: WebSocket, token: str = None):
    """
    WebSocket endpoint для Discord real-time updates
    
    Query Parameters:
        token: Authentication token (required)
    
    Connection Flow:
        1. Validate token
        2. Accept connection
        3. Send initial state
        4. Listen for heartbeat pongs
        5. Broadcast updates
        6. Handle disconnect
    """
    # Получаем IP адрес клиента
    client_host = websocket.client.host if websocket.client else "unknown"
    
    # Проверка rate limit
    if not manager.check_rate_limit(client_host):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        logger.warning(f"Rate limit exceeded: {client_host}")
        return
    
    # Проверка наличия токена
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        logger.warning(f"Authentication failed: {client_host}, missing token")
        return
    
    # TODO: Добавить валидацию токена через auth.validate_token()
    # Пока принимаем любой непустой токен для базовой функциональности
    
    # Генерируем уникальный ID для клиента
    client_id = f"{client_host}_{id(websocket)}"
    
    try:
        # Принимаем соединение и добавляем в активные
        await websocket.accept()
        await manager.add_connection(websocket, client_id, client_host)
        
        # Получаем соединение с БД и создаем Discord Monitor
        async with database.get_connection() as conn:
            monitor = DiscordMonitor(conn)
            
            # Отправляем initial state
            initial_state = await monitor.get_initial_state()
            await websocket.send_json({
                "type": "initial_state",
                "timestamp": datetime.now().isoformat(),
                "data": initial_state
            })
            logger.info(f"Sent initial state to {client_id}")
        
        # Слушаем сообщения от клиента (heartbeat pongs)
        while True:
            data = await websocket.receive_text()
            
            # Обработка heartbeat pong
            try:
                message = json.loads(data)
                if message.get("type") == "pong":
                    logger.debug(f"Received pong from {client_id}")
            except json.JSONDecodeError:
                logger.warning(f"Invalid JSON from {client_id}: {data}")
            
    except WebSocketDisconnect:
        manager.remove_connection(client_id)
        logger.info(f"Client {client_id} disconnected normally")
    except Exception as e:
        manager.remove_connection(client_id)
        logger.error(f"Error in WebSocket connection {client_id}: {e}")
