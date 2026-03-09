import asyncio
import aiohttp
import os
from dotenv import load_dotenv

load_dotenv()

async def test_steam_profile():
    """Тест Steam API для получения профиля"""
    
    steam_key = os.getenv("STEAM_API_KEY", "")
    steam_id = "76561198084749679"
    
    print("="*60)
    print("ТЕСТ 1: Steam Profile Summary")
    print("="*60)
    
    # Тест 1: Получение профиля
    url1 = "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/"
    params1 = {
        "key": steam_key,
        "steamids": steam_id
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url1, params=params1) as response:
            print(f"Status: {response.status}")
            if response.status == 200:
                data = await response.json()
                print("✅ Профиль получен!")
                players = data.get("response", {}).get("players", [])
                if players:
                    player = players[0]
                    print(f"Name: {player.get('personaname')}")
                    print(f"Profile URL: {player.get('profileurl')}")
                    print(f"Avatar: {player.get('avatarfull')}")
            else:
                text = await response.text()
                print(f"❌ Ошибка: {text[:200]}")
    
    print("\n" + "="*60)
    print("ТЕСТ 2: CS2 Stats (GetUserStatsForGame)")
    print("="*60)
    
    # Тест 2: Статистика CS2
    url2 = "https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v2/"
    params2 = {
        "key": steam_key,
        "steamid": steam_id,
        "appid": "730"
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url2, params=params2) as response:
            print(f"Status: {response.status}")
            if response.status == 200:
                data = await response.json()
                print("✅ Статистика получена!")
                stats = data.get("playerstats", {}).get("stats", [])
                print(f"Количество статистик: {len(stats)}")
                if stats:
                    # Показываем первые 5
                    for stat in stats[:5]:
                        print(f"  {stat['name']}: {stat['value']}")
            else:
                text = await response.text()
                print(f"❌ Ошибка: {text[:200]}")
                
                # Если 403, значит профиль приватный
                if response.status == 403:
                    print("\n⚠️ Профиль приватный или игровая статистика скрыта")

if __name__ == "__main__":
    asyncio.run(test_steam_profile())
