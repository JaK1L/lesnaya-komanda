"""
API для работы с событиями и регистрациями
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime, timedelta
import asyncpg
from pydantic import BaseModel, Field

from ..database import get_db
from ..auth import get_current_user, get_current_admin_user
from ..models import User

router = APIRouter(prefix="/events", tags=["events"])


# Модели
class EventRegistrationCreate(BaseModel):
    event_id: int


class EventRegistrationOut(BaseModel):
    id: int
    event_id: int
    user_id: int
    discord_id: int
    status: str
    registered_at: datetime
    attended: bool


class EventWithRegistration(BaseModel):
    id: int
    title: str
    description: str
    game: Optional[str]
    event_date: datetime
    status: str
    telegram_url: Optional[str]
    expires_at: Optional[datetime]
    max_participants: Optional[int]
    registration_enabled: bool
    # Дополнительные поля
    registered_count: int
    is_registered: bool = False
    can_register: bool = True


# Публичные эндпоинты
@router.get("/", response_model=List[EventWithRegistration])
async def list_events(
    upcoming_only: bool = True,
    db: asyncpg.Connection = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    """Получить список событий с информацией о регистрации."""
    
    # Базовый запрос
    query = """
        SELECT 
            e.id, e.title, e.description, e.game, e.event_date, e.status,
            e.telegram_url, e.expires_at, e.max_participants, e.registration_enabled,
            COUNT(er.id) FILTER (WHERE er.status = 'registered') as registered_count
        FROM events e
        LEFT JOIN event_registrations er ON e.id = er.event_id
    """
    
    conditions = []
    params = []
    
    if upcoming_only:
        conditions.append("(e.event_date > NOW() OR e.event_date IS NULL)")
    
    # Скрываем истекшие события
    conditions.append("(e.expires_at IS NULL OR e.expires_at > NOW())")
    
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
    
    query += " GROUP BY e.id ORDER BY e.event_date ASC NULLS LAST, e.id DESC"
    
    rows = await db.fetch(query, *params)
    
    events = []
    for row in rows:
        event_dict = dict(row)
        
        # Проверяем зарегистрирован ли текущий пользователь
        is_registered = False
        if current_user:
            reg = await db.fetchrow(
                "SELECT id FROM event_registrations WHERE event_id = $1 AND user_id = $2 AND status = 'registered'",
                event_dict['id'], current_user.id
            )
            is_registered = reg is not None
        
        # Проверяем можно ли зарегистрироваться
        can_register = event_dict['registration_enabled']
        if event_dict['max_participants']:
            can_register = can_register and event_dict['registered_count'] < event_dict['max_participants']
        
        event_dict['is_registered'] = is_registered
        event_dict['can_register'] = can_register
        
        events.append(EventWithRegistration(**event_dict))
    
    return events


@router.get("/calendar")
async def get_events_calendar(
    year: int,
    month: int,
    db: asyncpg.Connection = Depends(get_db),
):
    """Получить события для календаря (по месяцам)."""
    
    # Начало и конец месяца
    start_date = datetime(year, month, 1)
    if month == 12:
        end_date = datetime(year + 1, 1, 1)
    else:
        end_date = datetime(year, month + 1, 1)
    
    rows = await db.fetch(
        """
        SELECT 
            e.id, e.title, e.game, e.event_date, e.status,
            COUNT(er.id) FILTER (WHERE er.status = 'registered') as registered_count
        FROM events e
        LEFT JOIN event_registrations er ON e.id = er.event_id
        WHERE e.event_date >= $1 AND e.event_date < $2
        AND (e.expires_at IS NULL OR e.expires_at > NOW())
        GROUP BY e.id
        ORDER BY e.event_date ASC
        """,
        start_date, end_date
    )
    
    # Группируем по дням
    events_by_day = {}
    for row in rows:
        day = row['event_date'].day
        if day not in events_by_day:
            events_by_day[day] = []
        
        events_by_day[day].append({
            'id': row['id'],
            'title': row['title'],
            'game': row['game'],
            'time': row['event_date'].strftime('%H:%M'),
            'status': row['status'],
            'registered_count': row['registered_count'],
        })
    
    return {
        'year': year,
        'month': month,
        'events': events_by_day,
    }


@router.post("/register", response_model=EventRegistrationOut)
async def register_for_event(
    payload: EventRegistrationCreate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Зарегистрироваться на событие."""
    
    # Проверяем существование события
    event = await db.fetchrow(
        "SELECT id, max_participants, registration_enabled FROM events WHERE id = $1",
        payload.event_id
    )
    
    if not event:
        raise HTTPException(status_code=404, detail="Событие не найдено")
    
    if not event['registration_enabled']:
        raise HTTPException(status_code=400, detail="Регистрация на это событие закрыта")
    
    # Проверяем не зарегистрирован ли уже
    existing = await db.fetchrow(
        "SELECT id FROM event_registrations WHERE event_id = $1 AND user_id = $2",
        payload.event_id, current_user.id
    )
    
    if existing:
        raise HTTPException(status_code=400, detail="Вы уже зарегистрированы на это событие")
    
    # Проверяем лимит участников
    if event['max_participants']:
        count = await db.fetchval(
            "SELECT COUNT(*) FROM event_registrations WHERE event_id = $1 AND status = 'registered'",
            payload.event_id
        )
        
        if count >= event['max_participants']:
            raise HTTPException(status_code=400, detail="Достигнут лимит участников")
    
    # Получаем discord_id пользователя
    user_data = await db.fetchrow(
        "SELECT discord_id FROM users WHERE id = $1",
        current_user.id
    )
    
    # Регистрируем
    row = await db.fetchrow(
        """
        INSERT INTO event_registrations (event_id, user_id, discord_id, status)
        VALUES ($1, $2, $3, 'registered')
        RETURNING id, event_id, user_id, discord_id, status, registered_at, attended
        """,
        payload.event_id, current_user.id, user_data['discord_id']
    )
    
    return EventRegistrationOut(**dict(row))


