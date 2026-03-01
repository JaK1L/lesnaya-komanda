#!/usr/bin/env python3
"""
Скрипт для применения миграций к production базе данных
Использует API endpoint для применения миграций
"""
import requests
import sys

# Конфигурация
API_URL = "https://lesnayakomanda.onrender.com"
ADMIN_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImV4cCI6MTc3MjQwODI4NH0.FcuU_x0umPDUTGOTy8F0p80GiZy_qmJxc4lOvhI-Ddo"

MIGRATIONS = [
    "add_profile_fields",
    "add_is_admin_column"
]


def check_migration_status():
    """Проверить статус миграций"""
    print("🔍 Проверка статуса миграций...")
    
    headers = {
        "Authorization": f"Bearer {ADMIN_TOKEN}"
    }
    
    try:
        response = requests.get(
            f"{API_URL}/api/admin/check-migration",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Статус: {data}")
            return data.get("is_admin_column_exists", False)
        else:
            print(f"❌ Ошибка проверки: {response.status_code}")
            print(f"   Ответ: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Ошибка сети: {e}")
        return None


def apply_migration(migration_name):
    """Применить миграцию"""
    print(f"\n📝 Применение миграции: {migration_name}")
    
    headers = {
        "Authorization": f"Bearer {ADMIN_TOKEN}"
    }
    
    try:
        response = requests.post(
            f"{API_URL}/api/admin/apply-migration",
            params={"migration_name": migration_name},
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Миграция {migration_name} применена успешно!")
            print(f"   Ответ: {data}")
            return True
        else:
            print(f"❌ Ошибка применения миграции: {response.status_code}")
            print(f"   Ответ: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Ошибка сети: {e}")
        return False


def main():
    """Основная функция"""
    print("=" * 60)
    print("🔧 MIGRATION TOOL - Лесная Команда")
    print("=" * 60)
    
    # Проверить статус
    status = check_migration_status()
    
    if status is True:
        print("\n✅ Миграции уже применены!")
        return
    
    if status is None:
        print("\n⚠️ Не удалось проверить статус миграций.")
        answer = input("Продолжить применение миграций? (y/n): ")
        if answer.lower() != 'y':
            print("Отменено.")
            return
    
    # Применить миграции
    print("\n" + "=" * 60)
    print("Применение миграций...")
    print("=" * 60)
    
    success_count = 0
    for migration in MIGRATIONS:
        if apply_migration(migration):
            success_count += 1
        else:
            print(f"\n⚠️ Миграция {migration} не применена.")
            answer = input("Продолжить со следующей миграцией? (y/n): ")
            if answer.lower() != 'y':
                break
    
    # Итоги
    print("\n" + "=" * 60)
    print(f"✅ Применено миграций: {success_count}/{len(MIGRATIONS)}")
    print("=" * 60)
    
    # Финальная проверка
    print("\n🔍 Финальная проверка...")
    check_migration_status()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️ Прервано пользователем.")
        sys.exit(1)
