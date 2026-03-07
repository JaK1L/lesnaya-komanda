"""
Скрипт для создания таблицы site_settings и добавления дефолтных настроек
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def fix_settings():
    DATABASE_URL = os.getenv('DATABASE_URL')
    
    if not DATABASE_URL:
        print("❌ Ошибка: DATABASE_URL не найден в .env")
        return
    
    print(f"🔌 Подключение к базе данных...")
    
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        print("✅ Подключено к базе данных")
        
        # Создаем таблицу
        print("📝 Создание таблицы site_settings...")
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS site_settings (
                key VARCHAR(50) PRIMARY KEY,
                value JSONB NOT NULL
            )
        ''')
        print("✅ Таблица site_settings создана")
        
        # Добавляем дефолтные настройки
        print("📝 Добавление дефолтных настроек...")
        await conn.execute('''
            INSERT INTO site_settings (key, value)
            VALUES ('common', $1::jsonb)
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
        ''', '{"discord_join_url": "https://discord.gg/YgX4RQZ", "maintenance_enabled": false, "maintenance_message": null}')
        print("✅ Настройки добавлены")
        
        # Проверяем что настройки есть
        row = await conn.fetchrow("SELECT * FROM site_settings WHERE key = 'common'")
        if row:
            print(f"✅ Проверка: настройки найдены - {row['value']}")
        else:
            print("⚠️ Предупреждение: настройки не найдены после вставки")
        
        await conn.close()
        print("✅ Готово! Таблица site_settings создана и заполнена!")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(fix_settings())
