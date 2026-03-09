import asyncio
import aiohttp

async def test_new_api_keys():
    """Тест новых API ключей"""
    
    tracker_key = "057f6380-58d8-4ed7-afcb-8a54c510c7c1"
    henrik_key = "HDEV-596140d5-102e-4faa-a2af-3cf68bc94b82"
    
    riot_id = "CJlOH"
    tag = "ZVZV"
    region = "eu"
    
    print("="*60)
    print("ТЕСТ 1: Tracker.gg API (CS2)")
    print("="*60)
    
    steam_id = "76561198084749679"
    url1 = f"https://public-api.tracker.gg/v2/csgo/standard/profile/steam/{steam_id}"
    headers1 = {"TRN-Api-Key": tracker_key}
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url1, headers=headers1) as response:
            print(f"URL: {url1}")
            print(f"Status: {response.status}")
            if response.status == 200:
                print("✅ Tracker.gg API работает!")
                data = await response.json()
                print(f"Data preview: {str(data)[:200]}...")
            else:
                text = await response.text()
                print(f"❌ Ошибка: {text[:200]}")
    
    print("\n" + "="*60)
    print("ТЕСТ 2: Henrik Dev API (Valorant Profile)")
    print("="*60)
    
    url2 = f"https://api.henrikdev.xyz/valorant/v1/account/{riot_id}/{tag}"
    headers2 = {"Authorization": henrik_key}
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url2, headers=headers2) as response:
            print(f"URL: {url2}")
            print(f"Status: {response.status}")
            if response.status == 200:
                print("✅ Henrik API работает!")
                data = await response.json()
                print(f"Data: {data}")
            else:
                text = await response.text()
                print(f"❌ Ошибка: {text[:200]}")
    
    print("\n" + "="*60)
    print("ТЕСТ 3: Henrik Dev API (Valorant MMR)")
    print("="*60)
    
    url3 = f"https://api.henrikdev.xyz/valorant/v2/mmr/{region}/{riot_id}/{tag}"
    headers3 = {"Authorization": henrik_key}
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url3, headers=headers3) as response:
            print(f"URL: {url3}")
            print(f"Status: {response.status}")
            if response.status == 200:
                print("✅ Henrik API MMR работает!")
                data = await response.json()
                print(f"Data: {data}")
            else:
                text = await response.text()
                print(f"❌ Ошибка: {text[:200]}")
    
    print("\n" + "="*60)
    print("ТЕСТ 4: Tracker.gg API (Valorant)")
    print("="*60)
    
    url4 = f"https://public-api.tracker.gg/v2/valorant/standard/profile/riot/{riot_id}%23{tag}"
    headers4 = {"TRN-Api-Key": tracker_key}
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url4, headers=headers4) as response:
            print(f"URL: {url4}")
            print(f"Status: {response.status}")
            if response.status == 200:
                print("✅ Tracker.gg Valorant API работает!")
                data = await response.json()
                print(f"Data preview: {str(data)[:200]}...")
            else:
                text = await response.text()
                print(f"❌ Ошибка: {text[:200]}")

if __name__ == "__main__":
    asyncio.run(test_new_api_keys())
