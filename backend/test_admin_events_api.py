import requests
import os
from dotenv import load_dotenv

load_dotenv('.env')

# Получаем токен админа
def get_admin_token():
    """Получение токена админа"""
    response = requests.post(
        "https://gaming-komanda-api.onrender.com/api/token",
        data={
            "username": os.getenv('ADMIN_USERNAME', 'LKBOSS322'),
            "password": os.getenv('ADMIN_PASSWORD', 'LKTEAMPASSWORD3228')
        }
    )
    if response.status_code == 200:
        return response.json()['access_token']
    else:
        print(f"❌ Ошибка получения токена: {response.status_code}")
        print(response.text)
        return None

# Тестируем эндпоинт событий
def test_events_endpoint():
    """Тест эндпоинта /api/admin/events"""
    # Пробуем разные URL
    urls = [
        "https://gaming-komanda-api.onrender.com",
        "https://lesnayakomanda.onrender.com",
        "https://lesnayakomanda-backend.onrender.com"
    ]
    
    for base_url in urls:
        print(f"\n🔍 Проверка {base_url}...")
        try:
            health = requests.get(f"{base_url}/health", timeout=5)
            print(f"  ✅ Health: {health.status_code}")
            if health.status_code == 200:
                print(f"  📊 {health.json()}")
                # Нашли рабочий URL, пробуем получить токен
                token_response = requests.post(
                    f"{base_url}/api/token",
                    json={
                        "username": os.getenv('ADMIN_USERNAME', 'LKBOSS322'),
                        "password": os.getenv('ADMIN_PASSWORD', 'LKTEAMPASSWORD3228')
                    }
                )
                print(f"  📡 Токен: {token_response.status_code}")
                if token_response.status_code != 200:
                    print(f"  ❌ Ошибка: {token_response.text}")
                if token_response.status_code == 200:
                    token = token_response.json()['access_token']
                    print(f"  ✅ Токен получен!")
                    
                    # Запрос к событиям
                    events_response = requests.get(
                        f"{base_url}/api/admin/events",
                        headers={"Authorization": f"Bearer {token}"},
                        params={"page": 1, "limit": 50}
                    )
                    print(f"  📡 События: {events_response.status_code}")
                    if events_response.status_code != 200:
                        print(f"  ❌ Ошибка: {events_response.text[:500]}")
                    if events_response.status_code == 200:
                        data = events_response.json()
                        print(f"  ✅ Получено событий: {len(data.get('items', []))}")
                        return
                else:
                    print(f"  ❌ Токен: {token_response.status_code}")
        except Exception as e:
            print(f"  ❌ Ошибка: {e}")

if __name__ == "__main__":
    test_events_endpoint()
