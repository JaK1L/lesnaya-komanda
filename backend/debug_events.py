"""Детальная отладка эндпоинта событий"""
import requests
import os
from dotenv import load_dotenv

load_dotenv('.env')

BASE_URL = "https://lesnayakomanda.onrender.com"

# Получаем токен
token_response = requests.post(
    f"{BASE_URL}/api/token",
    json={
        "username": os.getenv('ADMIN_USERNAME', 'LKBOSS322'),
        "password": os.getenv('ADMIN_PASSWORD', 'LKTEAMPASSWORD3228')
    }
)

if token_response.status_code != 200:
    print(f"❌ Не удалось получить токен: {token_response.status_code}")
    exit(1)

token = token_response.json()['access_token']
print(f"✅ Токен получен")

# Пробуем разные эндпоинты
endpoints = [
    "/api/admin/events",
    "/api/admin/news",
    "/api/admin/stats",
]

for endpoint in endpoints:
    print(f"\n🔍 Проверка {endpoint}...")
    try:
        response = requests.get(
            f"{BASE_URL}{endpoint}",
            headers={"Authorization": f"Bearer {token}"},
            params={"page": 1, "limit": 10} if "events" in endpoint or "news" in endpoint else {},
            timeout=10
        )
        print(f"  Статус: {response.status_code}")
        if response.status_code == 200:
            print(f"  ✅ Работает!")
            data = response.json()
            if isinstance(data, dict):
                print(f"  Данные: {list(data.keys())}")
        else:
            print(f"  ❌ Ошибка: {response.text[:200]}")
    except Exception as e:
        print(f"  ❌ Исключение: {e}")
