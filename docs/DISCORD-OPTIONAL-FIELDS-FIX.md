# Исправление: Discord поля теперь опциональные

## Проблема

Пользователи, зарегистрированные через email/password, не имеют `discord_id` — у них это поле `NULL` в базе данных. 

Но Pydantic схемы объявляли `discord_id: int` без `Optional`, поэтому когда бэкенд пытался сериализовать такого пользователя — падал с ошибкой валидации и отдавал **500 Internal Server Error**.

## Решение

Все поля, которые заполняются только при Discord OAuth, теперь опциональные:

```python
from typing import Optional

class UserProfile(BaseModel):
    discord_id: Optional[int] = None
    discord_username: Optional[str] = None
    # остальные поля...
```

## Измененные модели

### backend/app/schemas.py

1. **UserProfile**
   - `discord_id: Optional[int] = None`
   - `discord_username: Optional[str] = None`

2. **ProfileResponse**
   - `discord_username: Optional[str] = None`

3. **XPTransaction**
   - `discord_id: Optional[int] = None`

4. **XPTransactionCreate**
   - `discord_id: Optional[int] = None`

5. **PointsPurchase**
   - `discord_id: Optional[int] = None`

6. **UserXPUpdate**
   - `discord_id: Optional[int] = None`

### backend/app/routes/admin.py

1. **UserOut**
   - `discord_id: Optional[int] = None`
   - `discord_username: Optional[str] = None`

2. **TeamMemberUpdate**
   - `discord_id: Optional[int] = None`

3. **TeamMemberResponse**
   - `discord_id: Optional[int] = None`
   - `discord_username: Optional[str] = None`

### backend/app/routes/content.py

1. **TeamMemberPublic**
   - `discord_id: Optional[int] = None`
   - `discord_username: Optional[str] = None`

## Правило

**Любое поле, которое не заполняется при обычной email регистрации, должно быть `Optional[тип] = None`**

Discord-специфичные поля:
- `discord_id`
- `discord_username`
- `discord_avatar` / `avatar_url` (если заполняется только из Discord)
- `user_tag` (Discord discriminator)

## Типы пользователей

### 1. Discord OAuth пользователи
```python
{
    "discord_id": 123456789,
    "discord_username": "JaK1L",
    "email": None,  # может быть None
    "password_hash": None
}
```

### 2. Email/Password пользователи
```python
{
    "discord_id": None,
    "discord_username": None,
    "email": "user@example.com",
    "password_hash": "hashed..."
}
```

## Проверка

После исправления:

1. ✅ Пользователи с Discord OAuth работают как раньше
2. ✅ Пользователи с email/password больше не вызывают 500 ошибку
3. ✅ API корректно сериализует оба типа пользователей

## Тестирование

Создайте тестового пользователя через email:

```bash
cd backend
python create_test_user.py
```

Затем попробуйте получить его профиль через API:

```bash
curl http://localhost:8000/api/profile/{user_id}
```

Должен вернуться корректный JSON без ошибок.

## Дополнительные изменения

Если в будущем добавляются новые поля, связанные с Discord:

1. Сделайте их `Optional[тип] = None`
2. Добавьте значение по умолчанию
3. Проверьте что API работает для обоих типов пользователей

## Коммит

```
fix: Сделаны опциональными все Discord-поля в Pydantic моделях

Это исправляет ошибку 500 при сериализации пользователей 
зарегистрированных через email/password
```

Коммит: `07e72ed`
