"""
Публичные маршруты турниров
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import datetime
import asyncpg
import json
from pydantic import BaseModel

from ..database import get_db
from ..auth import get_current_user, User

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
    image_url: Optional[str]
    type: str
    created_at: datetime


class RegisterSolo(BaseModel):
    nickname: str
    discord: Optional[str] = None
    steam: Optional[str] = None
    user_id: Optional[int] = None


class RegisterTeam(BaseModel):
    team_name: str
    players: List[str]  # list of nicknames, len 5
    contact: str        # discord or telegram of captain


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
        raise HTTPException(status_code=404, detail="Турнир не найден")
    return dict(row)


@router.post("/{tournament_id}/register/solo", status_code=201)
async def register_solo(
    tournament_id: int,
    payload: RegisterSolo,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    t = await db.fetchrow("SELECT id FROM tournaments WHERE id = $1", tournament_id)
    if not t:
        raise HTTPException(status_code=404, detail="Турнир не найден")
    existing = await db.fetchrow(
        "SELECT id FROM tournament_registrations WHERE tournament_id = $1 AND user_id = $2",
        tournament_id, current_user.id,
    )
    if existing:
        raise HTTPException(status_code=409, detail="Ты уже зарегистрирован на этот турнир")
    await db.execute(
        """
        INSERT INTO tournament_registrations
            (tournament_id, tournament_type, nickname, discord, steam, user_id)
        VALUES ($1, '1v1', $2, $3, $4, $5)
        """,
        tournament_id, payload.nickname, payload.discord, payload.steam, current_user.id,
    )
    return {"status": "registered"}


@router.post("/{tournament_id}/register/team", status_code=201)
async def register_team(
    tournament_id: int,
    payload: RegisterTeam,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    t = await db.fetchrow("SELECT id FROM tournaments WHERE id = $1", tournament_id)
    if not t:
        raise HTTPException(status_code=404, detail="Турнир не найден")
    existing = await db.fetchrow(
        "SELECT id FROM tournament_registrations WHERE tournament_id = $1 AND user_id = $2",
        tournament_id, current_user.id,
    )
    if existing:
        raise HTTPException(status_code=409, detail="Ты уже зарегистрировал команду на этот турнир")
    await db.execute(
        """
        INSERT INTO tournament_registrations
            (tournament_id, tournament_type, team_name, players, contact, user_id)
        VALUES ($1, '5v5', $2, $3::jsonb, $4, $5)
        """,
        tournament_id, payload.team_name, json.dumps(payload.players), payload.contact, current_user.id,
    )
    return {"status": "registered"}
