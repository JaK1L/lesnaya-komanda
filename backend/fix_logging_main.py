"""
Скрипт для замены print() на logger в main.py
"""

replacements = [
    ('            print("✅ Таблица users создана или уже существует")', '            logger.info("✅ Таблица users создана или уже существует")'),
    ('            print("✅ Таблица game_profiles создана или уже существует")', '            logger.info("✅ Таблица game_profiles создана или уже существует")'),
    ('            print("✅ Таблица achievements создана или уже существует")', '            logger.info("✅ Таблица achievements создана или уже существует")'),
    ('            print("✅ Таблица admin_users создана или уже существует")', '            logger.info("✅ Таблица admin_users создана или уже существует")'),
    ('            print("✅ Таблица activity_log создана или уже существует")', '            logger.info("✅ Таблица activity_log создана или уже существует")'),
    ('            print("✅ Таблица voice_sessions создана или уже существует")', '            logger.info("✅ Таблица voice_sessions создана или уже существует")'),
    ('            print("✅ Таблица discord_presence создана или уже существует")', '            logger.info("✅ Таблица discord_presence создана или уже существует")'),
    ('            print("✅ Расширенные колонки discord_presence добавлены (roles, activity_started_at, game_icon_url)")', '            logger.info("✅ Расширенные колонки discord_presence добавлены (roles, activity_started_at, game_icon_url)")'),
    ('            print("✅ Таблица home_feed создана или уже существует")', '            logger.info("✅ Таблица home_feed создана или уже существует")'),
    ('            print("✅ Таблица site_settings создана или уже существует")', '            logger.info("✅ Таблица site_settings создана или уже существует")'),
    ('            print("✅ Таблицы news и events созданы или уже существуют")', '            logger.info("✅ Таблицы news и events созданы или уже существуют")'),
    ('            print("✅ Тестовые игроки добавлены (если таблица была пуста)")', '            logger.info("✅ Тестовые игроки добавлены (если таблица была пуста)")'),
    ('            print("✅ Тестовые достижения добавлены")', '            logger.info("✅ Тестовые достижения добавлены")'),
    ('            print("\\n🔐 Проверка администратора...")', '            logger.info("\\n🔐 Проверка администратора...")'),
    ('                print(f"✅ Админ обновлен: {existing_admin[\'username\']} → {admin_username}")', '                logger.info(f"✅ Админ обновлен: {existing_admin[\'username\']} → {admin_username}")'),
    ('                print(f"✅ Создан новый админ: {admin_username}")', '                logger.info(f"✅ Создан новый админ: {admin_username}")'),
    ('            print(f"📊 В базе: {users_count} игроков, {games_count} игровых профилей, {achievements_count} достижений")', '            logger.info(f"📊 В базе: {users_count} игроков, {games_count} игровых профилей, {achievements_count} достижений")'),
    ('            print("\\n🔄 Проверка миграции системы достижений...")', '            logger.info("\\n🔄 Проверка миграции системы достижений...")'),
    ('                    print("📝 Применение миграции системы достижений...")', '                    logger.info("📝 Применение миграции системы достижений...")'),
    ('                    print("✅ Миграция системы достижений успешно применена!")', '                    logger.info("✅ Миграция системы достижений успешно применена!")'),
    ('                    print("✅ Миграция системы достижений уже применена")', '                    logger.info("✅ Миграция системы достижений уже применена")'),
    ('                print(f"⚠️ Ошибка при применении миграции достижений: {achievements_error}")', '                logger.error(f"⚠️ Ошибка при применении миграции достижений: {achievements_error}", exc_info=True)'),
    ('            print("\\n🔄 Проверка миграции game_accounts...")', '            logger.info("\\n🔄 Проверка миграции game_accounts...")'),
    ('                    print("📝 Применение миграции game_accounts...")', '                    logger.info("📝 Применение миграции game_accounts...")'),
    ('                    print("✅ Миграция game_accounts успешно применена!")', '                    logger.info("✅ Миграция game_accounts успешно применена!")'),
    ('                    print("✅ Миграция game_accounts уже применена")', '                    logger.info("✅ Миграция game_accounts уже применена")'),
    ('                print(f"⚠️ Ошибка при применении миграции game_accounts: {game_accounts_error}")', '                logger.error(f"⚠️ Ошибка при применении миграции game_accounts: {game_accounts_error}", exc_info=True)'),
    ('            print("\\n🔄 Проверка миграции XP системы...")', '            logger.info("\\n🔄 Проверка миграции XP системы...")'),
    ('                    print("📝 Применение миграции XP системы...")', '                    logger.info("📝 Применение миграции XP системы...")'),
    ('                    print("✅ Миграция XP системы успешно применена!")', '                    logger.info("✅ Миграция XP системы успешно применена!")'),
    ('                    print("✅ Миграция XP системы уже применена")', '                    logger.info("✅ Миграция XP системы уже применена")'),
    ('                print(f"⚠️ Ошибка при применении миграции XP: {migration_error}")', '                logger.error(f"⚠️ Ошибка при применении миграции XP: {migration_error}", exc_info=True)'),
    ('            print("\\n✅ База данных полностью готова к работе!")', '            logger.info("\\n✅ База данных полностью готова к работе!")'),
    ('        print(f"❌ Ошибка при инициализации БД: {e}")', '        logger.error(f"❌ Ошибка при инициализации БД: {e}", exc_info=True)'),
]

# Read file
with open('backend/app/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Apply replacements
for old, new in replacements:
    content = content.replace(old, new)

# Remove traceback.print_exc() calls
content = content.replace('                import traceback\n                traceback.print_exc()', '')

# Write back
with open('backend/app/main.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Logging fixed in main.py")
