"""
Тест Valorant API через backend сервис
"""
import asyncio
import sys
import os

# Добавляем путь к модулям
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.game_api_service import GameAPIService
from dotenv import load_dotenv

load_dotenv()

async def test_valorant_backend():
    """Тест Valorant через backend сервис"""
    
    service = GameAPIService()
    
    riot_id = "CJlOH"
    tag = "ZVZV"
    
    print("="*60)
    print("ТЕСТ: Valorant Profile через Backend Service")
    print("="*60)
    
    profile = await service.get_valorant_profile(riot_id, tag)
    
    if profile:
        print("✅ Профиль получен!")
        print(f"Username: {profile.get('username')}")
        print(f"Level: {profile.get('account_level')}")
        print(f"Region: {profile.get('region')}")
        print(f"Card URL: {profile.get('card_url')}")
    else:
        print("❌ Не удалось получить профиль")
    
    print("\n" + "="*60)
    print("ТЕСТ: Valorant MMR через Backend Service")
    print("="*60)
    
    mmr = await service.get_valorant_mmr(riot_id, tag)
    
    if mmr:
        print("✅ MMR получен!")
        print(f"Rank: {mmr.get('current_tier')}")
        print(f"ELO: {mmr.get('elo')}")
        print(f"Ranking in tier: {mmr.get('ranking_in_tier')}")
        print(f"Games needed: {mmr.get('games_needed_for_rating')}")
    else:
        print("❌ Не удалось получить MMR")

if __name__ == "__main__":
    asyncio.run(test_valorant_backend())
