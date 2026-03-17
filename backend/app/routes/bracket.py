"""
Турнирные сетки (single / double elimination).
"""
import math
import random
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import asyncpg

from ..database import get_db
from ..auth import get_current_admin_user
from ..models import User

router = APIRouter()


# ── Schemas ──────────────────────────────────────────────────────────────────

class MatchOut(BaseModel):
    id: int
    tournament_id: int
    bracket_type: str       # 'single' | 'double'
    section: str            # 'winners' | 'losers' | 'grand_final'
    round: int
    match_index: int
    player1_name: Optional[str]
    player2_name: Optional[str]
    winner_name: Optional[str]
    score1: Optional[int]
    score2: Optional[int]
    is_bye: bool
    status: str             # 'pending' | 'completed' | 'bye'
    next_winner_match_id: Optional[int]
    next_loser_match_id: Optional[int]


class MatchResult(BaseModel):
    winner_name: str
    score1: int
    score2: int


# ── Helpers ───────────────────────────────────────────────────────────────────

def next_power_of_2(n: int) -> int:
    p = 1
    while p < n:
        p <<= 1
    return p


def _generate_single(players: List[str]) -> List[dict]:
    size = max(2, next_power_of_2(len(players)))
    seeded = players + ["BYE"] * (size - len(players))
    random.shuffle(seeded)
    matches: List[dict] = []
    total_rounds = int(math.log2(size))

    # Round 1
    for i in range(size // 2):
        p1 = seeded[i * 2]
        p2 = seeded[i * 2 + 1]
        is_bye = p2 == "BYE" or p1 == "BYE"
        winner = (p1 if p2 == "BYE" else p2) if is_bye else None
        matches.append({
            "section": "winners", "round": 1, "match_index": i,
            "player1_name": p1 if p1 != "BYE" else None,
            "player2_name": p2 if p2 != "BYE" else None,
            "winner_name": winner,
            "score1": None, "score2": None,
            "is_bye": is_bye,
            "status": "bye" if is_bye else "pending",
        })

    # Empty slots for subsequent rounds
    prev_count = size // 2
    for r in range(2, total_rounds + 1):
        count = prev_count // 2
        for i in range(count):
            matches.append({
                "section": "winners", "round": r, "match_index": i,
                "player1_name": None, "player2_name": None,
                "winner_name": None, "score1": None, "score2": None,
                "is_bye": False, "status": "pending",
            })
        prev_count = count

    return matches


def _generate_double(players: List[str]) -> List[dict]:
    size = max(2, next_power_of_2(len(players)))
    seeded = players + ["BYE"] * (size - len(players))
    random.shuffle(seeded)
    matches: List[dict] = []
    w_rounds = int(math.log2(size))

    # Winners bracket — same as single
    for i in range(size // 2):
        p1, p2 = seeded[i * 2], seeded[i * 2 + 1]
        is_bye = p2 == "BYE" or p1 == "BYE"
        winner = (p1 if p2 == "BYE" else p2) if is_bye else None
        matches.append({
            "section": "winners", "round": 1, "match_index": i,
            "player1_name": p1 if p1 != "BYE" else None,
            "player2_name": p2 if p2 != "BYE" else None,
            "winner_name": winner, "score1": None, "score2": None,
            "is_bye": is_bye, "status": "bye" if is_bye else "pending",
        })
    prev = size // 2
    for r in range(2, w_rounds + 1):
        cnt = prev // 2
        for i in range(cnt):
            matches.append({
                "section": "winners", "round": r, "match_index": i,
                "player1_name": None, "player2_name": None,
                "winner_name": None, "score1": None, "score2": None,
                "is_bye": False, "status": "pending",
            })
        prev = cnt

    # Losers bracket — 2*(w_rounds-1) rounds, match counts halve every 2 rounds
    l_count = size // 2  # same as W round 1 losers
    l_round = 1
    while l_count >= 1:
        for i in range(l_count):
            matches.append({
                "section": "losers", "round": l_round, "match_index": i,
                "player1_name": None, "player2_name": None,
                "winner_name": None, "score1": None, "score2": None,
                "is_bye": False, "status": "pending",
            })
        l_round += 1
        if l_count == 1:
            break
        # Every 2 loser rounds, halve count
        if l_round % 2 == 1:
            l_count //= 2

    # Grand final
    matches.append({
        "section": "grand_final", "round": 1, "match_index": 0,
        "player1_name": None, "player2_name": None,
        "winner_name": None, "score1": None, "score2": None,
        "is_bye": False, "status": "pending",
    })

    return matches


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/tournaments/{tournament_id}/bracket", response_model=List[MatchOut])
async def get_bracket(
    tournament_id: int,
    db: asyncpg.Connection = Depends(get_db),
):
    rows = await db.fetch(
        "SELECT * FROM bracket_matches WHERE tournament_id = $1 ORDER BY section, round, match_index",
        tournament_id,
    )
    return [MatchOut(**dict(r)) for r in rows]


class GenerateRequest(BaseModel):
    bracket_type: str = "single"
    custom_players: Optional[List[str]] = None  # if provided, override registrations


@router.post("/admin/tournaments/{tournament_id}/bracket/generate")
async def generate_bracket(
    tournament_id: int,
    body: GenerateRequest = GenerateRequest(),
    db: asyncpg.Connection = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    bracket_type = body.bracket_type
    if bracket_type not in ("single", "double"):
        raise HTTPException(400, "bracket_type must be 'single' or 'double'")

    # Delete existing bracket
    await db.execute("DELETE FROM bracket_matches WHERE tournament_id = $1", tournament_id)

    if body.custom_players:
        players = [p.strip() for p in body.custom_players if p.strip()]
    else:
        # Fetch participants from registrations
        regs = await db.fetch(
            """
            SELECT COALESCE(nickname, team_name) AS name
            FROM tournament_registrations
            WHERE tournament_id = $1
            """,
            tournament_id,
        )
        players = [r["name"] for r in regs if r["name"]]

    if len(players) < 1:
        raise HTTPException(400, "Добавьте хотя бы одного участника, чтобы сформировать сетку.")
    if len(players) > 32:
        raise HTTPException(400, "Максимум 32 участника")

    matches = _generate_single(players) if bracket_type == "single" else _generate_double(players)

    # Insert and collect ids to wire next_winner_match_id
    ids = []
    for m in matches:
        mid = await db.fetchval(
            """
            INSERT INTO bracket_matches
              (tournament_id, bracket_type, section, round, match_index,
               player1_name, player2_name, winner_name, score1, score2, is_bye, status)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
            RETURNING id
            """,
            tournament_id, bracket_type, m["section"], m["round"], m["match_index"],
            m["player1_name"], m["player2_name"], m["winner_name"],
            m["score1"], m["score2"], m["is_bye"], m["status"],
        )
        ids.append((m["section"], m["round"], m["match_index"], mid))

    # Wire next_winner_match_id (winner goes to round+1, match_index//2)
    def find_id(section, rnd, idx):
        for s, r, i, mid in ids:
            if s == section and r == rnd and i == idx:
                return mid
        return None

    for section, rnd, idx, mid in ids:
        next_id = find_id(section, rnd + 1, idx // 2)
        if next_id:
            await db.execute(
                "UPDATE bracket_matches SET next_winner_match_id=$1 WHERE id=$2",
                next_id, mid,
            )

    # Update tournament bracket_type
    await db.execute(
        "UPDATE tournaments SET bracket_type=$1 WHERE id=$2",
        bracket_type, tournament_id,
    )

    return {"status": "generated", "matches": len(matches)}


@router.patch("/admin/bracket/match/{match_id}")
async def update_match(
    match_id: int,
    result: MatchResult,
    db: asyncpg.Connection = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    match = await db.fetchrow("SELECT * FROM bracket_matches WHERE id=$1", match_id)
    if not match:
        raise HTTPException(404, "Match not found")

    await db.execute(
        """
        UPDATE bracket_matches
        SET winner_name=$1, score1=$2, score2=$3, status='completed'
        WHERE id=$4
        """,
        result.winner_name, result.score1, result.score2, match_id,
    )

    # Auto-fill next match
    if match["next_winner_match_id"]:
        next_m = await db.fetchrow(
            "SELECT * FROM bracket_matches WHERE id=$1", match["next_winner_match_id"]
        )
        if next_m:
            # slot: even match_index → player1, odd → player2
            if match["match_index"] % 2 == 0:
                await db.execute(
                    "UPDATE bracket_matches SET player1_name=$1 WHERE id=$2",
                    result.winner_name, next_m["id"],
                )
            else:
                await db.execute(
                    "UPDATE bracket_matches SET player2_name=$1 WHERE id=$2",
                    result.winner_name, next_m["id"],
                )

    return {"status": "updated"}


class SlotAssign(BaseModel):
    slot: int        # 1 or 2
    player_name: str


@router.patch("/admin/bracket/match/{match_id}/slot")
async def assign_player_slot(
    match_id: int,
    body: SlotAssign,
    db: asyncpg.Connection = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    if body.slot not in (1, 2):
        raise HTTPException(400, "slot must be 1 or 2")
    field = "player1_name" if body.slot == 1 else "player2_name"
    await db.execute(
        f"UPDATE bracket_matches SET {field}=$1 WHERE id=$2",
        body.player_name, match_id,
    )
    return {"status": "ok"}


@router.delete("/admin/tournaments/{tournament_id}/bracket")
async def reset_bracket(
    tournament_id: int,
    db: asyncpg.Connection = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    await db.execute("DELETE FROM bracket_matches WHERE tournament_id=$1", tournament_id)
    return {"status": "reset"}
