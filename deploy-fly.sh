#!/bin/bash

# Скрипт для деплоя бэкенда на Fly.io
# Использование: ./deploy-fly.sh [--setup|--deploy|--logs|--status]

set -e

APP_NAME="lesnaya-komanda-backend"
DB_NAME="lesnaya-komanda-db"
REGION="ams" # Amsterdam

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
log_info() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Проверка установки Fly CLI
check_fly_cli() {
    if ! command -v fly &> /dev/null; then
        log_error "Fly CLI не установлен"
        echo "Установите его: curl -L https://fly.io/install.sh | sh"
        exit 1
    fi
    log_info "Fly CLI установлен"
}

# Проверка авторизации
check_auth() {
    if ! fly auth whoami &> /dev/null; then
        log_error "Вы не авторизованы в Fly.io"
        echo "Выполните: fly auth login"
        exit 1
    fi
    log_info "Авторизация в Fly.io: OK"
}

# Первоначальная настройка
setup() {
    log_info "Начинаем первоначальную настройку..."
    
    # Создание Postgres базы
    log_info "Создание PostgreSQL базы данных..."
    if fly postgres create --name $DB_NAME --region $REGION; then
        log_info "База данных создана: $DB_NAME"
    else
        log_warn "База данных уже существует или произошла ошибка"
    fi
    
    # Создание приложения
    log_info "Создание приложения..."
    if fly launch --name $APP_NAME --region $REGION --no-deploy; then
        log_info "Приложение создано: $APP_NAME"
    else
        log_warn "Приложение уже существует или произошла ошибка"
    fi
    
    # Подключение базы к приложению
    log_info "Подключение базы данных к приложению..."
    if fly postgres attach $DB_NAME --app $APP_NAME; then
        log_info "База данных подключена"
    else
        log_warn "База данных уже подключена или произошла ошибка"
    fi
    
    log_info "Настройка завершена!"
    echo ""
    log_warn "Теперь установите секреты:"
    echo "fly secrets set SECRET_KEY=\"ваш-секретный-ключ\""
    echo "fly secrets set ADMIN_USERNAME=\"admin\""
    echo "fly secrets set ADMIN_PASSWORD=\"ваш-пароль\""
    echo "fly secrets set DISCORD_CLIENT_ID=\"...\""
    echo "fly secrets set DISCORD_CLIENT_SECRET=\"...\""
    echo "fly secrets set FRONTEND_URL=\"https://ваш-фронтенд.vercel.app\""
    echo "fly secrets set BACKEND_URL=\"https://$APP_NAME.fly.dev\""
    echo "fly secrets set ALLOWED_ORIGINS=\"https://ваш-фронтенд.vercel.app\""
    echo ""
    echo "После установки секретов запустите: ./deploy-fly.sh --deploy"
}

# Деплой приложения
deploy() {
    log_info "Начинаем деплой..."
    
    # Проверка наличия fly.toml
    if [ ! -f "fly.toml" ]; then
        log_error "Файл fly.toml не найден"
        exit 1
    fi
    
    # Деплой
    log_info "Деплой приложения на Fly.io..."
    fly deploy
    
    log_info "Деплой завершен!"
    echo ""
    log_info "Проверьте работу:"
    echo "Health check: https://$APP_NAME.fly.dev/health"
    echo "Database check: https://$APP_NAME.fly.dev/health/db"
    echo "API docs: https://$APP_NAME.fly.dev/api/docs"
}

# Просмотр логов
logs() {
    log_info "Просмотр логов..."
    fly logs
}

# Статус приложения
status() {
    log_info "Статус приложения:"
    fly status
    echo ""
    log_info "Список машин:"
    fly machine list
    echo ""
    log_info "Health checks:"
    fly checks list
}

# Главная функция
main() {
    check_fly_cli
    check_auth
    
    case "${1:-}" in
        --setup)
            setup
            ;;
        --deploy)
            deploy
            ;;
        --logs)
            logs
            ;;
        --status)
            status
            ;;
        *)
            echo "Использование: $0 [--setup|--deploy|--logs|--status]"
            echo ""
            echo "Команды:"
            echo "  --setup   Первоначальная настройка (создание БД и приложения)"
            echo "  --deploy  Деплой приложения"
            echo "  --logs    Просмотр логов"
            echo "  --status  Статус приложения"
            exit 1
            ;;
    esac
}

main "$@"
