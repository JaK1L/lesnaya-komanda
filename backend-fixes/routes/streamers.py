from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
# from app.database import get_db  # твой импорт БД

router = APIRouter()

# ─── Схема ответа ──────────────────────────────────────────────────
class StreamerResponse(BaseModel):
    id: int
    name: str
    description: str
    image_url: Optional[str] = None
    twitch_url: Optional[str] = None
    twitch_login: Optional[str] = None
    is_live: bool = False
    viewer_count: Optional[int] = None

    class Config:
        from_attributes = True


# ─── Эндпоинт ─────────────────────────────────────────────────────
@router.get("", response_model=list[StreamerResponse])
async def get_streamers():
    """
    Возвращает список стримеров.
    TODO: замени заглушку на реальный запрос к БД.
    """
    # Заглушка — убери когда подключишь БД
    # streamers = await db.fetch_all("SELECT * FROM streamers ORDER BY id")
    # return streamers

    # Временные данные чтобы фронт не был пустым
    return [
        {
            "id": 1,
            "name": "~△b9lBoJl.HoCuT.DEMIX~",
            "description": "Играет в различные компьютерные игры, вайбкодит, а так же не пьет уже много месяцев",
            "image_url": None,
            "twitch_url": "https://twitch.tv",
            "is_live": False,
        },
        {
            "id": 2,
            "name": "~△b9lBoJl.HoCuT.DEMIX~",
            "description": "Играет в различные компьютерные игры, вайбкодит, а так же не пьет уже много месяцев",
            "image_url": None,
            "twitch_url": "https://twitch.tv",
            "is_live": False,
        },
    ]


@router.get("/{streamer_id}", response_model=StreamerResponse)
async def get_streamer(streamer_id: int):
    raise HTTPException(status_code=404, detail="Streamer not found")
