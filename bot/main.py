import discord
from discord.ext import commands
import os
from dotenv import load_dotenv
import asyncpg
import aiohttp
from datetime import datetime, timezone
import asyncio
import json

load_dotenv()

TOKEN = os.getenv('DISCORD_BOT_TOKEN')
GUILD_ID = int(os.getenv('DISCORD_GUILD_ID', '236652227060563969'))
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/lesnaya')

intents = discord.Intents.default()
intents.members = True
intents.presences = True
intents.message_content = True
# Удаляем встроенную команду help, чтобы использовать свою
bot = commands.Bot(command_prefix='!', intents=intents, help_command=None)

class StatsCollector:
    def __init__(self):
        self.db_pool = None
    
    async def init_db(self):
        self.db_pool = await asyncpg.create_pool(DATABASE_URL)

    async def upsert_presence(self, member: discord.Member):
        """Сохранить статус/активность участника (для сайта)."""
        if member.bot:
            return

        status = str(member.status) if member.status else "offline"

        # Сбор ролей (исключаем @everyone)
        roles = []
        for role in member.roles[1:]:  # Пропускаем @everyone (первая роль)
            role_color = None
            if role.color.value != 0:  # Если цвет установлен
                # Преобразуем в hex формат
                role_color = f"#{role.color.value:06x}"
            roles.append({
                "name": role.name,
                "color": role_color
            })

        activity_name = None
        activity_type = None
        activity_started_at = None
        game_icon_url = None
        custom_status = None
        
        # Сначала ищем Custom Status отдельно
        for act in getattr(member, "activities", []) or []:
            try:
                if act is None:
                    continue
                atype = getattr(act, "type", None)
                if atype is not None:
                    type_value = atype.value if hasattr(atype, 'value') else atype
                    if type_value == 4:  # Custom Status
                        custom_status = getattr(act, "name", None) or getattr(act, "state", None)
                        break
            except Exception:
                continue
        
        # Теперь ищем игры (ActivityType.playing) и соревнования (ActivityType.competing)
        for act in getattr(member, "activities", []) or []:
            try:
                if act is None:
                    continue
                
                atype = getattr(act, "type", None)
                
                # Фильтруем только игры (playing = 0) и соревнования (competing = 5)
                if atype is not None:
                    type_value = atype.value if hasattr(atype, 'value') else atype
                    if type_value not in [0, 5]:  # 0 = playing, 5 = competing
                        continue
                
                name = getattr(act, "name", None)
                if name:
                    activity_name = str(name)[:200]
                    activity_type = str(atype).split(".")[-1] if atype is not None else None
                    
                    # Получаем timestamp начала активности
                    start = getattr(act, "start", None)
                    if start:
                        activity_started_at = start
                    
                    # Получаем иконку игры (для Rich Presence)
                    if hasattr(act, "large_image_url"):
                        game_icon_url = act.large_image_url
                    elif hasattr(act, "small_image_url"):
                        game_icon_url = act.small_image_url
                    
                    break
            except Exception:
                continue

        # Получаем аватар пользователя (приоритет: guild avatar > user avatar > default)
        avatar_url = None
        if member.guild_avatar:
            avatar_url = str(member.guild_avatar.url)
        elif member.avatar:
            avatar_url = str(member.avatar.url)
        
        # Если аватар не найден, используем дефолтный Discord аватар
        if not avatar_url:
            # Дефолтный аватар Discord основан на user ID
            default_avatar_index = (member.id >> 22) % 6
            avatar_url = f"https://cdn.discordapp.com/embed/avatars/{default_avatar_index}.png"

        async with self.db_pool.acquire() as conn:
            # Таблица создаётся бэкендом, но upsert безопасен
            await conn.execute(
                """
                INSERT INTO discord_presence (
                    discord_id, status, activity_name, activity_type,
                    roles, activity_started_at, game_icon_url, custom_status, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
                ON CONFLICT (discord_id) DO UPDATE SET
                    status = EXCLUDED.status,
                    activity_name = EXCLUDED.activity_name,
                    activity_type = EXCLUDED.activity_type,
                    roles = EXCLUDED.roles,
                    activity_started_at = EXCLUDED.activity_started_at,
                    game_icon_url = EXCLUDED.game_icon_url,
                    custom_status = EXCLUDED.custom_status,
                    updated_at = NOW()
                """,
                member.id,
                status,
                activity_name,
                activity_type,
                json.dumps(roles),
                activity_started_at,
                game_icon_url,
                custom_status,
            )

            # Обновим users, чтобы имя/аватар были свежими
            joined_at = member.joined_at or datetime.utcnow()
            if joined_at.tzinfo is not None:
                joined_at = joined_at.astimezone(timezone.utc).replace(tzinfo=None)

            await conn.execute(
                """
                INSERT INTO users (discord_id, discord_username, joined_at, avatar_url, last_seen)
                VALUES ($1, $2, $3, $4, NOW())
                ON CONFLICT (discord_id) DO UPDATE SET
                    discord_username = EXCLUDED.discord_username,
                    avatar_url = EXCLUDED.avatar_url,
                    last_seen = NOW()
                """,
                member.id,
                member.display_name or str(member),
                joined_at,
                avatar_url,
            )
    
    async def log_message(self, message):
        if message.author.bot:
            return
        
        async with self.db_pool.acquire() as conn:
            await conn.execute('''
                INSERT INTO activity_log (discord_id, username, type, channel, content, created_at)
                VALUES ($1, $2, $3, $4, $5, $6)
            ''', message.author.id, str(message.author), 'message', 
                message.channel.name, message.content[:500], message.created_at)
    
    async def log_voice_state(self, member, before, after):
        if before.channel != after.channel:
            async with self.db_pool.acquire() as conn:
                if after.channel:
                    await conn.execute('''
                        INSERT INTO voice_sessions (discord_id, channel, joined_at)
                        VALUES ($1, $2, $3)
                    ''', member.id, after.channel.name, datetime.utcnow())
                
                if before.channel:
                    await conn.execute('''
                        UPDATE voice_sessions 
                        SET left_at = $3 
                        WHERE discord_id = $1 AND left_at IS NULL
                    ''', member.id, before.channel.name, datetime.utcnow())

