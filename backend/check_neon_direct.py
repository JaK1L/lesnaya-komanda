import asyncio
import asyncpg

# Прямое подключение к Neon
NEON_URL = "postgresql://neondb_owner:npg_PRJbuN0f4Yyc@ep-purple-boat-agxuy7jr-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"

async def check_neon():
    print("Подключаемся к Neon напрямую...")
    try:
        conn = await asyncpg.connect(NEON_URL, timeout=30)
        print("✓ Подключено к Neon")
        
        print("\nВСЕ события в Neon базе:")
        rows = await conn.fetch('SELECT id, title, event_date, status FROM events ORDER BY id')
        print(f"Найдено событий: {len(rows)}")
        
        for r in rows:
            print(f"\n  ID: {r['id']}")
            print(f"  Title: {r['title']}")
            print(f"  Date: {r['event_date']}")
            print(f"  Status: {r['status']}")
        
        if len(rows) == 0:
            print("  (база пустая)")
        
        await conn.close()
        print("\n✓ Готово")
        
    except Exception as e:
        print(f"✗ Ошибка: {e}")

asyncio.run(check_neon())
