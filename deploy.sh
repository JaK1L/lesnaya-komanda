#!/bin/bash

# 🚀 Скрипт автоматического деплоя "Лесная Команда"
# Версия: 1.0.0
# Дата: 07.03.2026

set -e  # Остановка при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода с цветом
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Заголовок
echo ""
echo "╔════════════════════════════════════════╗"
echo "║   🌲 Лесная Команда - Деплой          ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Проверка что мы в корне проекта
if [ ! -f "package.json" ] && [ ! -d "backend" ] && [ ! -d "frontend" ]; then
    print_error "Запустите скрипт из корня проекта!"
    exit 1
fi

# Проверка Git статуса
print_status "Проверка Git статуса..."
if [ -n "$(git status --porcelain)" ]; then
    print_warning "У вас есть незакоммиченные изменения!"
    read -p "Продолжить? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Проверка текущей ветки
CURRENT_BRANCH=$(git branch --show-current)
print_status "Текущая ветка: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "main" ]; then
    print_warning "Вы не на ветке main!"
    read -p "Продолжить деплой с ветки $CURRENT_BRANCH? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Пуш в GitHub
print_status "Пушим изменения в GitHub..."
git push origin $CURRENT_BRANCH
print_success "Код запушен в GitHub"

# Проверка что сервисы доступны
print_status "Проверка доступности сервисов..."

# Backend (Render)
BACKEND_URL="https://lesnayakomanda.onrender.com"
print_status "Проверка Backend ($BACKEND_URL)..."
if curl -s -f "$BACKEND_URL/api/" > /dev/null; then
    print_success "Backend доступен"
else
    print_error "Backend недоступен! Проверьте Render Dashboard"
    print_warning "Возможно сервис спит (cold start). Подождите 30 секунд..."
fi

# Frontend (Vercel)
FRONTEND_URL="https://lesnaya-komanda.vercel.app"
print_status "Проверка Frontend ($FRONTEND_URL)..."
if curl -s -f "$FRONTEND_URL" > /dev/null; then
    print_success "Frontend доступен"
else
    print_error "Frontend недоступен! Проверьте Vercel Dashboard"
fi

echo ""
print_status "Деплой запущен! Сервисы автоматически обновятся через 2-3 минуты"
echo ""

# Ссылки на дашборды
echo "📊 Дашборды для мониторинга:"
echo "   • Render:  https://dashboard.render.com/"
echo "   • Vercel:  https://vercel.com/dashboard"
echo "   • Railway: https://railway.app/dashboard"
echo "   • Neon:    https://console.neon.tech/"
echo ""

# Ожидание деплоя
print_status "Ожидание завершения деплоя (2 минуты)..."
sleep 120

# Проверка после деплоя
echo ""
print_status "Проверка после деплоя..."

# Backend health check
print_status "Backend health check..."
BACKEND_RESPONSE=$(curl -s "$BACKEND_URL/api/" || echo "error")
if echo "$BACKEND_RESPONSE" | grep -q "ok"; then
    print_success "Backend работает корректно"
else
    print_error "Backend вернул неожиданный ответ: $BACKEND_RESPONSE"
fi

# Frontend check
print_status "Frontend check..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
if [ "$FRONTEND_STATUS" = "200" ]; then
    print_success "Frontend работает корректно (HTTP $FRONTEND_STATUS)"
else
    print_error "Frontend вернул статус: HTTP $FRONTEND_STATUS"
fi

# CORS check
print_status "CORS check..."
CORS_RESPONSE=$(curl -s -X OPTIONS "$BACKEND_URL/api/token" \
    -H "Origin: $FRONTEND_URL" \
    -H "Access-Control-Request-Method: POST" \
    -i | grep -i "access-control-allow-origin" || echo "")

if echo "$CORS_RESPONSE" | grep -q "$FRONTEND_URL"; then
    print_success "CORS настроен правильно"
else
    print_error "CORS не настроен! Проверьте ALLOWED_ORIGINS на Render"
fi

# Итоговый отчет
echo ""
echo "╔════════════════════════════════════════╗"
echo "║   📋 Итоговый отчет                    ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "🌐 URLs:"
echo "   Frontend: $FRONTEND_URL"
echo "   Backend:  $BACKEND_URL"
echo "   API Docs: $BACKEND_URL/api/docs"
echo ""
echo "✅ Следующие шаги:"
echo "   1. Проверьте сайт: $FRONTEND_URL"
echo "   2. Проверьте админку: $FRONTEND_URL/admin"
echo "   3. Проверьте логи в Render/Vercel"
echo ""

print_success "Деплой завершен!"
