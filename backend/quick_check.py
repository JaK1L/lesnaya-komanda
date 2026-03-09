"""Быстрая проверка статуса API"""
import requests
import os
from dotenv import load_dotenv

load_dotenv('.env')

BASE_URL = "https://lesnayakomanda.onrender.com"

print("🔍 Быстрая проверка API...\n")

# 1. Health check
try:
    health = requests.get(f"{BASE_URL}/health", timeout=5)
    if health.status_code == 200:
        print("✅ API работает")
    else:
        print(f"❌ API недоступен: {health.status_code}")
        exit(1)
except Exception as e:
    print(f"❌ API недоступен: {e}")
    exit(1)

# 2. Получение токена
try:
    token_response = requests.post(
        f"{BASE_URL}/api/token",
        json={
            "username": os.getenv('ADMIN_USERNAME', 'LKBOSS322'),
            "password": os.getenv('ADMIN_PASSWORD', 'LKTEAMPASSWORD3228')
        },
        timeout=5
    )
    if token_response.status_code == 200:
        token = token_response.json()['access_token']
        print("✅ Авторизация работает")
    else:
        print(f"❌ Ошибка авторизации: {token_response.status_code}")
        exit(1)
except Exception as e:
    print(f"❌ Ошибка авторизации: {e}")
    exit(1)

# 3. Проверка эндпоинта событий
try:
    events_response = requests.get(
        f"{BASE_URL}/api/admin/events",
        headers={"Authorization": f"Bearer {token}"},
        params={"page": 1, "limit": 50},
        timeout=10
    )
    if events_response.status_code == 200:
        data = events_response.json()
        print(f"✅ Эндпоинт событий работает!")
        print(f"📊 Событий в БД: {data.get('total', 0)}")
        print(f"📊 Получено: {len(data.get('items', []))}")
        print("\n🎉 ВСЁ РАБОТАЕТ! Обнови страницу в браузере.")
    else:
        print(f"❌ Эндпоинт событий не работает: {events_response.status_code}")
        if events_response.status_code == 500:
            print("\n💡 Возможные причины:")
            print("   1. Деплой еще не завершился (подожди 1-2 минуты)")
            print("   2. В DATABASE_URL на Render есть &channel_binding=require")
            print("   3. Проблема с подключением к БД")
            print("\n🔧 Что делать:")
            print("   1. Проверь статус деплоя на Render Dashboard")
            print("   2. Проверь Environment → DATABASE_URL (удали channel_binding)")
            print("   3. Перезапусти сервис вручную (Manual Deploy)")
except Exception as e:
    print(f"❌ Ошибка запроса: {e}")
