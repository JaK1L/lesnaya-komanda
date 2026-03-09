"""
Применение миграции для добавления реакций и комментариев к новостям
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def apply_migration():
    """Применяет миграцию для добавления реакций и комментариев"""
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        print("🔄 Применение миграции...")
        
        # Читаем SQL файл
        import pathlib
        script_dir = pathlib.Path(__file__).parent
        migration_file = script_dir / "migrations" / "add_news_reactions_comments.sql"
        
        with open(migration_file, "r", encoding="utf-8") as f:
            migration_sql = f.read()
        
        # Выполняем миграцию
        await conn.execute(migration_sql)
        
        print("✅ Миграция успешно применена!")
        print("\nДобавлены таблицы:")
        print("  - news_reactions (лайки/дизлайки)")
        print("  - news_comments (комментарии)")
        
    except Exception as e:
        print(f"❌ Ошибка при применении миграции: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await conn.close()

if __name__ == "__main__":
    print("=" * 60)
    print("📦 МИГРАЦИЯ: Реакции и комментарии к новостям")
    print("=" * 60)
    asyncio.run(apply_migration())
