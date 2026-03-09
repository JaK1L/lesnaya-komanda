import asyncio
import aiohttp

async def test_tracker_headers():
    """Тест разных вариантов заголовков для Tracker.gg"""
    
    tracker_key = "057f6380-58d8-4ed7-afcb-8a54c510c7c1"
    steam_id = "76561198084749679"
    url = f"https://public-api.tracker.gg/v2/csgo/standard/profile/steam/{steam_id}"
    
    print("="*60)
    print("ТЕСТ: Разные варианты заголовков Tracker.gg")
    print("="*60)
    print(f"API Key: {tracker_key}\n")
    
    # Разные варианты заголовков
    header_variants = [
        {"TRN-Api-Key": tracker_key},
        {"trn-api-key": tracker_key},
        {"X-API-Key": tracker_key},
        {"Authorization": f"Bearer {tracker_key}"},
        {"Authorization": tracker_key},
        {"Api-Key": tracker_key},
        {"apikey": tracker_key},
    ]
    
    async with aiohttp.ClientSession() as session:
        for i, headers in enumerate(header_variants, 1):
            print(f"Вариант {i}: {list(headers.keys())[0]}")
            
            async with session.get(url, headers=headers) as response:
                print(f"Status: {response.status}")
                
                if response.status == 200:
                    print("✅ РАБОТАЕТ! Этот формат заголовка правильный!")
                    data = await response.json()
                    print(f"Data preview: {str(data)[:100]}...")
                    break
                elif response.status == 401:
                    text = await response.text()
                    print(f"❌ 401: {text[:100]}")
                elif response.status == 404:
                    print("⚠️ 404: Профиль не найден (но ключ принят)")
                    break
                else:
                    text = await response.text()
                    print(f"❌ {response.status}: {text[:100]}")
                
                print()

if __name__ == "__main__":
    asyncio.run(test_tracker_headers())
