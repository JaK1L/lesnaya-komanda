"""
Тест сериализации модели достижений
"""
import asyncio
import asyncpg
import os
import json
from dotenv import load_dotenv
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


class AchievementTypeCreate(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    icon: str = Field(default="🏆", max_length=50)
    category: str = Field(default="general", max_length=50)
    requirement: dict = Field(default_factory=dict)
    points: int = Field(default=10, ge=0)
    is_active: bool = True
    
    @field_validator('requirement', mode='before')
    @classmethod
    def parse_requirement(cls, v):
        """Парсим JSONB строку в dict если нужно"""
        if isinstance(v, str):
            return json.loads(v)
        return v


class AchievementTypeOut(AchievementTypeCreate):
    id: int
    created_at: datetime


async def test_model():
    """Тест сериализации модели"""
    print("🔄 Подключение к базе данных...")
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        # Получаем одну запись
        row = await conn.fetchrow(
            "SELECT * FROM achievement_types WHERE is_active = true LIMIT 1"
        )
        
        if not row:
            print("❌ Нет записей в таблице")
            return
        
        print("\n📋 Сырые данные из базы:")
        row_dict = dict(row)
        for key, value in row_dict.items():
            print(f"  {key}: {value} ({type(value).__name__})")
        
        print("\n🔄 Попытка создать Pydantic модель...")
        try:
            achievement = AchievementTypeOut(**row_dict)
            print("✅ Модель создана успешно!")
            print(f"\n📦 Сериализованная модель:")
            print(achievement.model_dump_json(indent=2))
        except Exception as e:
            print(f"❌ Ошибка при создании модели: {e}")
            import traceback
            traceback.print_exc()
        
        # Тест всех записей
        print("\n\n🔄 Тест всех записей...")
        rows = await conn.fetch(
            "SELECT * FROM achievement_types WHERE is_active = true ORDER BY category, points, id"
        )
        
        print(f"📊 Всего записей: {len(rows)}")
        
        success_count = 0
        error_count = 0
        
        for i, row in enumerate(rows, 1):
            try:
                achievement = AchievementTypeOut(**dict(row))
                success_count += 1
            except Exception as e:
                error_count += 1
                print(f"❌ Ошибка в записи {i}: {e}")
                print(f"   Данные: {dict(row)}")
        
        print(f"\n✅ Успешно: {success_count}")
        print(f"❌ Ошибок: {error_count}")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await conn.close()
        print("\n🔌 Соединение закрыто")


if __name__ == "__main__":
    asyncio.run(test_model())
