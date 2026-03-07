"""
Команды для взаимодействия с сайтом
"""
import discord
from discord.ext import commands
import aiohttp
import os

API_URL = os.getenv('API_URL', 'http://localhost:8000')
WEBSITE_URL = os.getenv('WEBSITE_URL', 'https://lesnaya-komanda.vercel.app')

class Website(commands.Cog):
    """Команды для взаимодействия с сайтом Лесной Команды"""
    
    def __init__(self, bot):
        self.bot = bot
        self.session = None
    
    async def cog_load(self):
        """Создаем HTTP сессию при загрузке"""
        self.session = aiohttp.ClientSession()
    
    async def cog_unload(self):
        """Закрываем HTTP сессию при выгрузке"""
        if self.session:
            await self.session.close()
    
    @commands.command(name='сайт', aliases=['site', 'website'])
    async def website(self, ctx):
        """Ссылка на сайт команды"""
        embed = discord.Embed(
            title="🌲 Сайт Лесной Команды",
            description=f"Посети наш официальный сайт!",
            url=WEBSITE_URL,
            color=0x4aff75
        )
        embed.add_field(
            name="🔗 Ссылка",
            value=f"[{WEBSITE_URL}]({WEBSITE_URL})",
            inline=False
        )
        embed.add_field(
            name="📱 Возможности",
            value="• Профили игроков\n• Рейтинги и статистика\n• Новости и события\n• Стримы команды",
            inline=False
        )
        embed.set_footer(text="Нажми на ссылку чтобы открыть сайт")
        await ctx.send(embed=embed)
    
    @commands.command(name='мойпрофиль', aliases=['myprofile', 'profile'])
    async def my_profile(self, ctx):
        """Ссылка на твой профиль на сайте"""
        profile_url = f"{WEBSITE_URL}/profile/{ctx.author.id}"
        
        embed = discord.Embed(
            title=f"👤 Профиль {ctx.author.display_name}",
            description=f"Твой профиль на сайте Лесной Команды",
            url=profile_url,
            color=ctx.author.color
        )
        embed.set_thumbnail(url=ctx.author.display_avatar.url)
        embed.add_field(
            name="🔗 Ссылка на профиль",
            value=f"[Открыть профиль]({profile_url})",
            inline=False
        )
        embed.add_field(
            name="✏️ Редактирование",
            value="Войди на сайт через Discord чтобы редактировать профиль",
            inline=False
        )
        await ctx.send(embed=embed)
    
    @commands.command(name='новости', aliases=['news'])
    async def news(self, ctx, limit: int = 3):
        """Последние новости с сайта"""
        try:
            async with self.session.get(f"{API_URL}/api/news") as resp:
                if resp.status != 200:
                    await ctx.send("❌ Не удалось получить новости")
                    return
                
                news_list = await resp.json()
                
                if not news_list:
                    await ctx.send("📰 Новостей пока нет")
                    return
                
                embed = discord.Embed(
                    title="📰 Последние новости",
                    color=0x4aff75
                )
                
                for news in news_list[:limit]:
                    # Обрезаем контент если он слишком длинный
                    content = news.get('content', '')
                    if len(content) > 200:
                        content = content[:200] + '...'
                    
                    embed.add_field(
                        name=news.get('title', 'Без названия'),
                        value=content or 'Нет описания',
                        inline=False
                    )
                
                embed.set_footer(text=f"Больше новостей на {WEBSITE_URL}")
                await ctx.send(embed=embed)
                
        except Exception as e:
            await ctx.send(f"❌ Ошибка: {str(e)}")
    
    @commands.command(name='события', aliases=['events'])
    async def events(self, ctx, limit: int = 3):
        """Ближайшие события"""
        try:
            async with self.session.get(f"{API_URL}/api/events") as resp:
                if resp.status != 200:
                    await ctx.send("❌ Не удалось получить события")
                    return
                
                events_list = await resp.json()
                
                if not events_list:
                    await ctx.send("📅 Событий пока нет")
                    return
                
                embed = discord.Embed(
                    title="📅 Ближайшие события",
                    color=0x4aff75
                )
                
                for event in events_list[:limit]:
                    game_emoji = {
                        'cs2': '🔫',
                        'dota2': '⚔️',
                        'valorant': '🎯'
                    }.get(event.get('game', '').lower(), '🎮')
                    
                    event_date = event.get('event_date', 'Дата не указана')
                    if event_date and event_date != 'Дата не указана':
                        # Форматируем дату если она есть
                        try:
                            from datetime import datetime
                            dt = datetime.fromisoformat(event_date.replace('Z', '+00:00'))
                            event_date = dt.strftime('%d.%m.%Y %H:%M')
                        except:
                            pass
                    
                    description = event.get('description', 'Нет описания')
                    if len(description) > 150:
                        description = description[:150] + '...'
                    
                    embed.add_field(
                        name=f"{game_emoji} {event.get('title', 'Без названия')}",
                        value=f"{description}\n📅 {event_date}\n📊 {event.get('status', 'Планируется')}",
                        inline=False
                    )
                
                embed.set_footer(text=f"Больше событий на {WEBSITE_URL}")
                await ctx.send(embed=embed)
                
        except Exception as e:
            await ctx.send(f"❌ Ошибка: {str(e)}")
    
    @commands.command(name='стримы', aliases=['streams'])
    async def streams(self, ctx):
        """Ссылка на страницу стримов"""
        streams_url = f"{WEBSITE_URL}/streams"
        
        embed = discord.Embed(
            title="🎮 Стримы Лесной Команды",
            description="Смотри прямые трансляции от участников команды!",
            url=streams_url,
            color=0x9146FF
        )
        embed.add_field(
            name="🔴 Live стримы",
            value=f"[Смотреть сейчас]({streams_url})",
            inline=False
        )
        embed.add_field(
            name="📺 Платформы",
            value="• Twitch\n• YouTube",
            inline=False
        )
        await ctx.send(embed=embed)
    
    @commands.command(name='соцсети', aliases=['social'])
    async def social(self, ctx):
        """Наши соцсети"""
        social_url = f"{WEBSITE_URL}/social"
        
        embed = discord.Embed(
            title="🌐 Мы в соцсетях",
            description="Подписывайся на наши каналы!",
            url=social_url,
            color=0x4aff75
        )
        embed.add_field(
            name="💬 Discord",
            value="Ты уже здесь! 😊",
            inline=True
        )
        embed.add_field(
            name="✈️ Telegram",
            value="[Подписаться](https://t.me/lesnaya_komanda)",
            inline=True
        )
        embed.add_field(
            name="📺 YouTube",
            value="[Подписаться](https://youtube.com/@lesnaya_komanda)",
            inline=True
        )
        embed.set_footer(text=f"Все ссылки: {social_url}")
        await ctx.send(embed=embed)

async def setup(bot):
    await bot.add_cog(Website(bot))
