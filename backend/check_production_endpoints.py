"""
Проверка доступных endpoints на production
"""
import asyncio
import aiohttp

async def check_endpoints():
    """Проверка всех endpoints"""
    
    base_url = "https://lesnayakomanda.onrender.com"
    
    endpoints = [
        "/health",
        "/api/game-stats/test",
        "/api/game-stats/my-accounts",
        "/api/game-stats/valorant/CJlOH/ZVZV/profile",
        "/api/game-stats/valorant/CJlOH/ZVZV/mmr",
        "/api/game-stats/steam/76561198084749679",
        "/api/game-stats/cs2/76561198084749679",
        "/api/game-stats/dota2/123456789/profile",
    ]
    
    print("="*70)
    print("ПРОВЕРКА ENDPOINTS НА PRODUCTION")
    print("="*70)
    print(f"Base URL: {base_url}\n")
    
    async with aiohttp.ClientSession() as session:
        for endpoint in endpoints:
            url = f"{base_url}{endpoint}"
            try:
                async with session.get(url) as response:
                    status = response.status
                    
                    if status == 200:
                        icon = "✅"
                    elif status == 404:
                        icon = "❌"
                    elif status == 401:
                        icon = "🔒"
                    else:
                        icon = "⚠️"
                    
                    print(f"{icon} {status} - {endpoint}")
                    
                    if status not in [200, 401, 404]:
                        text = await response.text()
                        print(f"   Response: {text[:100]}")
            except Exception as e:
                print(f"❌ ERROR - {endpoint}")
                print(f"   {str(e)[:100]}")
    
    print("\n" + "="*70)
    print("ЛЕГЕНДА")
    print("="*70)
    print("✅ 200 - Работает")
    print("🔒 401 - Требует авторизацию (нормально)")
    print("❌ 404 - Не найден (проблема)")
    print("⚠️  Другой статус - Проверить")

if __name__ == "__main__":
    asyncio.run(check_endpoints())
