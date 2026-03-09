import asyncio
import aiohttp
import os
from dotenv import load_dotenv

load_dotenv()

async def test_tracker_api():
    """Тест Tracker.gg API для Valorant"""
    
    riot_id = "CJlOH"
    tag = "ZVZV"
    
    # Тест 1: Стандартный endpoint
    url1 = f"https://public-api.tracker.gg/v2/valorant/standard/profile/riot/{riot_id}%23{tag}"
    
    # Тест 2: Попробуем без региона в URL
    url2 = f"https://public-api.tracker.gg/v2/valorant/standard/profile/riot/{riot_id}#{tag}"
    
    headers = {
        "TRN-Api-Key": os.getenv("TRACKER_API_KEY", "")
    }
    
    print(f"API Key set: {bool(headers['TRN-Api-Key'])}")
    print(f"API Key: {headers['TRN-Api-Key'][:10]}..." if headers['TRN-Api-Key'] else "No API Key")
    print()
    
    async with aiohttp.ClientSession() as session:
        # Тест 1
        print(f"Test 1: {url1}")
        async with session.get(url1, headers=headers) as response:
            print(f"Status: {response.status}")
            text = await response.text()
            print(f"Response: {text[:500]}")
            print()
        
        # Тест 2
        print(f"Test 2: {url2}")
        async with session.get(url2, headers=headers) as response:
            print(f"Status: {response.status}")
            text = await response.text()
            print(f"Response: {text[:500]}")
            print()
        
        # Тест 3: Henrik API (fallback)
        url3 = f"https://api.henrikdev.xyz/valorant/v1/account/{riot_id}/{tag}"
        print(f"Test 3 (Henrik): {url3}")
        async with session.get(url3) as response:
            print(f"Status: {response.status}")
            text = await response.text()
            print(f"Response: {text[:500]}")

if __name__ == "__main__":
    asyncio.run(test_tracker_api())
