import asyncio
import aiohttp
import os
from dotenv import load_dotenv

load_dotenv()

async def test_tracker_cs2():
    """Тест Tracker.gg API для CS2"""
    
    # Тестовый Steam ID (можно использовать любой публичный)
    steam_id = "76561198084749679"  # Пример
    
    url = f"https://public-api.tracker.gg/v2/csgo/standard/profile/steam/{steam_id}"
    
    api_key = os.getenv("TRACKER_API_KEY", "")
    headers = {
        "TRN-Api-Key": api_key
    }
    
    print(f"API Key: {api_key}")
    print(f"URL: {url}")
    print()
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as response:
            print(f"Status: {response.status}")
            text = await response.text()
            print(f"Response: {text[:500]}")
            
            if response.status == 200:
                print("\n✓ API ключ работает для CS2!")
            elif response.status == 401:
                print("\n✗ API ключ не работает (401 Unauthorized)")
            elif response.status == 404:
                print("\n⚠ Профиль не найден, но API ключ принят")

if __name__ == "__main__":
    asyncio.run(test_tracker_cs2())
