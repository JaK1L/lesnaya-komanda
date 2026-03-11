"""
Тестирование Twitch API интеграции
"""
import asyncio
import os
from dotenv import load_dotenv
from app.services.twitch_service import twitch_service

load_dotenv()

async def test_twitch_api():
    """Тестирует работу Twitch API"""
    
    print("🔍 Тестирование Twitch API интеграции\n")
    
    # Проверяем наличие ключей
    client_id = os.getenv('TWITCH_CLIENT_ID')
    client_secret = os.getenv('TWITCH_CLIENT_SECRET')
    
    if not client_id or not client_secret:
        print("❌ TWITCH_CLIENT_ID или TWITCH_CLIENT_SECRET не найдены в .env")
        return
    
    print(f"✅ Client ID найден: {client_id[:10]}...")
    print(f"✅ Client Secret найден: {client_secret[:10]}...\n")
    
    # Тест 1: Получение токена
    print("📝 Тест 1: Получение OAuth токена")
    try:
        token = await twitch_service.get_access_token()
        print(f"✅ Токен получен: {token[:20]}...\n")
    except Exception as e:
        print(f"❌ Ошибка получения токена: {e}\n")
        return
    
    # Тест 2: Извлечение username из URL
    print("📝 Тест 2: Извлечение username из URL")
    test_urls = [
        "https://twitch.tv/jak1lqa",
        "https://www.twitch.tv/jak1lqa",
        "twitch.tv/jak1lqa",
        "jak1lqa"
    ]
    
    for url in test_urls:
        username = twitch_service.extract_username_from_url(url)
        print(f"  {url} → {username}")
    print()
    
    # Тест 3: Получение информации о пользователе
    print("📝 Тест 3: Получение информации о пользователе")
    test_username = "jak1lqa"
    
    try:
        user_info = await twitch_service.get_user_info(test_username)
        if user_info:
            print(f"✅ Пользователь найден:")
            print(f"  Username: {user_info['login']}")
            print(f"  Display Name: {user_info['display_name']}")
            print(f"  Avatar: {user_info['profile_image_url'][:50]}...")
            print(f"  Description: {user_info['description'][:100] if user_info['description'] else 'Нет описания'}")
        else:
            print(f"❌ Пользователь {test_username} не найден")
    except Exception as e:
        print(f"❌ Ошибка: {e}")
    print()
    
    # Тест 4: Получение полной информации о стримере
    print("📝 Тест 4: Получение полной информации о стримере")
    
    try:
        streamer_info = await twitch_service.get_full_streamer_info(f"https://twitch.tv/{test_username}")
        if streamer_info:
            print(f"✅ Полная информация получена:")
            print(f"  Username: {streamer_info['username']}")
            print(f"  Display Name: {streamer_info['display_name']}")
            print(f"  Avatar: {streamer_info['avatar_url'][:50]}...")
            print(f"  Description: {streamer_info['description'][:100] if streamer_info['description'] else 'Нет описания'}")
            print(f"  Is Live: {'🔴 ДА' if streamer_info['is_live'] else '⚫ НЕТ'}")
            
            if streamer_info['is_live']:
                print(f"  Game: {streamer_info.get('game', 'N/A')}")
                print(f"  Stream Title: {streamer_info.get('stream_title', 'N/A')}")
                print(f"  Viewers: {streamer_info.get('viewer_count', 0)}")
        else:
            print(f"❌ Не удалось получить информацию о стримере")
    except Exception as e:
        print(f"❌ Ошибка: {e}")
    print()
    
    # Тест 5: Получение информации о нескольких стримах
    print("📝 Тест 5: Получение информации о стримах")
    test_usernames = ["jak1lqa", "shroud", "xqc"]
    
    try:
        streams = await twitch_service.get_streams(test_usernames)
        print(f"✅ Проверено {len(test_usernames)} стримеров:")
        
        for username in test_usernames:
            stream_data = streams.get(username.lower())
            if stream_data:
                print(f"  🔴 {username} - ОНЛАЙН")
                print(f"     Игра: {stream_data.get('game_name', 'N/A')}")
                print(f"     Зрители: {stream_data.get('viewer_count', 0)}")
                print(f"     Название: {stream_data.get('title', 'N/A')[:50]}...")
            else:
                print(f"  ⚫ {username} - оффлайн")
    except Exception as e:
        print(f"❌ Ошибка: {e}")
    print()
    
    print("✅ Все тесты завершены!")
    print("\n💡 Если все тесты прошли успешно, Twitch API работает корректно!")
    print("   Теперь можно добавлять стримеров через админку.")


if __name__ == "__main__":
    asyncio.run(test_twitch_api())