stats = StatsCollector()

@bot.event
async def on_ready():
    print(f'✅ Бот {bot.user} запущен!')
    await stats.init_db()
    
    # Загружаем cogs
    try:
        await bot.load_extension('cogs.website')
        print('✅ Загружен cog: website')
    except Exception as e:
        print(f'❌ Ошибка загрузки cog website: {e}')
    
    guild = bot.get_guild(GUILD_ID)
    if guild:
        print(f'🌲 Подключен к серверу: {guild.name}')
        print(f'👥 Участников: {len(guild.members)}')
        
        # Синхронизируем участников сервера с БД (сайт показывает этих же пользователей)
        for member in guild.members:
            if member.bot:
                continue
            
            # Получаем аватар пользователя (приоритет: guild avatar > user avatar > default)
            avatar_url = None
            if member.guild_avatar:
                avatar_url = str(member.guild_avatar.url)
            elif member.avatar:
                avatar_url = str(member.avatar.url)
            
            # Если аватар не найден, используем дефолтный Discord аватар
            if not avatar_url:
                default_avatar_index = (member.id >> 22) % 6
                avatar_url = f"https://cdn.discordapp.com/embed/avatars/{default_avatar_index}.png"
            
            joined_at = member.joined_at or datetime.utcnow()
            if joined_at.tzinfo is not None:
                joined_at = joined_at.astimezone(timezone.utc).replace(tzinfo=None)
            
            async with stats.db_pool.acquire() as conn:
                await conn.execute(
                    '''
                    INSERT INTO users (discord_id, discord_username, joined_at, avatar_url, last_seen)
                    VALUES ($1, $2, $3, $4, NOW())
                    ON CONFLICT (discord_id) DO UPDATE SET
                        discord_username = EXCLUDED.discord_username,
                        avatar_url = EXCLUDED.avatar_url,
                        last_seen = NOW()
                ''',
                    member.id,
                    member.display_name or str(member),
                    joined_at,
                    avatar_url,
                )

        # Первичная синхронизация presence/активностей
        print("🟢 Синхронизация статусов и активностей (presence)...")
        synced = 0
        for member in guild.members:
            try:
                await stats.upsert_presence(member)
                synced += 1
            except Exception:
                pass
        print(f"✅ Presence синхронизирован: {synced} пользователей")
    else:
        print(f'❌ Сервер с ID {GUILD_ID} не найден!')

