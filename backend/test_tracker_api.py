"""
Тест Tracker.gg API для получения статистики CS2
"""
import asyncio
import os
from dotenv import load_dotenv
from app.services.game_api_service import game_api_service

# Загружаем переменные окружения
load_dotenv()

async def test_tracker_api():
    """Тест получения статистики CS2"""
    
    # Тестовый Steam ID (можно заменить на свой)
    test_steam_id = "76561198012345678"
    
    print(f"Тестирование Tracker.gg API...")
    print(f"Steam ID: {test_steam_id}")
    print(f"API Key: {os.getenv('TRACKER_API_KEY', 'Not set')[:20]}...")
    print("-" * 50)
    
    # Получаем профиль Steam
    print("\n1. Получение профиля Steam...")
    profile = await game_api_service.get_steam_profile(test_steam_id)
    if profile:
        print(f"✓ Профиль найден: {profile.get('username')}")
        print(f"  Status: {profile.get('status')}")
    else:
        print("✗ Профиль не найден")
    
    # Получаем статистику CS2
    print("\n2. Получение статистики CS2...")
    stats = await game_api_service.get_cs2_stats(test_steam_id)
    if stats:
        print("✓ Статистика получена:")
        print(f"  Убийств: {stats.get('kills', 0):,}")
        print(f"  Смертей: {stats.get('deaths', 0):,}")
        print(f"  K/D: {stats.get('kd_ratio', 0):.2f}")
        print(f"  Побед: {stats.get('wins', 0):,}")
        print(f"  Винрейт: {stats.get('win_rate', 0):.1f}%")
        print(f"  MVP: {stats.get('mvps', 0):,}")
        print(f"  Хедшотов: {stats.get('headshots', 0):,}")
        print(f"  HS%: {stats.get('headshot_pct', 0):.1f}%")
        print(f"  Урон/раунд: {stats.get('damage_per_round', 0):.1f}")
        print(f"  Матчей: {stats.get('matches_played', 0):,}")
    else:
        print("✗ Статистика не найдена")
    
    print("\n" + "=" * 50)
    print("Тест завершен!")

if __name__ == "__main__":
    asyncio.run(test_tracker_api())
