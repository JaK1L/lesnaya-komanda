"""
Турнирные сетки (single / double elimination).
"""

import math
import random
from datetime import datetime
from typing import List, Optional

import asyncpg
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..auth import get_current_admin_user
from ..database import get_db
from ..models import User

router = APIRouter()


class MatchOut(BaseModel):
    id: int
    tournament_id: int
    bracket_type: str
    section: str
    round: int
    match_index: int
    player1_name: Optional[str]
    player2_name: Optional[str]
    winner_name: Optional[str]
    score1: Optional[int]
    score2: Optional[int]
    is_bye: bool
    status: str
    match_format: Optional[str] = None
    start_time: Optional[datetime] = None
    next_winner_match_id: Optional[int]
    next_loser_match_id: Optional[int]


class MatchUpdate(BaseModel):
    player1_name: Optional[str] = None
    player2_name: Optional[str] = None
    winner_name: Optional[str] = None
    score1: Optional[int] = None
    score2: Optional[int] = None
    is_bye: Optional[bool] = None
    status: Optional[str] = None
    match_format: Optional[str] = None
    start_time: Optional[datetime] = None


class GenerateRequest(BaseModel):
    bracket_type: str = "single"
    custom_players: Optional[List[str]] = None


class SlotAssign(BaseModel):
    slot: int
    player_name: Optional[str] = None


VALID_STATUSES = {"pending", "upcoming", "live", "completed", "cancelled", "bye"}
VALID_MATCH_FORMATS = {"BO1", "BO3", "BO5"}


def next_power_of_2(value: int) -> int:
    power = 1
    while power < value:
        power <<= 1
    return power


