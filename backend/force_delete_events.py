import requests
import os
from dotenv import load_dotenv

load_dotenv()

API_URL = os.getenv('BACKEND_URL', 'https://lesnayakomanda.onrender.com')
ADMIN_USERNAME = os.getenv('ADMIN_USERNAME', 'admin')
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'admin123')

print("Логинимся в админку...")
response = requests.post(
    f"{API_URL}/api/token",
    json={
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD
    }
)

if response.status_code != 200:
    print(f"✗ Ошибка логина: {response.status_code}")
    print(response.text)
    exit(1)

token = response.json()["access_token"]
print(f"✓ Токен получен")

# Получаем все события через админ API
print("\nПолучаем события через админ API...")
response = requests.get(
    f"{API_URL}/api/admin/events",
    headers={"Authorization": f"Bearer {token}"}
)

if response.status_code != 200:
    print(f"✗ Ошибка: {response.status_code}")
    print(response.text)
    exit(1)

events = response.json()
print(f"✓ Найдено событий: {len(events)}")

for event in events:
    print(f"\n  ID: {event['id']}, Title: {event['title']}")

# Удаляем события 1, 2, 3
print("\n" + "="*50)
print("Удаляем старые события...")

for event_id in [1, 2, 3]:
    print(f"\nУдаляем событие ID {event_id}...")
    response = requests.delete(
        f"{API_URL}/api/admin/events/{event_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if response.status_code == 200:
        print(f"  ✓ Удалено")
    elif response.status_code == 404:
        print(f"  - Не найдено")
    else:
        print(f"  ✗ Ошибка: {response.status_code}")
        print(f"  {response.text}")

print("\n" + "="*50)
print("Проверяем результат...")

response = requests.get(f"{API_URL}/api/events")
events = response.json()
print(f"\nОсталось событий: {len(events)}")
for event in events:
    print(f"  - ID: {event['id']}, Title: {event['title']}")

print("\n✓ Готово!")
