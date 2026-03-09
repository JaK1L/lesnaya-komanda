import asyncio
import aiohttp
import os
from dotenv import load_dotenv

load_dotenv()

async def test_different_headers():
    """Тест разных вариантов заголовков для Tracker.gg API"""
    
    riot_id = "CJlOH"
    tag = "ZVZV"
    url = f"https://public-api.tracker.gg/v2/valorant/standard/profile/riot/{riot_id}%23{tag}"
    
    api_key = os.getenv("TRACKER_API_KEY", "")
    print(f"API Key: {api_key}")
    print()
    
    # Разные варианты заголовков
    header_variants = [
        {"TRN-Api-Key": api_key},
        {"trn-api-key": api_key},
        {"X-API-Key": api_key},
        {"Authorization": f"Bearer {api_key}"},
        {"Authorization": api_key},
        {"Api-Key": api_key},
    ]
    
    async with aiohttp.ClientSession() as session:
        for i, headers in enumerate(header_variants, 1):
            print(f"Test {i}: {headers}")
            async with session.get(url, headers=headers) as response:
                print(f"Status: {response.status}")
                text = await response.text()
                print(f"Response: {text[:200]}")
                print()
                
                if response.status == 200:
                    print("✓ SUCCESS! This header format works!")
                    break

if __name__ == "__main__":
    asyncio.run(test_different_headers())
