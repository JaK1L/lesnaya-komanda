#!/usr/bin/env python3
"""
Проверка статуса деплоя на Render
"""
import requests
import time

API_URL = "https://lesnayakomanda.onrender.com"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImV4cCI6MTc3MjQwODI4NH0.FcuU_x0umPDUTGOTy8F0p80GiZy_qmJxc4lOvhI-Ddo"

def check_endpoint():
    """Проверить доступность endpoint"""
    headers = {"Authorization": f"Bearer {TOKEN}"}
    
    try:
        response = requests.get(
            f"{API_URL}/api/admin/check-migration",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            print("✅ Endpoint работает! Новая версия задеплоена.")
            print(f"   Ответ: {response.json()}")
            return True
        elif response.status_code == 401:
            print("⏳ Старая версия еще работает (401 Unauthorized)")
            print("   Ждем деплоя новой версии...")
            return False
        else:
            print(f"⚠️ Неожиданный статус: {response.status_code}")
            print(f"   Ответ: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Ошибка подключения: {e}")
        return False


def main():
    print("=" * 60)
    print("🔍 ПРОВЕРКА СТАТУСА ДЕПЛОЯ")
    print("=" * 60)
    print()
    
    max_attempts = 20  # 20 попыток * 15 секунд = 5 минут
    attempt = 0
    
    while attempt < max_attempts:
        attempt += 1
        print(f"Попытка {attempt}/{max_attempts}...")
        
        if check_endpoint():
            print()
            print("=" * 60)
            print("✅ ДЕПЛОЙ ЗАВЕРШЕН!")
            print("=" * 60)
            print()
            print("Теперь можно запустить apply-migrations.bat")
            return
        
        if attempt < max_attempts:
            print("   Ждем 15 секунд...")
            print()
            time.sleep(15)
    
    print()
    print("=" * 60)
    print("⚠️ ДЕПЛОЙ ЕЩЕ НЕ ЗАВЕРШЕН")
    print("=" * 60)
    print()
    print("Возможные причины:")
    print("1. Render еще деплоит (может занять до 10 минут)")
    print("2. Ошибка при деплое (проверьте логи на Render)")
    print()
    print("Попробуйте:")
    print("1. Зайти в Render Dashboard → Logs")
    print("2. Подождать еще 5 минут и запустить этот скрипт снова")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️ Прервано пользователем.")
