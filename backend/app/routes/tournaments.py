"""
Публичные маршруты турниров
"""
from fastapi import APIRouter, Depends
from typing import List, Optional
from datetime import datetime
import asyncpg
from pydantic import BaseModel

from ..database import get_db

router = APIRouter(prefix="/tournaments", tags=["tournaments"])


class TournamentOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    game: Optional[str]
    prize: Optional[str]
    challonge_url: Optional[str]
    start_date: Optional[datetime]
    status: str
    winner: Optional[str]
    created_at: datetime


@router.get("/", response_model=List[TournamentOut])
async def list_tournaments(
    status: Optional[str] = None,
    db: asyncpg.Connection = Depends(get_db),
):
    query = "SELECT * FROM tournaments"
    if status:
        rows = await db.fetch(query + " WHERE status = $1 ORDER BY start_date DESC NULLS LAST", status)
    else:
        rows = await db.fetch(query + " ORDER BY start_date DESC NULLS LAST")
    return [dict(r) for r in rows]


@router.get("/{tournament_id}", response_model=TournamentOut)
async def get_tournament(
    tournament_id: int,
    db: asyncpg.Connection = Depends(get_db),
):
    row = await db.fetchrow("SELECT * FROM tournaments WHERE id = $1", tournament_id)
    if not row:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Турнир не найден")
    return dict(row)
