# Исправление ошибки 500 на /api/profile

## Проблема
При регистрации через email/password пользователь создавался успешно, но при попытке открыть профиль возникала ошибка 500 Internal Server Error.

## Причина
Поле `discord_id` в таблице `users` может быть NULL для пользователей, зарегистрированных через email (только для Discord OAuth пользователей оно заполняется). 

В коде:
- `ProfileResponse` модель требовала `discord_id: int` (обязательное поле)
- `ProfileService.get_user_profile()` возвращал NULL значение для `discord_id`
- Pydantic валидация падала с ошибкой при попытке создать ProfileResponse с NULL discord_id

## Решение

### Backend изменения:

1. **backend/app/schemas.py**
   - Изменено `discord_id: int` на `discord_id: Optional[int] = None` в `ProfileResponse`

2. **backend/app/services/profile_service.py**
   - В `get_user_profile()`: добавлена проверка `discord_id=row['discord_id'] if row['discord_id'] else None`
   - В `update_user_profile()`: добавлена та же проверка

### Frontend изменения:

3. **frontend/app/profile/page.tsx**
   - Изменен тип `discord_id: number` на `discord_id: number | null` в интерфейсе `ProfileData`
   - Добавлена условная отрисовка `AchievementsSection` - показывается только если `discord_id` не null
   - Для email-пользователей показывается сообщение "Достижения доступны только для пользователей Discord"

## Результат
- ✅ Профиль теперь корректно загружается для пользователей зарегистрированных через email
- ✅ Профиль продолжает работать для Discord OAuth пользователей
- ✅ Достижения показываются только для Discord пользователей (у которых есть discord_id)

## Дополнительные исправления (из предыдущих задач)

### Navigation.tsx
- ✅ Кнопка "Выйти" теперь использует стиль `loginButton` (как кнопка "Войти")
- ✅ Название сайта изменено с "STREAM HUB" на "LESNAYA KOMANDA"
- ✅ Навигация исправлена: добавлена ссылка "Соцсети", "Новости" ведут на `/#news`

### page.tsx (главная страница)
- ✅ Добавлен блок EventsSection на главную страницу

## Тестирование
1. Зарегистрируйтесь через email/password
2. Откройте страницу профиля
3. Профиль должен загрузиться без ошибок
4. Секция "Достижения" должна показывать сообщение о том, что они доступны только для Discord пользователей
