# PowerShell скрипт для деплоя бэкенда на Fly.io
# Использование: .\deploy-fly.ps1 -Action [setup|deploy|logs|status]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('setup', 'deploy', 'logs', 'status')]
    [string]$Action
)

$APP_NAME = "lesnaya-komanda-backend"
$DB_NAME = "lesnaya-komanda-db"
$REGION = "ams" # Amsterdam

# Функции для вывода сообщений
function Log-Info {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Log-Warn {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Log-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

# Проверка установки Fly CLI
function Check-FlyCLI {
    if (-not (Get-Command fly -ErrorAction SilentlyContinue)) {
        Log-Error "Fly CLI не установлен"
        Write-Host "Установите его: powershell -Command `"iwr https://fly.io/install.ps1 -useb | iex`""
        exit 1
    }
    Log-Info "Fly CLI установлен"
}

# Проверка авторизации
function Check-Auth {
    $authCheck = fly auth whoami 2>&1
    if ($LASTEXITCODE -ne 0) {
        Log-Error "Вы не авторизованы в Fly.io"
        Write-Host "Выполните: fly auth login"
        exit 1
    }
    Log-Info "Авторизация в Fly.io: OK"
}

# Первоначальная настройка
function Setup {
    Log-Info "Начинаем первоначальную настройку..."
    
    # Создание Postgres базы
    Log-Info "Создание PostgreSQL базы данных..."
    fly postgres create --name $DB_NAME --region $REGION
    if ($LASTEXITCODE -eq 0) {
        Log-Info "База данных создана: $DB_NAME"
    } else {
        Log-Warn "База данных уже существует или произошла ошибка"
    }
    
    # Создание приложения
    Log-Info "Создание приложения..."
    fly launch --name $APP_NAME --region $REGION --no-deploy
    if ($LASTEXITCODE -eq 0) {
        Log-Info "Приложение создано: $APP_NAME"
    } else {
        Log-Warn "Приложение уже существует или произошла ошибка"
    }
    
    # Подключение базы к приложению
    Log-Info "Подключение базы данных к приложению..."
    fly postgres attach $DB_NAME --app $APP_NAME
    if ($LASTEXITCODE -eq 0) {
        Log-Info "База данных подключена"
    } else {
        Log-Warn "База данных уже подключена или произошла ошибка"
    }
    
    Log-Info "Настройка завершена!"
    Write-Host ""
    Log-Warn "Теперь установите секреты:"
    Write-Host "fly secrets set SECRET_KEY=`"ваш-секретный-ключ`""
    Write-Host "fly secrets set ADMIN_USERNAME=`"admin`""
    Write-Host "fly secrets set ADMIN_PASSWORD=`"ваш-пароль`""
    Write-Host "fly secrets set DISCORD_CLIENT_ID=`"...`""
    Write-Host "fly secrets set DISCORD_CLIENT_SECRET=`"...`""
    Write-Host "fly secrets set FRONTEND_URL=`"https://ваш-фронтенд.vercel.app`""
    Write-Host "fly secrets set BACKEND_URL=`"https://$APP_NAME.fly.dev`""
    Write-Host "fly secrets set ALLOWED_ORIGINS=`"https://ваш-фронтенд.vercel.app`""
    Write-Host ""
    Write-Host "После установки секретов запустите: .\deploy-fly.ps1 -Action deploy"
}

# Деплой приложения
function Deploy {
    Log-Info "Начинаем деплой..."
    
    # Проверка наличия fly.toml
    if (-not (Test-Path "fly.toml")) {
        Log-Error "Файл fly.toml не найден"
        exit 1
    }
    
    # Деплой
    Log-Info "Деплой приложения на Fly.io..."
    fly deploy
    
    if ($LASTEXITCODE -eq 0) {
        Log-Info "Деплой завершен!"
        Write-Host ""
        Log-Info "Проверьте работу:"
        Write-Host "Health check: https://$APP_NAME.fly.dev/health"
        Write-Host "Database check: https://$APP_NAME.fly.dev/health/db"
        Write-Host "API docs: https://$APP_NAME.fly.dev/api/docs"
    } else {
        Log-Error "Деплой завершился с ошибкой"
        exit 1
    }
}

# Просмотр логов
function Show-Logs {
    Log-Info "Просмотр логов..."
    fly logs
}

# Статус приложения
function Show-Status {
    Log-Info "Статус приложения:"
    fly status
    Write-Host ""
    Log-Info "Список машин:"
    fly machine list
    Write-Host ""
    Log-Info "Health checks:"
    fly checks list
}

# Главная логика
Check-FlyCLI
Check-Auth

switch ($Action) {
    'setup' {
        Setup
    }
    'deploy' {
        Deploy
    }
    'logs' {
        Show-Logs
    }
    'status' {
        Show-Status
    }
}
