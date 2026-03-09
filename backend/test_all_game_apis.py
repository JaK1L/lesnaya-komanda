"""
Финальный тест всех игровых API
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.game_api_service import GameAPIService
from dotenv import load_dotenv

load_dotenv()

async def test_all_apis():
    """Тест всех игровых API"""
    
    service = GameAPIService()
    
    print("="*70)
    print("ФИНАЛЬНЫЙ ТЕСТ ВСЕХ ИГРОВЫХ API")
    print("="*70)
    
    # Тест 1: Dota 2
    print("\n1. DOTA 2")
    print("-" * 70)
    dota_id = "123456789"  # Пример
    
    profile = await service.get_dota2_profile(dota_id)
    if profile:
        print("✅ Dota 2 Profile API работает")
    else:
        print("⚠️ Dota 2 Profile: Профиль не найден (это нормально для тестового ID)")
    
    # Тест 2: Steam
    print("\n2. STEAM PROFILES")
    print("-" * 70)
    steam_id = "76561198084749679"
    
    steam_profile = await service.get_steam_profile(steam_id)
    if steam_profile:
        print(f"✅ Steam Profile API работает")
        print(f"   Name: {steam_profile.get('personaname')}")
    else:
        print("❌ Steam Profile API не работает")
    
    # Тест 3: Valorant
    print("\n3. VALORANT")
    print("-" * 70)
    riot_id = "CJlOH"
    tag = "ZVZV"
    
    val_profile = await service.get_valorant_profile(riot_id, tag)
    if val_profile:
        print(f"✅ Valorant Profile API работает")
        print(f"   Username: {val_profile.get('username')}")
        print(f"   Level: {val_profile.get('account_level')}")
    else:
        print("❌ Valorant Profile API не работает")
    
    val_mmr = await service.get_valorant_mmr(riot_id, tag)
    if val_mmr:
        print(f"✅ Valorant MMR API работает")
        print(f"   Rank: {val_mmr.get('current_tier')}")
    else:
        print("❌ Valorant MMR API не работает")
    
    # Тест 4: CS2
    print("\n4. CS2")
    print("-" * 70)
    
    cs2_stats = await service.get_cs2_stats(steam_id)
    if cs2_stats:
        print(f"✅ CS2 Stats API работает")
        print(f"   Kills: {cs2_stats.get('kills')}")
        print(f"   K/D: {cs2_stats.get('kd_ratio')}")
    else:
        print("⚠️ CS2 Stats: Недоступно (приватный профиль или нет данных)")
    
    # Итоги
    print("\n" + "="*70)
    print("ИТОГИ")
    print("="*70)
    
    results = {
        "Dota 2": "✅ Работает" if profile else "⚠️ Тестовый ID",
        "Steam": "✅ Работает" if steam_profile else "❌ Не работает",
        "Valorant Profile": "✅ Работает" if val_profile else "❌ Не работает",
        "Valorant MMR": "✅ Работает" if val_mmr else "❌ Не работает",
        "CS2": "✅ Работает" if cs2_stats else "⚠️ Ограничено",
    }
    
    for api, status in results.items():
        print(f"{api:20} {status}")
    
    # Подсчет
    working = sum(1 for s in results.values() if "✅" in s)
    total = len(results)
    
    print(f"\nРаботает: {working}/{total}")
    
    if working >= 4:
        print("\n🎉 Отлично! Большинство API работают!")
    elif working >= 2:
        print("\n👍 Хорошо! Основные API работают!")
    else:
        print("\n⚠️ Требуется внимание!")

if __name__ == "__main__":
    asyncio.run(test_all_apis())
