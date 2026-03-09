"""Тест модели EventOut с реальными данными из БД"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

load_dotenv('.env')

class EventCreate(BaseModel):
    title: str = Field(..., max_length=200)
    description: str = Field(..., max_length=2000)
    game: Optional[str] = Field(default="Общее", max_length=50)
    event_date: datetime
    status: str = Field(default="Планируется", max_length=30)
    telegram_url: Optional[str] = Field(None, max_length=500)
    expires_at: Optional[datetime] = Field(None)

class EventOut(EventCreate):
    id: int
    created_by: Optional[int]
    participants: List[int] = []
    telegram_url: Optional[str] = None
    expires_at: Optional[datetime] = None

async def test_model():
    """Тест создания модели с данными из БД"""
    db_url = os.getenv('DATABASE_URL').replace('&channel_binding=require', '')
    conn = await asyncpg.connect(db_url)
    
    try:
        # Получаем реальные данные
        rows = await conn.fetch("""
            SELECT id, title, description, game, event_date, created_by, participants, status, telegram_url, expires_at
            FROM events
            LIMIT 3
        """)
        
        print(f"📊 Найдено событий: {len(rows)}\n")
        
        for i, row in enumerate(rows, 1):
            print(f"--- Событие {i} ---")
            row_dict = dict(row)
            
            # Показываем сырые данные
            print("Сырые данные:")
            for key, value in row_dict.items():
                print(f"  {key}: {value} (type: {type(value).__name__})")
            
            # Пробуем создать модель
            try:
                # Преобразуем participants
                if row_dict.get('participants') is None:
                    row_dict['participants'] = []
                else:
                    row_dict['participants'] = list(row_dict['participants'])
                
                event = EventOut(**row_dict)
                print(f"✅ Модель создана успешно!")
                print(f"   ID: {event.id}, Title: {event.title}")
            except Exception as e:
                print(f"❌ Ошибка создания модели: {e}")
                print(f"   Тип ошибки: {type(e).__name__}")
            
            print()
        
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(test_model())
