"""
Тест Discord Elite API
"""
import asyncio
import aiohttp

async def test_elite():
    """Проверка elite endpoint"""
    
    url = "https://lesnayakomanda.onrender.com/api/discord/elite"
    
    print("="*60)
    print("ТЕСТ DISCORD ELITE API")
    print("="*60)
    print(f"URL: {url}\n")
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            print(f"Status: {response.status}")
            
            if response.status == 200:
                data = await response.json()
                print(f"\nВсего пользователей элиты: {len(data)}")
                print("\nПользователи:")
                print("-" * 60)
                
                for user in data:
                    status_icon = "🟢" if user['is_online'] else "🔴"
                    print(f"{status_icon} {user['discord_username']}")
                    print(f"   Status: {user['status']}")
                    print(f"   Is Online: {user['is_online']}")
                    print(f"   Rating: {user['rating']}")
                    print()
                
                online_count = sum(1 for u in data if u['is_online'])
                print(f"Онлайн: {online_count} из {len(data)}")
            else:
                text = await response.text()
                print(f"Ошибка: {text}")

if __name__ == "__main__":
    asyncio.run(test_elite())
