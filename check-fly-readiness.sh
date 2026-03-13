#!/bin/bash

# Скрипт проверки готовности к деплою на Fly.io

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

echo -e "${CYAN}🔍 Проверка готовности к деплою на Fly.io${NC}"
echo ""

all_good=true

# Проверка Fly CLI
echo -n "Проверка Fly CLI..."
if command -v fly &> /dev/null; then
    echo -e " ${GREEN}✓${NC}"
    fly_version=$(fly version)
    echo -e "  ${GRAY}Версия: $fly_version${NC}"
else
    echo -e " ${RED}✗${NC}"
    echo -e "  ${YELLOW}Установите: curl -L https://fly.io/install.sh | sh${NC}"
    all_good=false
fi

# Проверка авторизации
echo -n "Проверка авторизации..."
if fly auth whoami &> /dev/null; then
    echo -e " ${GREEN}✓${NC}"
    auth_user=$(fly auth whoami)
    echo -e "  ${GRAY}Пользователь: $auth_user${NC}"
else
    echo -e " ${RED}✗${NC}"
    echo -e "  ${YELLOW}Выполните: fly auth login${NC}"
    all_good=false
fi

# Проверка fly.toml
echo -n "Проверка fly.toml..."
if [ -f "fly.toml" ]; then
    echo -e " ${GREEN}✓${NC}"
else
    echo -e " ${RED}✗${NC}"
    echo -e "  ${YELLOW}Файл fly.toml не найден${NC}"
    all_good=false
fi

# Проверка Dockerfile.backend
echo -n "Проверка Dockerfile.backend..."
if [ -f "Dockerfile.backend" ]; then
    echo -e " ${GREEN}✓${NC}"
else
    echo -e " ${RED}✗${NC}"
    echo -e "  ${YELLOW}Файл Dockerfile.backend не найден${NC}"
    all_good=false
fi

# Проверка backend/app
echo -n "Проверка backend/app..."
if [ -d "backend/app" ]; then
    echo -e " ${GREEN}✓${NC}"
else
    echo -e " ${RED}✗${NC}"
    echo -e "  ${YELLOW}Директория backend/app не найдена${NC}"
    all_good=false
fi

# Проверка requirements.txt
echo -n "Проверка requirements.txt..."
if [ -f "backend/app/requirements.txt" ]; then
    echo -e " ${GREEN}✓${NC}"
else
    echo -e " ${YELLOW}⚠${NC}"
    echo -e "  ${YELLOW}Файл backend/app/requirements.txt не найден (может быть в backend/requirements.txt)${NC}"
fi

# Проверка наличия секретов
echo ""
echo -e "${CYAN}📋 Необходимые секреты для установки:${NC}"
echo ""
echo -e "${YELLOW}Обязательные:${NC}"
echo "  - SECRET_KEY (минимум 32 символа)"
echo "  - ADMIN_USERNAME"
echo "  - ADMIN_PASSWORD (минимум 8 символов)"
echo "  - DISCORD_CLIENT_ID"
echo "  - DISCORD_CLIENT_SECRET"
echo "  - FRONTEND_URL"
echo "  - BACKEND_URL"
echo "  - ALLOWED_ORIGINS"
echo ""
echo -e "${GRAY}Опциональные:${NC}"
echo "  - DISCORD_BOT_TOKEN"
echo "  - DISCORD_GUILD_ID"
echo "  - TWITCH_CLIENT_ID"
echo "  - TWITCH_CLIENT_SECRET"
echo "  - TELEGRAM_BOT_TOKEN"
echo "  - TELEGRAM_CHANNEL_USERNAME"
echo ""

# Итоговый результат
echo ""
if [ "$all_good" = true ]; then
    echo -e "${GREEN}✅ Все проверки пройдены! Готовы к деплою.${NC}"
    echo ""
    echo -e "${CYAN}Следующие шаги:${NC}"
    echo "1. Запустите: ./deploy-fly.sh --setup"
    echo "2. Установите секреты: fly secrets set SECRET_KEY=\"...\""
    echo "3. Запустите деплой: ./deploy-fly.sh --deploy"
    echo ""
    echo -e "${GRAY}Или следуйте инструкции: FLY-QUICKSTART.md${NC}"
else
    echo -e "${RED}❌ Некоторые проверки не прошли. Исправьте ошибки выше.${NC}"
fi
