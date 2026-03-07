# 🚀 Скрипт автоматического деплоя "Лесная Команда" (PowerShell)
# Версия: 1.0.0
# Дата: 07.03.2026

$ErrorActionPreference = "Stop"

# Функции для цветного вывода
function Print-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Print-Success {
    param([string]$Message)
    Write-Host "[✓] $Message" -ForegroundColor Green
}

function Print-Error {
    param([string]$Message)
    Write-Host "[✗] $Message" -ForegroundColor Red
}

function Print-Warning {
    param([string]$Message)
    Write-Host "[!] $Message" -ForegroundColor Yellow
}

# Заголовок
Write-Host ""
Write-Host "╔════════════════════════════════════════╗"
Write-Host "║   🌲 Лесная Команда - Деплой          ║"
Write-Host "╚════════════════════════════════════════╝"
Write-Host ""

# Проверка что мы в корне проекта
if (-not (Test-Path "backend") -and -not (Test-Path "frontend")) {
    Print-Error "Запустите скрипт из корня проекта!"
    exit 1
}

# Проверка Git статуса
Print-Status "Проверка Git статуса..."
$gitStatus = git status --porcelain
if ($gitStatus) {
    Print-Warning "У вас есть незакоммиченные изменения!"
    $response = Read-Host "Продолжить? (y/n)"
    if ($response -ne "y") {
        exit 1
    }
}

# Проверка текущей ветки
$currentBranch = git branch --show-current
Print-Status "Текущая ветка: $currentBranch"

if ($currentBranch -ne "main") {
    Print-Warning "Вы не на ветке main!"
    $response = Read-Host "Продолжить деплой с ветки $currentBranch? (y/n)"
    if ($response -ne "y") {
        exit 1
    }
}

# Пуш в GitHub
Print-Status "Пушим изменения в GitHub..."
git push origin $currentBranch
Print-Success "Код запушен в GitHub"

# Проверка что сервисы доступны
Print-Status "Проверка доступности сервисов..."

# Backend (Render)
$backendUrl = "https://lesnayakomanda.onrender.com"
Print-Status "Проверка Backend ($backendUrl)..."
try {
    $response = Invoke-WebRequest -Uri "$backendUrl/api/" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Print-Success "Backend доступен"
    }
} catch {
    Print-Error "Backend недоступен! Проверьте Render Dashboard"
    Print-Warning "Возможно сервис спит (cold start). Подождите 30 секунд..."
}

# Frontend (Vercel)
$frontendUrl = "https://lesnaya-komanda.vercel.app"
Print-Status "Проверка Frontend ($frontendUrl)..."
try {
    $response = Invoke-WebRequest -Uri $frontendUrl -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Print-Success "Frontend доступен"
    }
} catch {
    Print-Error "Frontend недоступен! Проверьте Vercel Dashboard"
}

Write-Host ""
Print-Status "Деплой запущен! Сервисы автоматически обновятся через 2-3 минуты"
Write-Host ""

# Ссылки на дашборды
Write-Host "📊 Дашборды для мониторинга:"
Write-Host "   • Render:  https://dashboard.render.com/"
Write-Host "   • Vercel:  https://vercel.com/dashboard"
Write-Host "   • Railway: https://railway.app/dashboard"
Write-Host "   • Neon:    https://console.neon.tech/"
Write-Host ""

# Ожидание деплоя
Print-Status "Ожидание завершения деплоя (2 минуты)..."
Start-Sleep -Seconds 120

# Проверка после деплоя
Write-Host ""
Print-Status "Проверка после деплоя..."

# Backend health check
Print-Status "Backend health check..."
try {
    $response = Invoke-RestMethod -Uri "$backendUrl/api/" -Method Get
    if ($response.status -eq "ok") {
        Print-Success "Backend работает корректно"
    } else {
        Print-Error "Backend вернул неожиданный ответ"
    }
} catch {
    Print-Error "Backend health check failed: $_"
}

# Frontend check
Print-Status "Frontend check..."
try {
    $response = Invoke-WebRequest -Uri $frontendUrl -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Print-Success "Frontend работает корректно (HTTP $($response.StatusCode))"
    }
} catch {
    Print-Error "Frontend check failed: $_"
}

# CORS check
Print-Status "CORS check..."
try {
    $headers = @{
        "Origin" = $frontendUrl
        "Access-Control-Request-Method" = "POST"
    }
    $response = Invoke-WebRequest -Uri "$backendUrl/api/token" -Method Options -Headers $headers -UseBasicParsing
    $corsHeader = $response.Headers["Access-Control-Allow-Origin"]
    if ($corsHeader -eq $frontendUrl) {
        Print-Success "CORS настроен правильно"
    } else {
        Print-Error "CORS не настроен! Проверьте ALLOWED_ORIGINS на Render"
    }
} catch {
    Print-Warning "CORS check не удался (это может быть нормально)"
}

# Итоговый отчет
Write-Host ""
Write-Host "╔════════════════════════════════════════╗"
Write-Host "║   📋 Итоговый отчет                    ║"
Write-Host "╚════════════════════════════════════════╝"
Write-Host ""
Write-Host "🌐 URLs:"
Write-Host "   Frontend: $frontendUrl"
Write-Host "   Backend:  $backendUrl"
Write-Host "   API Docs: $backendUrl/api/docs"
Write-Host ""
Write-Host "✅ Следующие шаги:"
Write-Host "   1. Проверьте сайт: $frontendUrl"
Write-Host "   2. Проверьте админку: $frontendUrl/admin"
Write-Host "   3. Проверьте логи в Render/Vercel"
Write-Host ""

Print-Success "Деплой завершен!"
