"""
Сервис для работы с Twitch API
"""
import aiohttp
import asyncio
from typing import Optional, List, Dict
from datetime import datetime, timedelta
import os
import re

class TwitchService:
    """Сервис для работы с Twitch API"""
    
    def __init__(self):
        self.client_id = os.getenv('TWITCH_CLIENT_ID')
        self.client_secret = os.getenv('TWITCH_CLIENT_SECRET')
        self.access_token: Optional[str] = None
        self.token_expires_at: Optional[datetime] = None
    
    @staticmethod
    def extract_username_from_url(url: str) -> Optional[str]:
        """
        Извлечение username из Twitch URL
        
        Примеры:
        - twitch.tv/jak1lqa -> jak1lqa
        - https://twitch.tv/jak1lqa -> jak1lqa
        - https://www.twitch.tv/jak1lqa -> jak1lqa
        - jak1lqa -> jak1lqa
        """
        if not url:
            return None
        
        # Убираем пробелы
        url = url.strip()
        
        # Если это просто username без URL
        if '/' not in url and '.' not in url:
            return url.lower()
        
        # Паттерн для извлечения username из URL
        patterns = [
            r'twitch\.tv/([a-zA-Z0-9_]+)',
            r'www\.twitch\.tv/([a-zA-Z0-9_]+)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1).lower()
        
        return None
        
    async def get_access_token(self) -> str:
        """Получение OAuth токена для Twitch API"""
        # Если токен еще валиден, возвращаем его
        if self.access_token and self.token_expires_at and datetime.now() < self.token_expires_at:
            return self.access_token
        
        # Получаем новый токен
        url = 'https://id.twitch.tv/oauth2/token'
        params = {
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'grant_type': 'client_credentials'
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    self.access_token = data['access_token']
                    # Токен действителен expires_in секунд, ставим на 1 час меньше для запаса
                    expires_in = data.get('expires_in', 3600)
                    self.token_expires_at = datetime.now() + timedelta(seconds=expires_in - 3600)
                    return self.access_token
                else:
                    raise Exception(f"Failed to get Twitch token: {response.status}")
    
    async def get_streams(self, usernames: List[str]) -> Dict[str, dict]:
        """
        Получение информации о стримах для списка пользователей
        
        Returns:
            Dict где ключ - username, значение - данные стрима или None если оффлайн
        """
        if not usernames or not self.client_id:
            return {}
        
        try:
            token = await self.get_access_token()
            
            # Twitch API принимает до 100 user_login за раз
            url = 'https://api.twitch.tv/helix/streams'
            params = [('user_login', username.lower()) for username in usernames if username]
            
            headers = {
                'Client-ID': self.client_id,
                'Authorization': f'Bearer {token}'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        # Создаем словарь username -> stream_data
                        result = {username.lower(): None for username in usernames if username}
                        
                        for stream in data.get('data', []):
                            username = stream['user_login'].lower()
                            result[username] = {
                                'is_live': True,
                                'game_name': stream.get('game_name'),
                                'title': stream.get('title'),
                                'viewer_count': stream.get('viewer_count', 0),
                                'started_at': stream.get('started_at'),
                                'thumbnail_url': stream.get('thumbnail_url', '').replace('{width}', '440').replace('{height}', '248')
                            }
                        
                        return result
                    else:
                        print(f"Twitch API error: {response.status}")
                        return {}
        except Exception as e:
            print(f"Error fetching Twitch streams: {e}")
            return {}
    
    async def get_user_info(self, username: str) -> Optional[dict]:
        """Получение информации о пользователе Twitch"""
        if not username or not self.client_id:
            return None
        
        try:
            token = await self.get_access_token()
            
            url = 'https://api.twitch.tv/helix/users'
            params = {'login': username.lower()}
            headers = {
                'Client-ID': self.client_id,
                'Authorization': f'Bearer {token}'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        users = data.get('data', [])
                        if users:
                            user = users[0]
                            return {
                                'id': user['id'],
                                'login': user['login'],
                                'display_name': user['display_name'],
                                'profile_image_url': user.get('profile_image_url'),
                                'description': user.get('description', '')
                            }
            return None
        except Exception as e:
            print(f"Error fetching Twitch user info: {e}")
            return None
    
    async def get_full_streamer_info(self, twitch_url: str) -> Optional[dict]:
        """
        Получение полной информации о стримере по URL или username
        
        Returns:
            {
                'username': str,
                'display_name': str,
                'avatar_url': str,
                'description': str,
                'is_live': bool,
                'game': str (если онлайн),
                'viewer_count': int (если онлайн),
                'stream_title': str (если онлайн)
            }
        """
        username = self.extract_username_from_url(twitch_url)
        if not username:
            return None
        
        # Получаем инфо о пользователе
        user_info = await self.get_user_info(username)
        if not user_info:
            return None
        
        # Получаем инфо о стриме
        stream_info = await self.get_streams([username])
        stream_data = stream_info.get(username.lower())
        
        result = {
            'username': user_info['login'],
            'display_name': user_info['display_name'],
            'avatar_url': user_info['profile_image_url'],
            'description': user_info['description'],
            'is_live': stream_data is not None,
        }
        
        if stream_data:
            result.update({
                'game': stream_data['game_name'],
                'viewer_count': stream_data['viewer_count'],
                'stream_title': stream_data['title'],
                'thumbnail_url': stream_data['thumbnail_url']
            })
        
        return result


# Глобальный экземпляр сервиса
twitch_service = TwitchService()
