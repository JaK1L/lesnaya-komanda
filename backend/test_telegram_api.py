"""
Тест Telegram API для получения последнего поста
"""
import asyncio
import sys
import os

# Добавляем путь к модулям
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.telegram_service import telegram_service


async def test_telegram_api():
    """Тестирует получение последнего поста из Telegram"""
    
    print("🔍 Тестирование Telegram API...")
    print(f"📱 Канал: @{telegram_service.channel_username}")
    print(f"🤖 Токен бота: {'✅ Установлен' if telegram_service.bot_token else '❌ Не установлен'}")
    print()
    
    # Получаем информацию о канале
    print("📡 Получение информации о канале...")
    channel_info = await telegram_service.get_channel_info()
    
    print("\n📊 Результат:")
    print(f"  Channel: {channel_info['channel_username']}")
    print(f"  Latest Post ID: {channel_info['latest_post_id']}")
    print(f"  Widget URL: {channel_info['widget_url']}")
    
    if channel_info['latest_post_id']:
        print(f"\n✅ Успешно! Последний пост: {channel_info['latest_post_id']}")
        print(f"🔗 Ссылка: https://t.me/{channel_info['channel_username']}/{channel_info['latest_post_id']}")
        print(f"\n📝 Для виджета используй:")
        print(f"   data-telegram-post=\"{channel_info['channel_username']}/{channel_info['latest_post_id']}\"")
    else:
        print("\n⚠️ Не удалось получить ID последнего поста")
        print("Возможные причины:")
        print("  1. Бот не добавлен в канал как админ")
        print("  2. Канал приватный")
        print("  3. Неправильный токен бота")
        print("\nПопробуй:")
        print("  1. Открой @BotFather")
        print("  2. Найди своего бота")
        print("  3. Добавь бота админом в канал @lesnayakomanda")


if __name__ == "__main__":
    asyncio.run(test_telegram_api())
