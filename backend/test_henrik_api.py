import asyncio
import aiohttp

async def test_henrik_api():
    """Тест Henrik API для Valorant"""
    
    riot_id = "CJlOH"
    tag = "ZVZV"
    region = "eu"
    
    # Тест 1: Профиль
    url1 = f"https://api.henrikdev.xyz/valorant/v1/account/{riot_id}/{tag}"
    print(f"Test 1 - Profile: {url1}")
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url1) as response:
            print(f"Status: {response.status}")
            if response.status == 200:
                data = await response.json()
                print(f"✓ Profile found!")
                print(f"Data: {data}")
            else:
                text = await response.text()
                print(f"✗ Error: {text}")
        
        print("\n" + "="*50 + "\n")
        
        # Тест 2: MMR
        url2 = f"https://api.henrikdev.xyz/valorant/v2/mmr/{region}/{riot_id}/{tag}"
        print(f"Test 2 - MMR: {url2}")
        
        async with session.get(url2) as response:
            print(f"Status: {response.status}")
            if response.status == 200:
                data = await response.json()
                print(f"✓ MMR found!")
                print(f"Data: {data}")
            else:
                text = await response.text()
                print(f"✗ Error: {text}")

if __name__ == "__main__":
    asyncio.run(test_henrik_api())
