"""Полная проверка всех эндпоинтов API"""
import requests
import os
from dotenv import load_dotenv

load_dotenv('.env')

BASE_URL = "https://lesnayakomanda.onrender.com"

def test_endpoint(name, method, endpoint, headers=None, json_data=None, params=None, expect_auth=False):
    """Тест одного эндпоинта"""
    try:
        if method == "GET":
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers, params=params, timeout=10)
        elif method == "POST":
            response = requests.post(f"{BASE_URL}{endpoint}", headers=headers, json=json_data, timeout=10)
        
        status = response.status_code
        
        if expect_auth and status == 401:
            return "🔒", status, "Требует авторизации (ожидаемо)"
        elif status == 200:
            return "✅", status, "OK"
        elif status == 404:
            return "❌", status, "Not Found"
        elif status == 500:
            return "❌", status, "Internal Server Error"
        else:
            return "⚠️", status, response.text[:50]
    except Exception as e:
        return "❌", 0, str(e)[:50]

print("🔍 ПОЛНАЯ ПРОВЕРКА СИСТЕМЫ\n")
print("=" * 80)

# 1. Health checks
print("\n1️⃣ HEALTH CHECKS")
print("-" * 80)
status, code, msg = test_endpoint("Health", "GET", "/health")
print(f"{status} /health - {code} - {msg}")

status, code, msg = test_endpoint("Health DB", "GET", "/health/db")
print(f"{status} /health/db - {code} - {msg}")

# 2. Получение токена
print("\n2️⃣ АВТОРИЗАЦИЯ")
print("-" * 80)
token_response = requests.post(
    f"{BASE_URL}/api/token",
    json={
        "username": os.getenv('ADMIN_USERNAME', 'LKBOSS322'),
        "password": os.getenv('ADMIN_PASSWORD', 'LKTEAMPASSWORD3228')
    }
)

if token_response.status_code == 200:
    token = token_response.json()['access_token']
    print(f"✅ /api/token - 200 - Токен получен")
    headers = {"Authorization": f"Bearer {token}"}
else:
    print(f"❌ /api/token - {token_response.status_code} - Ошибка авторизации")
    headers = {}

# 3. Публичные эндпоинты
print("\n3️⃣ ПУБЛИЧНЫЕ ЭНДПОИНТЫ")
print("-" * 80)

public_endpoints = [
    ("GET", "/api/users", {"page": 1, "limit": 10}),
    ("GET", "/api/news", {"page": 1, "limit": 10}),
    ("GET", "/api/events", {"page": 1, "limit": 10}),
    ("GET", "/api/feed", {"page": 1, "limit": 10}),
    ("GET", "/api/discord/stats", None),
    ("GET", "/api/discord/elite", None),
]

for method, endpoint, params in public_endpoints:
    status, code, msg = test_endpoint(endpoint, method, endpoint, params=params)
    print(f"{status} {endpoint} - {code} - {msg}")

# 4. Админские эндпоинты (требуют токен)
print("\n4️⃣ АДМИНСКИЕ ЭНДПОИНТЫ")
print("-" * 80)

admin_endpoints = [
    ("GET", "/api/admin/stats", None),
    ("GET", "/api/admin/events", {"page": 1, "limit": 10}),
    ("GET", "/api/admin/news", {"page": 1, "limit": 10}),
    ("GET", "/api/admin/feed", {"page": 1, "limit": 10}),
    ("GET", "/api/admin/users", {"page": 1, "limit": 10}),
    ("GET", "/api/admin/streamers", {"page": 1, "limit": 10}),
    ("GET", "/api/admin/merch", {"page": 1, "limit": 10}),
]

for method, endpoint, params in admin_endpoints:
    status, code, msg = test_endpoint(endpoint, method, endpoint, headers=headers, params=params)
    print(f"{status} {endpoint} - {code} - {msg}")

# 5. Достижения
print("\n5️⃣ ДОСТИЖЕНИЯ")
print("-" * 80)

achievements_endpoints = [
    ("GET", "/api/achievements/types", None),
    ("GET", "/api/admin/achievements/types", None),
]

for method, endpoint, params in achievements_endpoints:
    h = headers if "admin" in endpoint else None
    status, code, msg = test_endpoint(endpoint, method, endpoint, headers=h, params=params)
    print(f"{status} {endpoint} - {code} - {msg}")

# 6. Игровая статистика
print("\n6️⃣ ИГРОВАЯ СТАТИСТИКА")
print("-" * 80)

game_endpoints = [
    ("GET", "/api/game-stats/leaderboard", {"game": "cs2"}),
]

for method, endpoint, params in game_endpoints:
    status, code, msg = test_endpoint(endpoint, method, endpoint, params=params)
    print(f"{status} {endpoint} - {code} - {msg}")

# Итоговая статистика
print("\n" + "=" * 80)
print("📊 ИТОГОВАЯ СТАТИСТИКА")
print("=" * 80)

# Проверяем критичные эндпоинты
critical_checks = [
    ("Health Check", test_endpoint("", "GET", "/health")[0] == "✅"),
    ("Авторизация", token_response.status_code == 200),
    ("События (публичные)", test_endpoint("", "GET", "/api/events", params={"page": 1})[0] == "✅"),
    ("События (админ)", test_endpoint("", "GET", "/api/admin/events", headers=headers, params={"page": 1})[0] == "✅"),
    ("Новости (админ)", test_endpoint("", "GET", "/api/admin/news", headers=headers, params={"page": 1})[0] == "✅"),
    ("Пользователи", test_endpoint("", "GET", "/api/users", params={"page": 1})[0] == "✅"),
]

passed = sum(1 for _, status in critical_checks if status)
total = len(critical_checks)

print(f"\n✅ Пройдено: {passed}/{total}")
print(f"❌ Провалено: {total - passed}/{total}")

for name, status in critical_checks:
    icon = "✅" if status else "❌"
    print(f"{icon} {name}")

if passed == total:
    print("\n🎉 ВСЕ КРИТИЧНЫЕ ПРОВЕРКИ ПРОЙДЕНЫ!")
else:
    print(f"\n⚠️ Есть проблемы с {total - passed} эндпоинтами")
