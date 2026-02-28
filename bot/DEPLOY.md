# Деплой Discord Бота

## Вариант 1: Railway (Рекомендуется)

1. Зайдите на [railway.app](https://railway.app)
2. Создайте новый проект: **New Project** → **Deploy from GitHub repo**
3. Выберите ваш репозиторий `lesnaya-komanda`
4. Railway автоматически обнаружит `bot/railway.json`
5. Настройте переменные окружения:
   - `DISCORD_BOT_TOKEN` - токен вашего Discord бота
   - `DISCORD_GUILD_ID` - ID вашего Discord сервера (236652227060563969)
   - `DATABASE_URL` - URL PostgreSQL БД (тот же, что у backend)
6. Нажмите **Deploy**

## Вариант 2: Render

1. Зайдите на [render.com](https://render.com)
2. Создайте новый **Background Worker**
3. Подключите GitHub репозиторий
4. Настройки:
   - **Root Directory**: `bot`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python main.py`
5. Добавьте переменные окружения:
   - `DISCORD_BOT_TOKEN`
   - `DISCORD_GUILD_ID`
   - `DATABASE_URL`
6. Нажмите **Create Background Worker**

## Вариант 3: Локальный запуск (для тестирования)

```bash
cd bot
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

## Проверка работы

После запуска бота проверьте:

1. **Логи бота** - должны быть сообщения:
   ```
   ✅ Бот YourBotName запущен!
   🌲 Подключен к серверу: ЛЕСНАЯ КОМАНДА
   🟢 Синхронизация статусов и активностей (presence)...
   ✅ Presence синхронизирован: X пользователей
   ```

2. **API endpoint** - откройте в браузере:
   ```
   https://your-backend.railway.app/api/discord/presence
   ```
   Должен вернуть JSON с активными пользователями.

3. **Сайт** - обновите страницу, блок "ЧТО ПРОИСХОДИТ В DISCORD" должен показать карточки игроков.

## Переменные окружения

Убедитесь, что все переменные настроены:

- `DISCORD_BOT_TOKEN` - получите в [Discord Developer Portal](https://discord.com/developers/applications)
- `DISCORD_GUILD_ID` - ID вашего сервера (ПКМ на сервере → Копировать ID)
- `DATABASE_URL` - PostgreSQL connection string (тот же, что у backend)

## Troubleshooting

**Бот не подключается:**
- Проверьте `DISCORD_BOT_TOKEN`
- Убедитесь, что бот добавлен на сервер
- Проверьте, что у бота есть права "Presence Intent" и "Server Members Intent" в Developer Portal

**Данные не появляются на сайте:**
- Проверьте `DATABASE_URL` - должен быть тот же, что у backend
- Проверьте логи бота на ошибки подключения к БД
- Убедитесь, что кто-то действительно играет в Discord

**Бот падает:**
- Проверьте логи на Railway/Render
- Убедитесь, что все зависимости установлены
- Проверьте версию Python (должна быть 3.12+)
