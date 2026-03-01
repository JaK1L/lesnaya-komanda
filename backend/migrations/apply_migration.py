"""
Script to apply database migrations
"""
import asyncio
import asyncpg
import sys
import os
from pathlib import Path

# Add parent directory to path to import config
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import settings


async def apply_migration(migration_file: str):
    """Apply a SQL migration file to the database"""
    print(f"Connecting to database...")
    
    try:
        # Connect to database
        conn = await asyncpg.connect(settings.DATABASE_URL)
        
        # Read migration file
        migration_path = Path(__file__).parent / migration_file
        print(f"Reading migration file: {migration_path}")
        
        with open(migration_path, 'r', encoding='utf-8') as f:
            sql = f.read()
        
        # Execute migration
        print(f"Applying migration...")
        await conn.execute(sql)
        
        print(f"✓ Migration {migration_file} applied successfully!")
        
        # Close connection
        await conn.close()
        
    except Exception as e:
        print(f"✗ Error applying migration: {e}")
        sys.exit(1)


async def main():
    """Main function"""
    if len(sys.argv) > 1:
        migration_file = sys.argv[1]
    else:
        migration_file = "add_profile_fields.sql"
    
    await apply_migration(migration_file)


if __name__ == "__main__":
    asyncio.run(main())
