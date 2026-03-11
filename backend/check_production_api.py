"""
Проверка production API endpoints
"""
import asyncio
import aiohttp
import sys

PRODUCTION_URL = "https://lesnayakomanda.onrender.com"

async def check_endpoint(session, endpoint, method="GET"):
    """Проверить один endpoint"""
    url = f"{PRODUCTION_URL}{endpoint}"
    try:
        async with session.request(method, url, timeout=aiohttp.ClientTimeout(total=30)) as response:
            status = response.status
            if status == 200:
                print(f"✅ {method} {endpoint} - OK ({status})")
                return True
            else:
                print(f"⚠️  {method} {endpoint} - {status}")
                return False
    except asyncio.TimeoutError:
        print(f"⏱️  {method} {endpoint} - TIMEOUT")
        return False
    except Exception as e:
        print(f"❌ {method} {endpoint} - ERROR: {e}")
        return False

async def main():
    """Проверить все важные endpoints"""
    print(f"🔍 Проверка Production API: {PRODUCTION_URL}\n")
    
    endpoints = [
        # Публичные endpoints
        ("/api/news", "GET"),
        ("/api/events", "GET"),
        ("/api/streamers", "GET"),
        ("/api/team", "GET"),
        ("/api/merch", "GET"),
        
        # Health check
        ("/", "GET"),
        ("/api/docs", "GET"),
    ]
    
    async with aiohttp.ClientSession() as session:
        results = []
        for endpoint, method in endpoints:
            result = await check_endpoint(session, endpoint, method)
            results.append(result)
            await asyncio.sleep(0.5)  # Небольшая задержка между запросами
        
        print(f"\n📊 Результат: {sum(results)}/{len(results)} endpoints работают")
        
        if sum(results) == len(results):
            print("✅ Все endpoints работают корректно!")
            sys.exit(0)
        else:
            print("⚠️  Некоторые endpoints не работают")
            sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