@bot.event
async def on_message(message):
    await stats.log_message(message)
    await bot.process_commands(message)

@bot.event
async def on_voice_state_update(member, before, after):
    await stats.log_voice_state(member, before, after)


@bot.event
async def on_presence_update(before: discord.Member, after: discord.Member):
    # Обновляем presence в БД при изменениях (онлайн/игра/статус)
    try:
        await stats.upsert_presence(after)
    except Exception:
        pass

@bot.command(name='помощь', aliases=['help', 'команды'])
async def help_command(ctx):
    """Список всех команд бота"""
    embed = discord.Embed(
        title="🌲 Команды Лесной Команды",
        description="Список доступных команд бота",
        color=0x4aff75
    )
    
    # Основные команды
    embed.add_field(
        name="📊 Статистика",
        value="`!лес` - Информация о сервере\n"
              "`!профиль [@user]` - Профиль игрока\n"
              "`!топ [число]` - Топ по активности",
        inline=False
    )
    
    # Команды сайта
    embed.add_field(
        name="🌐 Сайт",
        value="`!сайт` - Ссылка на сайт\n"
              "`!мойпрофиль` - Твой профиль на сайте\n"
              "`!новости` - Последние новости\n"
              "`!события` - Ближайшие события\n"
              "`!стримы` - Страница стримов\n"
              "`!соцсети` - Наши соцсети",
        inline=False
    )
    
    embed.set_footer(text="Используй ! перед командой")
    await ctx.send(embed=embed)

@bot.command(name='лес')
async def forest_info(ctx):
    """Информация о Лесной Команде"""
    guild = ctx.guild
    online = sum(member.status != discord.Status.offline for member in guild.members)
    
    embed = discord.Embed(
        title="🌲 ЛЕСНАЯ КОМАНДА",
        description=f"**Участников:** {guild.member_count}\n**Онлайн:** {online}\n**ID:** {GUILD_ID}",
        color=0x4aff75
    )
    embed.set_footer(text="🍃 Сайт: lesnaya-team.ru (скоро)")
    await ctx.send(embed=embed)

@bot.command(name='профиль')
async def profile(ctx, member: discord.Member = None):
    """Показать профиль игрока"""
    if member is None:
        member = ctx.author
    
    async with stats.db_pool.acquire() as conn:
        # Получаем статистику из БД
        messages = await conn.fetchval(
            'SELECT COUNT(*) FROM activity_log WHERE discord_id = $1',
            member.id
        )
        
        voice_time = await conn.fetchval('''
            SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (left_at - joined_at))), 0)
            FROM voice_sessions 
            WHERE discord_id = $1 AND left_at IS NOT NULL
        ''', member.id)
    
    embed = discord.Embed(
        title=f"🐺 Профиль {member.display_name}",
        color=member.color
    )
    embed.set_thumbnail(url=member.avatar.url if member.avatar else member.default_avatar.url)
    embed.add_field(name="📅 В лесу с", value=member.joined_at.strftime("%d.%m.%Y"), inline=True)
    embed.add_field(name="💬 Сообщений", value=messages or 0, inline=True)
    embed.add_field(name="🎤 В голосе", value=f"{int(voice_time/3600)} часов" if voice_time else "0 часов", inline=True)
    
    roles = [role.name for role in member.roles[1:4]]
    if roles:
        embed.add_field(name="🏷️ Роли", value=", ".join(roles), inline=False)
    
    await ctx.send(embed=embed)

@bot.command(name='топ')
async def leaderboard(ctx, limit: int = 10):
    """Топ игроков по активности"""
    async with stats.db_pool.acquire() as conn:
        rows = await conn.fetch('''
            SELECT username, COUNT(*) as msg_count
            FROM activity_log
            GROUP BY discord_id, username
            ORDER BY msg_count DESC
            LIMIT $1
        ''', limit)
    
    embed = discord.Embed(title="🏆 Топ по сообщениям", color=0xffd700)
    for i, row in enumerate(rows, 1):
        embed.add_field(name=f"{i}. {row['username']}", value=f"{row['msg_count']} сообщений", inline=False)
    
    await ctx.send(embed=embed)

bot.run(TOKEN)