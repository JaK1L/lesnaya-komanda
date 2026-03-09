"""
Тест Valorant API на production
"""
import asyncio
import aiohttp

async def test_production():
    """Тест production API"""
    
    base_url = "https://lesnayakomanda.onrender.com"
    riot_id = "CJlOH"
    tag = "ZVZV"
    
    print("="*60)
    print("ТЕСТ PRODUCTION VALORANT API")
    print("="*60)
    print(f"Base URL: {base_url}\n")
    
    # Тест 1: Health check
    print("1. Health Check")
    print("-" * 60)
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(f"{base_url}/health") as response:
                print(f"Status: {response.status}")
                if response.status == 200:
                    print("✅ Backend работает")
                else:
                    print("❌ Backend не отвечает")
        except Exception as e:
            print(f"❌ Ошибка подключения: {e}")
    
    print("\n2. Valorant Profile")
    print("-" * 60)
    url = f"{base_url}/api/game-stats/valorant/{riot_id}/{tag}/profile"
    print(f"URL: {url}")
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(url) as response:
                print(f"Status: {response.status}")
                text = await response.text()
                
                if response.status == 200:
                    print("✅ Valorant Profile API работает!")
                    print(f"Response: {text[:200]}...")
                elif response.status == 404:
                    print("❌ 404: Endpoint не найден")
                    print("Возможно, старая версия кода на production")
                elif response.status == 500:
                    print("❌ 500: Ошибка сервера")
                    print(f"Response: {text[:500]}")
                else:
                    print(f"❌ Неожиданный статус: {response.status}")
                    print(f"Response: {text[:500]}")
        except Exception as e:
            print(f"❌ Ошибка запроса: {e}")
    
    print("\n3. Valorant MMR")
    print("-" * 60)
    url = f"{base_url}/api/game-stats/valorant/{riot_id}/{tag}/mmr"
    print(f"URL: {url}")
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(url) as response:
                print(f"Status: {response.status}")
                text = await response.text()
                
                if response.status == 200:
                    print("✅ Valorant MMR API работает!")
                    print(f"Response: {text[:200]}...")
                else:
                    print(f"❌ Статус: {response.status}")
                    print(f"Response: {text[:500]}")
        except Exception as e:
            print(f"❌ Ошибка запроса: {e}")
    
    print("\n" + "="*60)
    print("РЕКОМЕНДАЦИИ")
    print("="*60)
    print("Если API не работает:")
    print("1. Зайти на https://dashboard.render.com")
    print("2. Открыть сервис lesnayakomanda-backend")
    print("3. Проверить логи (Logs)")
    print("4. Проверить Environment Variables")
    print("5. Вручную перезапустить сервис (Manual Deploy)")

if __name__ == "__main__":
    asyncio.run(test_production())
