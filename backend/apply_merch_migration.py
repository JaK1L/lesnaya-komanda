import asyncio
import asyncpg
import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

async def apply_migration():
    print("Применяем миграцию merch...")
    
    conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
    
    try:
        # Читаем SQL файл
        sql_file = Path(__file__).parent / 'migrations' / 'create_merch_table.sql'
        with open(sql_file, 'r', encoding='utf-8') as f:
            sql = f.read()
        
        # Применяем миграцию
        await conn.execute(sql)
        print("✓ Миграция успешно применена!")
        
        # Добавляем тестовые товары
        print("\nДобавляем тестовые товары...")
        await conn.execute("""
            INSERT INTO merch (name, description, price, image_url, category, sizes, display_order)
            VALUES 
                ('Футболка "Лесная"', 'Классическая футболка с логотипом команды', 1500.00, 'https://via.placeholder.com/400x400?text=Футболка', 'футболки', 'S, M, L, XL, XXL', 1),
                ('Худи "Волк"', 'Теплое худи с принтом волка', 3500.00, 'https://via.placeholder.com/400x400?text=Худи', 'худи', 'S, M, L, XL', 2),
                ('Кепка "Лесная Команда"', 'Стильная кепка с вышивкой', 1200.00, 'https://via.placeholder.com/400x400?text=Кепка', 'аксессуары', 'Один размер', 3)
            ON CONFLICT DO NOTHING
        """)
        print("✓ Тестовые товары добавлены")
        
        # Проверяем
        count = await conn.fetchval("SELECT COUNT(*) FROM merch")
        print(f"✓ Всего товаров в базе: {count}")
        
    except Exception as e:
        print(f"✗ Ошибка: {e}")
    finally:
        await conn.close()

asyncio.run(apply_migration())
