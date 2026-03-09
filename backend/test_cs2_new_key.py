import asyncio
import aiohttp

async def test_cs2_tracker():
    """Тест Tracker.gg API для CS2 с новым ключом"""
    
    tracker_key = "057f6380-58d8-4ed7-afcb-8a54c510c7c1"
    
    # Тестовые Steam ID (публичные профили)
    test_ids = [
        "76561198084749679",  # Пример 1
        "76561198000000000",  # Пример 2
    ]
    
    print("="*60)
    print("ТЕСТ: Tracker.gg API для CS2")
    print("="*60)
    
    for steam_id in test_ids:
        url = f"https://public-api.tracker.gg/v2/csgo/standard/profile/steam/{steam_id}"
        headers = {"TRN-Api-Key": tracker_key}
        
        print(f"\nSteam ID: {steam_id}")
        print(f"URL: {url}")
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                print(f"Status: {response.status}")
                
                if response.status == 200:
                    print("✅ API работает!")
                    data = await response.json()
                    
                    # Проверяем структуру данных
                    segments = data.get("data", {}).get("segments", [])
                    if segments:
                        overview = segments[0].get("stats", {})
                        print(f"Kills: {overview.get('kills', {}).get('value', 0)}")
                        print(f"Deaths: {overview.get('deaths', {}).get('value', 0)}")
                        print(f"K/D: {overview.get('kd', {}).get('value', 0)}")
                    break  # Если нашли рабочий профиль, выходим
                elif response.status == 404:
                    print("⚠️ Профиль не найден (404)")
                elif response.status == 401:
                    text = await response.text()
                    print(f"❌ Ошибка авторизации: {text[:200]}")
                    break  # Если ключ не работает, нет смысла продолжать
                else:
                    text = await response.text()
                    print(f"❌ Ошибка {response.status}: {text[:200]}")

if __name__ == "__main__":
    asyncio.run(test_cs2_tracker())
