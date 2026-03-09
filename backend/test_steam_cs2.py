import asyncio
import aiohttp
import os
from dotenv import load_dotenv

load_dotenv()

async def test_steam_cs2():
    """Тест Steam API для CS2"""
    
    steam_key = os.getenv("STEAM_API_KEY", "")
    
    # Тестовые Steam ID
    test_ids = [
        "76561198084749679",
        "76561198000000000",
    ]
    
    print("="*60)
    print("ТЕСТ: Steam API для CS2")
    print("="*60)
    print(f"Steam API Key: {steam_key[:10]}...\n")
    
    for steam_id in test_ids:
        url = "https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v2/"
        params = {
            "key": steam_key,
            "steamid": steam_id,
            "appid": "730"  # CS:GO/CS2
        }
        
        print(f"Steam ID: {steam_id}")
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as response:
                print(f"Status: {response.status}")
                
                if response.status == 200:
                    print("✅ Steam API работает!")
                    data = await response.json()
                    
                    stats = data.get("playerstats", {}).get("stats", [])
                    if stats:
                        stats_dict = {stat["name"]: stat["value"] for stat in stats}
                        print(f"Total kills: {stats_dict.get('total_kills', 0)}")
                        print(f"Total deaths: {stats_dict.get('total_deaths', 0)}")
                        print(f"Total wins: {stats_dict.get('total_wins', 0)}")
                        break
                    else:
                        print("⚠️ Нет статистики")
                elif response.status == 403:
                    text = await response.text()
                    print(f"❌ 403 Forbidden: Профиль приватный или нет данных")
                    print(f"Response: {text[:200]}")
                else:
                    text = await response.text()
                    print(f"❌ Ошибка {response.status}: {text[:200]}")
                
                print()

if __name__ == "__main__":
    asyncio.run(test_steam_cs2())
