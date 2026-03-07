#!/bin/bash

# 🔍 Скрипт проверки деплоя "Лесная Команда"
# Проверяет все сервисы и их взаимодействие

set -e

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[✓]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }

# URLs
BACKEND_URL="https://lesnayakomanda.onrender.com"
FRONTEND_URL="https://lesnaya-komanda.vercel.app"

echo ""
echo "╔════════════════════════════════════════╗"
echo "║   🔍 Проверка деплоя                   ║"
echo "╚════════════════════════════════════════╝"
echo ""

# 1. Backend Health Check
print_status "1. Backend Health Check..."
BACKEND_RESPONSE=$(curl -s "$BACKEND_URL/api/" || echo "error")
if echo "$BACKEND_RESPONSE" | grep -q "ok"; then
    print_success "Backend работает"
    echo "   Response: $BACKEND_RESPONSE"
else
    print_error "Backend не отвечает"
    echo "   Response: $BACKEND_RESPONSE"
fi
echo ""

# 2. Backend API Docs
print_status "2. Backend API Documentation..."
DOCS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/docs")
if [ "$DOCS_STATUS" = "200" ]; then
    print_success "API Docs доступны: $BACKEND_URL/api/docs"
else
    print_error "API Docs недоступны (HTTP $DOCS_STATUS)"
fi
echo ""

# 3. Frontend Check
print_status "3. Frontend Check..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
if [ "$FRONTEND_STATUS" = "200" ]; then
    print_success "Frontend работает (HTTP $FRONTEND_STATUS)"
else
    print_error "Frontend не работает (HTTP $FRONTEND_STATUS)"
fi
echo ""

# 4. CORS Check
print_status "4. CORS Configuration..."
CORS_RESPONSE=$(curl -s -X OPTIONS "$BACKEND_URL/api/token" \
    -H "Origin: $FRONTEND_URL" \
    -H "Access-Control-Request-Method: POST" \
    -i | grep -i "access-control-allow-origin" || echo "")

if echo "$CORS_RESPONSE" | grep -q "$FRONTEND_URL"; then
    print_success "CORS настроен правильно"
    echo "   $CORS_RESPONSE"
else
    print_error "CORS не настроен!"
    print_warning "Проверьте ALLOWED_ORIGINS на Render"
fi
echo ""

# 5. Database Connection (через API)
print_status "5. Database Connection..."
NEWS_RESPONSE=$(curl -s "$BACKEND_URL/api/news?limit=1" || echo "error")
if echo "$NEWS_RESPONSE" | grep -q "items"; then
    print_success "База данных подключена"
else
    print_error "База данных не подключена"
    echo "   Response: $NEWS_RESPONSE"
fi
echo ""

# 6. Admin Login Test
print_status "6. Admin Login Test..."
LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=LesnoyBOSS&password=LesnoyBOSS909!" || echo "error")

if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
    print_success "Админ логин работает"
else
    print_error "Админ логин не работает"
    echo "   Response: $LOGIN_RESPONSE"
fi
echo ""

# 7. SSL Certificate Check
print_status "7. SSL Certificate..."
SSL_INFO=$(curl -s -vI "$FRONTEND_URL" 2>&1 | grep -i "SSL certificate" || echo "")
if curl -s "$FRONTEND_URL" > /dev/null 2>&1; then
    print_success "SSL сертификат валиден"
else
    print_error "Проблема с SSL сертификатом"
fi
echo ""

# 8. Response Time Check
print_status "8. Response Time..."
BACKEND_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$BACKEND_URL/api/")
FRONTEND_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$FRONTEND_URL")

echo "   Backend:  ${BACKEND_TIME}s"
echo "   Frontend: ${FRONTEND_TIME}s"

if (( $(echo "$BACKEND_TIME < 2.0" | bc -l) )); then
    print_success "Backend отвечает быстро"
else
    print_warning "Backend отвечает медленно (возможно cold start)"
fi
echo ""

# Итоговый отчет
echo "╔════════════════════════════════════════╗"
echo "║   📊 Итоговый отчет                    ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "🌐 URLs:"
echo "   Frontend:  $FRONTEND_URL"
echo "   Backend:   $BACKEND_URL"
echo "   API Docs:  $BACKEND_URL/api/docs"
echo "   Admin:     $FRONTEND_URL/admin"
echo ""
echo "📊 Дашборды:"
echo "   Render:    https://dashboard.render.com/"
echo "   Vercel:    https://vercel.com/dashboard"
echo "   Railway:   https://railway.app/dashboard"
echo "   Neon:      https://console.neon.tech/"
echo ""

print_success "Проверка завершена!"
