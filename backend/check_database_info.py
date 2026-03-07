import requests

API_URL = "https://lesnayakomanda.onrender.com"

print("Проверяем какая база используется на Render...")
print(f"API URL: {API_URL}")

# Создаем специальный эндпоинт для проверки
print("\nПроверяем события через публичный API:")
response = requests.get(f"{API_URL}/api/events")
if response.status_code == 200:
    events = response.json()
    print(f"Найдено событий: {len(events)}")
    for event in events:
        print(f"  - ID: {event['id']}, Title: {event['title']}")
else:
    print(f"Ошибка: {response.status_code}")

print("\nЕсли видишь события с ID 1, 2, 3 - значит Render использует свою базу")
print("Если видишь событие с ID 6 - значит используется Neon база")