@router.delete("/register/{event_id}")
async def unregister_from_event(
    event_id: int,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Отменить регистрацию на событие."""
    
    result = await db.execute(
        "DELETE FROM event_registrations WHERE event_id = $1 AND user_id = $2",
        event_id, current_user.id
    )
    
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Регистрация не найдена")
    
    return {"message": "Регистрация отменена"}


@router.get("/{event_id}/registrations", response_model=List[EventRegistrationOut])
async def get_event_registrations(
    event_id: int,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Получить список зарегистрированных на событие (только для админов)."""
    
    rows = await db.fetch(
        """
        SELECT id, event_id, user_id, discord_id, status, registered_at, attended
        FROM event_registrations
        WHERE event_id = $1
        ORDER BY registered_at ASC
        """,
        event_id
    )
    
    return [EventRegistrationOut(**dict(row)) for row in rows]


@router.put("/{event_id}/registrations/{registration_id}/attended")
async def mark_attendance(
    event_id: int,
    registration_id: int,
    attended: bool,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Отметить посещение события (только для админов)."""
    
    result = await db.execute(
        """
        UPDATE event_registrations
        SET attended = $1
        WHERE id = $2 AND event_id = $3
        """,
        attended, registration_id, event_id
    )
    
    if result == "UPDATE 0":
        raise HTTPException(status_code=404, detail="Регистрация не найдена")
    
    return {"message": "Посещение отмечено"}


@router.get("/upcoming/reminders")
async def get_upcoming_events_for_reminders(
    hours_ahead: int = 24,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Получить события для отправки напоминаний (только для админов)."""
    
    now = datetime.now()
    future = now + timedelta(hours=hours_ahead)
    
    rows = await db.fetch(
        """
        SELECT 
            e.id, e.title, e.event_date, e.telegram_url,
            array_agg(er.discord_id) as participant_ids
        FROM events e
        JOIN event_registrations er ON e.id = er.event_id
        WHERE e.event_date BETWEEN $1 AND $2
        AND e.reminder_sent = false
        AND er.status = 'registered'
        GROUP BY e.id
        ORDER BY e.event_date ASC
        """,
        now, future
    )
    
    return [dict(row) for row in rows]


@router.post("/{event_id}/mark-reminder-sent")
async def mark_reminder_sent(
    event_id: int,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Отметить что напоминание отправлено (только для админов)."""
    
    await db.execute(
        "UPDATE events SET reminder_sent = true WHERE id = $1",
        event_id
    )
    
    return {"message": "Напоминание отмечено как отправленное"}
