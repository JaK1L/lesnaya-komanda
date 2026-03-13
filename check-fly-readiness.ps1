# Скрипт проверки готовности к деплою на Fly.io

Write-Host "🔍 Проверка готовности к деплою на Fly.io" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Проверка Fly CLI
Write-Host "Проверка Fly CLI..." -NoNewline
if (Get-Command fly -ErrorAction SilentlyContinue) {
    Write-Host " ✓" -ForegroundColor Green
    $flyVersion = fly version
    Write-Host "  Версия: $flyVersion" -ForegroundColor Gray
} else {
    Write-Host " ✗" -ForegroundColor Red
    Write-Host "  Установите: powershell -Command `"iwr https://fly.io/install.ps1 -useb | iex`"" -ForegroundColor Yellow
    $allGood = $false
}

# Проверка авторизации
Write-Host "Проверка авторизации..." -NoNewline
$authCheck = fly auth whoami 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host " ✓" -ForegroundColor Green
    Write-Host "  Пользователь: $authCheck" -ForegroundColor Gray
} else {
    Write-Host " ✗" -ForegroundColor Red
    Write-Host "  Выполните: fly auth login" -ForegroundColor Yellow
    $allGood = $false
}

# Проверка fly.toml
Write-Host "Проверка fly.toml..." -NoNewline
if (Test-Path "fly.toml") {
    Write-Host " ✓" -ForegroundColor Green
} else {
    Write-Host " ✗" -ForegroundColor Red
    Write-Host "  Файл fly.toml не найден" -ForegroundColor Yellow
    $allGood = $false
}

# Проверка Dockerfile.backend
Write-Host "Проверка Dockerfile.backend..." -NoNewline
if (Test-Path "Dockerfile.backend") {
    Write-Host " ✓" -ForegroundColor Green
} else {
    Write-Host " ✗" -ForegroundColor Red
    Write-Host "  Файл Dockerfile.backend не найден" -ForegroundColor Yellow
    $allGood = $false
}

# Проверка backend/app
Write-Host "Проверка backend/app..." -NoNewline
if (Test-Path "backend/app") {
    Write-Host " ✓" -ForegroundColor Green
} else {
    Write-Host " ✗" -ForegroundColor Red
    Write-Host "  Директория backend/app не найдена" -ForegroundColor Yellow
    $allGood = $false
}

# Проверка requirements.txt
Write-Host "Проверка requirements.txt..." -NoNewline
if (Test-Path "backend/app/requirements.txt") {
    Write-Host " ✓" -ForegroundColor Green
} else {
    Write-Host " ⚠" -ForegroundColor Yellow
    Write-Host "  Файл backend/app/requirements.txt не найден (может быть в backend/requirements.txt)" -ForegroundColor Yellow
}

# Проверка наличия секретов
Write-Host ""
Write-Host "📋 Необходимые секреты для установки:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Обязательные:" -ForegroundColor Yellow
Write-Host "  - SECRET_KEY (минимум 32 символа)"
Write-Host "  - ADMIN_USERNAME"
Write-Host "  - ADMIN_PASSWORD (минимум 8 символов)"
Write-Host "  - DISCORD_CLIENT_ID"
Write-Host "  - DISCORD_CLIENT_SECRET"
Write-Host "  - FRONTEND_URL"
Write-Host "  - BACKEND_URL"
Write-Host "  - ALLOWED_ORIGINS"
Write-Host ""
Write-Host "Опциональные:" -ForegroundColor Gray
Write-Host "  - DISCORD_BOT_TOKEN"
Write-Host "  - DISCORD_GUILD_ID"
Write-Host "  - TWITCH_CLIENT_ID"
Write-Host "  - TWITCH_CLIENT_SECRET"
Write-Host "  - TELEGRAM_BOT_TOKEN"
Write-Host "  - TELEGRAM_CHANNEL_USERNAME"
Write-Host ""

# Итоговый результат
Write-Host ""
if ($allGood) {
    Write-Host "✅ Все проверки пройдены! Готовы к деплою." -ForegroundColor Green
    Write-Host ""
    Write-Host "Следующие шаги:" -ForegroundColor Cyan
    Write-Host "1. Запустите: .\deploy-fly.ps1 -Action setup"
    Write-Host "2. Установите секреты: fly secrets set SECRET_KEY=`"...`""
    Write-Host "3. Запустите деплой: .\deploy-fly.ps1 -Action deploy"
    Write-Host ""
    Write-Host "Или следуйте инструкции: FLY-QUICKSTART.md" -ForegroundColor Gray
} else {
    Write-Host "❌ Некоторые проверки не прошли. Исправьте ошибки выше." -ForegroundColor Red
}