def _generate_single(players: List[str]) -> List[dict]:
    size = max(2, next_power_of_2(len(players)))
    seeded = players + ["BYE"] * (size - len(players))
    random.shuffle(seeded)
    matches: List[dict] = []
    total_rounds = int(math.log2(size))

    for index in range(size // 2):
        player1 = seeded[index * 2]
        player2 = seeded[index * 2 + 1]
        is_bye = player1 == "BYE" or player2 == "BYE"
        winner = (player1 if player2 == "BYE" else player2) if is_bye else None
        matches.append(
            {
                "section": "winners",
                "round": 1,
                "match_index": index,
                "player1_name": player1 if player1 != "BYE" else None,
                "player2_name": player2 if player2 != "BYE" else None,
                "winner_name": winner,
                "score1": None,
                "score2": None,
                "is_bye": is_bye,
                "status": "bye" if is_bye else "pending",
            }
        )

    previous_count = size // 2
    for round_number in range(2, total_rounds + 1):
        count = previous_count // 2
        for index in range(count):
            matches.append(
                {
                    "section": "winners",
                    "round": round_number,
                    "match_index": index,
                    "player1_name": None,
                    "player2_name": None,
                    "winner_name": None,
                    "score1": None,
                    "score2": None,
                    "is_bye": False,
                    "status": "pending",
                }
            )
        previous_count = count

    return matches


def _generate_double(players: List[str]) -> List[dict]:
    size = max(2, next_power_of_2(len(players)))
    seeded = players + ["BYE"] * (size - len(players))
    random.shuffle(seeded)
    matches: List[dict] = []
    winners_rounds = int(math.log2(size))

    for index in range(size // 2):
        player1 = seeded[index * 2]
        player2 = seeded[index * 2 + 1]
        is_bye = player1 == "BYE" or player2 == "BYE"
        winner = (player1 if player2 == "BYE" else player2) if is_bye else None
        matches.append(
            {
                "section": "winners",
                "round": 1,
                "match_index": index,
                "player1_name": player1 if player1 != "BYE" else None,
                "player2_name": player2 if player2 != "BYE" else None,
                "winner_name": winner,
                "score1": None,
                "score2": None,
                "is_bye": is_bye,
                "status": "bye" if is_bye else "pending",
            }
        )

    previous_count = size // 2
    for round_number in range(2, winners_rounds + 1):
        count = previous_count // 2
        for index in range(count):
            matches.append(
                {
                    "section": "winners",
                    "round": round_number,
                    "match_index": index,
                    "player1_name": None,
                    "player2_name": None,
                    "winner_name": None,
                    "score1": None,
                    "score2": None,
                    "is_bye": False,
                    "status": "pending",
                }
            )
        previous_count = count

    losers_count = size // 2
    losers_round = 1
    while losers_count >= 1:
        for index in range(losers_count):
            matches.append(
                {
                    "section": "losers",
                    "round": losers_round,
                    "match_index": index,
                    "player1_name": None,
                    "player2_name": None,
                    "winner_name": None,
                    "score1": None,
                    "score2": None,
                    "is_bye": False,
                    "status": "pending",
                }
            )
        losers_round += 1
        if losers_count == 1:
            break
        if losers_round % 2 == 1:
            losers_count //= 2

    matches.append(
        {
            "section": "grand_final",
            "round": 1,
            "match_index": 0,
            "player1_name": None,
            "player2_name": None,
            "winner_name": None,
            "score1": None,
            "score2": None,
            "is_bye": False,
            "status": "pending",
        }
    )

    return matches


async def _advance_winner(db: asyncpg.Connection, match_row) -> None:
    winner_name = match_row["winner_name"]
    next_match_id = match_row["next_winner_match_id"]
    if not winner_name or not next_match_id:
        return

    next_match = await db.fetchrow("SELECT * FROM bracket_matches WHERE id=$1", next_match_id)
    if not next_match:
        return

    target_field = "player1_name" if match_row["match_index"] % 2 == 0 else "player2_name"
    await db.execute(
        f"UPDATE bracket_matches SET {target_field}=$1 WHERE id=$2",
        winner_name,
        next_match_id,
    )

    refreshed_next = await db.fetchrow("SELECT * FROM bracket_matches WHERE id=$1", next_match_id)
    if not refreshed_next:
        return

    feeder_matches = await db.fetch(
        """
        SELECT *
        FROM bracket_matches
        WHERE next_winner_match_id=$1
        ORDER BY match_index
        """,
        next_match_id,
    )

    expected_player1 = next(
        (
            feeder["winner_name"]
            for feeder in feeder_matches
            if feeder["match_index"] % 2 == 0 and feeder["winner_name"]
        ),
        None,
    )
    expected_player2 = next(
        (
            feeder["winner_name"]
            for feeder in feeder_matches
            if feeder["match_index"] % 2 == 1 and feeder["winner_name"]
        ),
        None,
    )

    if expected_player1 and refreshed_next["player1_name"] != expected_player1:
      await db.execute(
          "UPDATE bracket_matches SET player1_name=$1 WHERE id=$2",
          expected_player1,
          next_match_id,
      )
    if expected_player2 and refreshed_next["player2_name"] != expected_player2:
      await db.execute(
          "UPDATE bracket_matches SET player2_name=$1 WHERE id=$2",
          expected_player2,
          next_match_id,
      )

    refreshed_next = await db.fetchrow("SELECT * FROM bracket_matches WHERE id=$1", next_match_id)
    if not refreshed_next:
        return

    player1_name = refreshed_next["player1_name"]
    player2_name = refreshed_next["player2_name"]
    auto_winner = None

    missing_slot_is_player2 = bool(player1_name and not player2_name)
    missing_slot_is_player1 = bool(player2_name and not player1_name)

    if missing_slot_is_player2:
        missing_feeder = next((feeder for feeder in feeder_matches if feeder["match_index"] % 2 == 1), None)
        if missing_feeder and missing_feeder["status"] == "pending":
            return
        auto_winner = player1_name
    elif missing_slot_is_player1:
        missing_feeder = next((feeder for feeder in feeder_matches if feeder["match_index"] % 2 == 0), None)
        if missing_feeder and missing_feeder["status"] == "pending":
            return
        auto_winner = player2_name

    if not auto_winner:
        return

    await db.execute(
        """
        UPDATE bracket_matches
        SET winner_name=$1, is_bye=TRUE, status='bye'
        WHERE id=$2
        """,
        auto_winner,
        next_match_id,
    )

    advanced_match = await db.fetchrow("SELECT * FROM bracket_matches WHERE id=$1", next_match_id)
    if advanced_match and advanced_match["next_winner_match_id"]:
        await _advance_winner(db, advanced_match)


async def _reset_match_state(
    db: asyncpg.Connection,
    match_id: int,
    *,
    clear_players: bool = False,
) -> None:
    match = await db.fetchrow("SELECT * FROM bracket_matches WHERE id=$1", match_id)
    if not match:
        return

    next_match_id = match["next_winner_match_id"]
    target_field = "player1_name" if match["match_index"] % 2 == 0 else "player2_name"

    update_fields = [
        "winner_name=NULL",
        "score1=NULL",
        "score2=NULL",
        "is_bye=FALSE",
        "status='pending'",
    ]
    if clear_players:
        update_fields.extend(["player1_name=NULL", "player2_name=NULL"])

    await db.execute(f"UPDATE bracket_matches SET {', '.join(update_fields)} WHERE id=$1", match_id)

    if not next_match_id:
        return

    await db.execute(
        f"""
        UPDATE bracket_matches
        SET {target_field}=NULL,
            winner_name=NULL,
            score1=NULL,
            score2=NULL,
            is_bye=FALSE,
            status='pending'
        WHERE id=$1
        """,
        next_match_id,
    )
    await _reset_match_state(db, next_match_id)


def _normalize_player_name(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


@router.get("/tournaments/{tournament_id}/bracket", response_model=List[MatchOut])
async def get_bracket(
    tournament_id: int,
    db: asyncpg.Connection = Depends(get_db),
):
    rows = await db.fetch(
        "SELECT * FROM bracket_matches WHERE tournament_id = $1 ORDER BY section, round, match_index",
        tournament_id,
    )
    return [MatchOut(**dict(row)) for row in rows]


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

    await db.execute("DELETE FROM bracket_matches WHERE tournament_id = $1", tournament_id)

    if body.custom_players:
        players = [player.strip() for player in body.custom_players if player.strip()]
    else:
        registrations = await db.fetch(
            """
            SELECT COALESCE(nickname, team_name) AS name
            FROM tournament_registrations
            WHERE tournament_id = $1
            """,
            tournament_id,
        )
        players = [registration["name"] for registration in registrations if registration["name"]]

    if len(players) < 1:
        raise HTTPException(400, "Добавьте хотя бы одного участника, чтобы сформировать сетку.")
    if len(players) > 32:
        raise HTTPException(400, "Максимум 32 участника")

    matches = _generate_single(players) if bracket_type == "single" else _generate_double(players)

    ids = []
    for match in matches:
        match_id = await db.fetchval(
            """
            INSERT INTO bracket_matches
              (tournament_id, bracket_type, section, round, match_index,
               player1_name, player2_name, winner_name, score1, score2, is_bye, status, match_format, start_time)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
            RETURNING id
            """,
            tournament_id,
            bracket_type,
            match["section"],
            match["round"],
            match["match_index"],
            match["player1_name"],
            match["player2_name"],
            match["winner_name"],
            match["score1"],
            match["score2"],
            match["is_bye"],
            match["status"],
            "BO1",
            None,
        )
        ids.append((match["section"], match["round"], match["match_index"], match_id))

    def find_id(section: str, round_number: int, match_index: int):
        for current_section, current_round, current_index, current_id in ids:
            if current_section == section and current_round == round_number and current_index == match_index:
                return current_id
        return None

    for section, round_number, match_index, match_id in ids:
        next_match_id = find_id(section, round_number + 1, match_index // 2)
        if next_match_id:
            await db.execute(
                "UPDATE bracket_matches SET next_winner_match_id=$1 WHERE id=$2",
                next_match_id,
                match_id,
            )

    for _, _, _, match_id in ids:
        match_row = await db.fetchrow("SELECT * FROM bracket_matches WHERE id=$1", match_id)
        if match_row and match_row["status"] == "bye":
            await _advance_winner(db, match_row)

    await db.execute(
        "UPDATE tournaments SET bracket_type=$1 WHERE id=$2",
        bracket_type,
        tournament_id,
    )

    return {"status": "generated", "matches": len(matches)}


@router.patch("/admin/bracket/match/{match_id}")
async def update_match(
    match_id: int,
    payload: MatchUpdate,
    db: asyncpg.Connection = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    match = await db.fetchrow("SELECT * FROM bracket_matches WHERE id=$1", match_id)
    if not match:
        raise HTTPException(404, "Match not found")

    if payload.status and payload.status not in VALID_STATUSES:
        raise HTTPException(400, "Invalid match status")
    if payload.match_format and payload.match_format not in VALID_MATCH_FORMATS:
        raise HTTPException(400, "match_format must be BO1, BO3 or BO5")

    player1_name = _normalize_player_name(payload.player1_name) if payload.player1_name is not None else match["player1_name"]
    player2_name = _normalize_player_name(payload.player2_name) if payload.player2_name is not None else match["player2_name"]
    winner_name = _normalize_player_name(payload.winner_name) if payload.winner_name is not None else match["winner_name"]
    status = payload.status or match["status"]
    is_bye = bool(payload.is_bye) if payload.is_bye is not None else bool(match["is_bye"])

    if winner_name and winner_name not in {player1_name, player2_name}:
        raise HTTPException(400, "winner_name must match one of the participants")

    if is_bye and not winner_name:
        winner_name = player1_name or player2_name

    if status in {"completed", "bye"} and not winner_name:
        raise HTTPException(400, "Completed or bye match must have a winner")

    if status == "cancelled":
        winner_name = None

    next_match_id = match["next_winner_match_id"]
    if next_match_id and (
        player1_name != match["player1_name"]
        or player2_name != match["player2_name"]
        or (match["winner_name"] and match["winner_name"] not in {player1_name, player2_name})
        or winner_name != match["winner_name"]
    ):
        await _reset_match_state(db, next_match_id)

    await db.execute(
        """
        UPDATE bracket_matches
        SET player1_name=$1,
            player2_name=$2,
            winner_name=$3,
            score1=$4,
            score2=$5,
            is_bye=$6,
            status=$7,
            match_format=$8,
            start_time=$9
        WHERE id=$10
        """,
        player1_name,
        player2_name,
        winner_name,
        payload.score1 if payload.score1 is not None else match["score1"],
        payload.score2 if payload.score2 is not None else match["score2"],
        is_bye,
        status,
        payload.match_format or match["match_format"] or "BO1",
        payload.start_time if payload.start_time is not None else match["start_time"],
        match_id,
    )

    updated_match = await db.fetchrow("SELECT * FROM bracket_matches WHERE id=$1", match_id)
    if updated_match and updated_match["winner_name"] and updated_match["status"] in {"completed", "bye"}:
        await _advance_winner(db, updated_match)

    return {"status": "updated"}


@router.patch("/admin/bracket/match/{match_id}/slot")
async def assign_player_slot(
    match_id: int,
    body: SlotAssign,
    db: asyncpg.Connection = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    if body.slot not in (1, 2):
        raise HTTPException(400, "slot must be 1 or 2")

    match = await db.fetchrow("SELECT * FROM bracket_matches WHERE id=$1", match_id)
    if not match:
        raise HTTPException(404, "Match not found")

    field = "player1_name" if body.slot == 1 else "player2_name"
    normalized_name = _normalize_player_name(body.player_name)
    await db.execute(
        f"UPDATE bracket_matches SET {field}=$1 WHERE id=$2",
        normalized_name,
        match_id,
    )

    if match["winner_name"] and match["winner_name"] == match[field]:
        await db.execute(
            """
            UPDATE bracket_matches
            SET winner_name=NULL, score1=NULL, score2=NULL, is_bye=FALSE, status='pending'
            WHERE id=$1
            """,
            match_id,
        )
        if match["next_winner_match_id"]:
            await _reset_match_state(db, match["next_winner_match_id"])

    return {"status": "ok"}


@router.post("/admin/bracket/match/{match_id}/reset")
async def reset_match_progress(
    match_id: int,
    db: asyncpg.Connection = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    match = await db.fetchrow("SELECT * FROM bracket_matches WHERE id=$1", match_id)
    if not match:
        raise HTTPException(404, "Match not found")

    await db.execute(
        """
        UPDATE bracket_matches
        SET winner_name=NULL,
            score1=NULL,
            score2=NULL,
            is_bye=FALSE,
            status='pending'
        WHERE id=$1
        """,
        match_id,
    )

    if match["next_winner_match_id"]:
        await _reset_match_state(db, match["next_winner_match_id"])

    return {"status": "reset"}


@router.delete("/admin/tournaments/{tournament_id}/bracket")
async def reset_bracket(
    tournament_id: int,
    db: asyncpg.Connection = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    await db.execute("DELETE FROM bracket_matches WHERE tournament_id=$1", tournament_id)
    return {"status": "reset"}
