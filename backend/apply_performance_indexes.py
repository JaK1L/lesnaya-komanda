"""
Применение миграции индексов для производительности
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')

async def apply_indexes():
    """Применить индексы производительности"""
    print("🔄 Подключение к базе данных...")
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        print("📝 Чтение SQL миграции...")
        with open('migrations/add_performance_indexes.sql', 'r', encoding='utf-8') as f:
            sql = f.read()
        
        print("⚡ Применение индексов...")
        await conn.execute(sql)
        
        print("📊 Обновление статистики планировщика запросов...")
        await conn.execute("ANALYZE")
        
        print("✅ Индексы успешно созданы!")
        print("\n📈 Проверка созданных индексов:")
        
        indexes = await conn.fetch("""
            SELECT 
                schemaname,
                tablename,
                indexname
            FROM pg_indexes
            WHERE schemaname = 'public'
            AND indexname LIKE 'idx_%'
            ORDER BY tablename, indexname
        """)
        
        current_table = None
        for idx in indexes:
            if idx['tablename'] != current_table:
                current_table = idx['tablename']
                print(f"\n📋 {current_table}:")
            print(f"  ✓ {idx['indexname']}")
        
        print(f"\n🎉 Всего создано индексов: {len(indexes)}")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await conn.close()
        print("\n🔌 Соединение закрыто")

if __name__ == "__main__":
    asyncio.run(apply_indexes())
