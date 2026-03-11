"""
Сервис для работы с Telegram API
Получает последние посты из публичного канала
"""
import os
import aiohttp
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

class TelegramService:
    def __init__(self):
        self.bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
        self.channel_username = os.getenv('TELEGRAM_CHANNEL_USERNAME', 'lesnayakomanda')
        self.base_url = f'https://api.telegram.org/bot{self.bot_token}'
    
    async def get_latest_post_id(self) -> Optional[int]:
        """
        Получает ID последнего поста из канала
        """
        if not self.bot_token:
            print("⚠️ TELEGRAM_BOT_TOKEN не установлен в .env")
            return None
        
        try:
            async with aiohttp.ClientSession() as session:
                # Получаем информацию о канале
                url = f'{self.base_url}/getChat'
                params = {'chat_id': f'@{self.channel_username}'}
                
                async with session.get(url, params=params) as response:
                    if response.status != 200:
                        print(f"❌ Ошибка получения канала: {response.status}")
                        return None
                    
                    data = await response.json()
                    if not data.get('ok'):
                        print(f"❌ Telegram API error: {data.get('description')}")
                        return None
                
                # Получаем последние сообщения из канала
                # Используем getUpdates для получения последних постов
                url = f'{self.base_url}/getUpdates'
                params = {
                    'offset': -1,
                    'limit': 1,
                    'allowed_updates': ['channel_post']
                }
                
                async with session.get(url, params=params) as response:
                    if response.status != 200:
                        return None
                    
                    data = await response.json()
                    if not data.get('ok') or not data.get('result'):
                        # Если getUpdates не работает, пробуем альтернативный метод
                        # Получаем последний пост через RSS или используем фиксированный ID
                        return await self._get_latest_via_rss()
                    
                    # Получаем ID последнего сообщения
                    updates = data['result']
                    if updates and len(updates) > 0:
                        channel_post = updates[0].get('channel_post')
                        if channel_post:
                            return channel_post.get('message_id')
                    
                    return None
                    
        except Exception as e:
            print(f"❌ Ошибка при получении последнего поста: {e}")
            return None
    
    async def _get_latest_via_rss(self) -> Optional[int]:
        """
        Альтернативный метод получения последнего поста через RSS
        """
        try:
            # Telegram RSS feed format: https://t.me/s/CHANNEL_NAME
            rss_url = f'https://t.me/s/{self.channel_username}'
            
            async with aiohttp.ClientSession() as session:
                async with session.get(rss_url) as response:
                    if response.status != 200:
                        return None
                    
                    html = await response.text()
                    
                    # Ищем последний пост в HTML
                    # Формат: data-post="lesnayakomanda/123"
                    import re
                    matches = re.findall(r'data-post="[^/]+/(\d+)"', html)
                    
                    if matches:
                        # Берем максимальный ID (последний пост)
                        post_ids = [int(m) for m in matches]
                        return max(post_ids)
                    
                    return None
                    
        except Exception as e:
            print(f"❌ Ошибка при парсинге RSS: {e}")
            return None
    
    async def get_channel_info(self) -> Dict[str, Any]:
        """
        Получает информацию о канале
        """
        try:
            latest_post_id = await self.get_latest_post_id()
            
            return {
                'channel_username': self.channel_username,
                'latest_post_id': latest_post_id,
                'widget_url': f'https://t.me/{self.channel_username}/{latest_post_id}' if latest_post_id else None
            }
        except Exception as e:
            print(f"❌ Ошибка получения информации о канале: {e}")
            return {
                'channel_username': self.channel_username,
                'latest_post_id': None,
                'widget_url': None
            }


# Singleton instance
telegram_service = TelegramService()
