import requests
import os
from dotenv import load_dotenv

load_dotenv()

API_URL = os.getenv('BACKEND_URL', 'https://lesnayakomanda.onrender.com')
ADMIN_USERNAME = os.getenv('ADMIN_USERNAME', 'admin')
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'admin123')

# Получаем токен админа
print("Логинимся...")
response = requests.post(
    f"{API_URL}/api/token",
    json={
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD
    }
)

if response.status_code != 200:
    print(f"Ошибка логина: {response.status_code}")
    print(response.text)
    exit(1)

token = response.json()["access_token"]
print(f"Токен получен: {token[:20]}...")

# Получаем все события
print("\nПолучаем события...")
response = requests.get(
    f"{API_URL}/api/admin/events",
    headers={"Authorization": f"Bearer {token}"}
)

if response.status_code != 200:
    print(f"Ошибка получения событий: {response.status_code}")
    print(response.text)
    exit(1)

events = response.json()
print(f"Найдено событий: {len(events)}")

# Удаляем старые события (ID 1, 2, 3)
old_event_ids = [1, 2, 3]

for event_id in old_event_ids:
    print(f"\nУдаляем событие ID {event_id}...")
    response = requests.delete(
        f"{API_URL}/api/admin/events/{event_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if response.status_code == 200:
        print(f"✓ Событие {event_id} удалено")
    elif response.status_code == 404:
        print(f"- Событие {event_id} не найдено")
    else:
        print(f"✗ Ошибка удаления {event_id}: {response.status_code}")
        print(response.text)

print("\nГотово!")
