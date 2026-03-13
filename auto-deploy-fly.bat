@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: Автоматический деплой на Fly.io
:: Использование: auto-deploy-fly.bat

color 0A
title Автоматический деплой на Fly.io

echo.
echo ═══════════════════════════════════════════════════════════════
echo    🚀 Автоматический деплой бэкенда на Fly.io
echo ═══════════════════════════════════════════════════════════════
echo.

:: Проверка Fly CLI
echo [1/8] Проверка Fly CLI...
where fly >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Fly CLI не установлен
    echo.
    echo Устанавливаю Fly CLI...
    powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
    if %errorlevel% neq 0 (
        echo ❌ Ошибка установки Fly CLI
        pause
        exit /b 1
    )
    echo ✅ Fly CLI установлен
    echo.
    echo ⚠️  Перезапустите этот скрипт после установки!
    pause
    exit /b 0
) else (
    echo ✅ Fly CLI установлен
)

:: Проверка авторизации
echo.
echo [2/8] Проверка авторизации...
fly auth whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Вы не авторизованы в Fly.io
    echo.
    echo Открываю браузер для авторизации...
    fly auth login
    if %errorlevel% neq 0 (
        echo ❌ Ошибка авторизации
        pause
        exit /b 1
    )
    echo ✅ Авторизация успешна
) else (
    echo ✅ Авторизация OK
)

:: Проверка файлов
echo.
echo [3/8] Проверка необходимых файлов...
if not exist "fly.toml" (
    echo ❌ Файл fly.toml не найден
    pause
    exit /b 1
)
if not exist "Dockerfile.backend" (
    echo ❌ Файл Dockerfile.backend не найден
    pause
    exit /b 1
)
if not exist "backend\app" (
    echo ❌ Директория backend\app не найдена
    pause
    exit /b 1
)
echo ✅ Все файлы на месте

:: Выбор действия
echo.
echo ═══════════════════════════════════════════════════════════════
echo    Выберите действие:
echo ═══════════════════════════════════════════════════════════════
echo.
echo    1. Полная настройка (первый раз)
echo    2. Только деплой (уже настроено)
echo    3. Настроить секреты
echo    4. Просмотр логов
echo    5. Статус приложения
echo    6. Выход
echo.
set /p choice="Ваш выбор (1-6): "

if "%choice%"=="1" goto full_setup
if "%choice%"=="2" goto deploy_only
if "%choice%"=="3" goto setup_secrets
if "%choice%"=="4" goto show_logs
if "%choice%"=="5" goto show_status
if "%choice%"=="6" goto end

echo ❌ Неверный выбор
pause
exit /b 1

:full_setup
echo.
echo ═══════════════════════════════════════════════════════════════
echo    🔧 Полная настройка
echo ═══════════════════════════════════════════════════════════════
echo.

:: Создание базы данных
echo [4/8] Создание PostgreSQL базы данных...
echo.
set /p create_db="Создать новую базу данных? (y/n): "
if /i "%create_db%"=="y" (
    echo Создаю базу данных lesnaya-komanda-db...
    fly postgres create --name lesnaya-komanda-db --region ams
    if %errorlevel% neq 0 (
        echo ⚠️  База данных уже существует или произошла ошибка
    ) else (
        echo ✅ База данных создана
    )
)

:: Создание приложения
echo.
echo [5/8] Создание приложения...
echo.
fly launch --name lesnaya-komanda-backend --region ams --no-deploy
if %errorlevel% neq 0 (
    echo ⚠️  Приложение уже существует или произошла ошибка
) else (
    echo ✅ Приложение создано
)

:: Подключение базы
echo.
echo [6/8] Подключение базы данных...
echo.
set /p attach_db="Подключить базу данных к приложению? (y/n): "
if /i "%attach_db%"=="y" (
    fly postgres attach lesnaya-komanda-db --app lesnaya-komanda-backend
    if %errorlevel% neq 0 (
        echo ⚠️  База уже подключена или произошла ошибка
    ) else (
        echo ✅ База данных подключена
    )
)

goto setup_secrets

:setup_secrets
echo.
echo ═══════════════════════════════════════════════════════════════
echo    🔐 Настройка секретов
echo ═══════════════════════════════════════════════════════════════
echo.

:: Генерация SECRET_KEY
echo Генерирую SECRET_KEY...
python generate-secret-key.py > temp_secret.txt 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  Не удалось сгенерировать SECRET_KEY через Python
    echo Используйте: fly secrets set SECRET_KEY="ваш-ключ"
    set SECRET_KEY=
) else (
    for /f "tokens=2 delims==" %%a in ('findstr "SECRET_KEY=" temp_secret.txt') do set SECRET_KEY=%%a
    del temp_secret.txt >nul 2>&1
)

echo.
echo Введите данные для секретов (или нажмите Enter для пропуска):
echo.

:: ADMIN_USERNAME
set /p ADMIN_USERNAME="ADMIN_USERNAME [admin]: "
if "%ADMIN_USERNAME%"=="" set ADMIN_USERNAME=admin

:: ADMIN_PASSWORD
set /p ADMIN_PASSWORD="ADMIN_PASSWORD: "
if "%ADMIN_PASSWORD%"=="" (
    echo ⚠️  Пароль не может быть пустым!
    set /p ADMIN_PASSWORD="ADMIN_PASSWORD (обязательно): "
)

:: DISCORD_CLIENT_ID
set /p DISCORD_CLIENT_ID="DISCORD_CLIENT_ID: "

:: DISCORD_CLIENT_SECRET
set /p DISCORD_CLIENT_SECRET="DISCORD_CLIENT_SECRET: "

:: FRONTEND_URL
set /p FRONTEND_URL="FRONTEND_URL [https://lesnaya-komanda.vercel.app]: "
if "%FRONTEND_URL%"=="" set FRONTEND_URL=https://lesnaya-komanda.vercel.app

:: BACKEND_URL
set BACKEND_URL=https://lesnaya-komanda-backend.fly.dev

:: ALLOWED_ORIGINS
set /p ALLOWED_ORIGINS="ALLOWED_ORIGINS [%FRONTEND_URL%]: "
if "%ALLOWED_ORIGINS%"=="" set ALLOWED_ORIGINS=%FRONTEND_URL%

echo.
echo Устанавливаю секреты...
echo.

:: Установка секретов
if not "%SECRET_KEY%"=="" (
    echo - SECRET_KEY
    fly secrets set SECRET_KEY="%SECRET_KEY%" >nul 2>&1
)

if not "%ADMIN_USERNAME%"=="" (
    echo - ADMIN_USERNAME
    fly secrets set ADMIN_USERNAME="%ADMIN_USERNAME%" >nul 2>&1
)

if not "%ADMIN_PASSWORD%"=="" (
    echo - ADMIN_PASSWORD
    fly secrets set ADMIN_PASSWORD="%ADMIN_PASSWORD%" >nul 2>&1
)

if not "%DISCORD_CLIENT_ID%"=="" (
    echo - DISCORD_CLIENT_ID
    fly secrets set DISCORD_CLIENT_ID="%DISCORD_CLIENT_ID%" >nul 2>&1
)

if not "%DISCORD_CLIENT_SECRET%"=="" (
    echo - DISCORD_CLIENT_SECRET
    fly secrets set DISCORD_CLIENT_SECRET="%DISCORD_CLIENT_SECRET%" >nul 2>&1
)

if not "%FRONTEND_URL%"=="" (
    echo - FRONTEND_URL
    fly secrets set FRONTEND_URL="%FRONTEND_URL%" >nul 2>&1
)

if not "%BACKEND_URL%"=="" (
    echo - BACKEND_URL
    fly secrets set BACKEND_URL="%BACKEND_URL%" >nul 2>&1
)

if not "%ALLOWED_ORIGINS%"=="" (
    echo - ALLOWED_ORIGINS
    fly secrets set ALLOWED_ORIGINS="%ALLOWED_ORIGINS%" >nul 2>&1
)

echo.
echo ✅ Секреты установлены
echo.

:: Опциональные секреты
set /p setup_optional="Настроить опциональные секреты (Discord Bot, Twitch, etc.)? (y/n): "
if /i "%setup_optional%"=="y" (
    echo.
    echo Опциональные секреты:
    echo.
    
    set /p DISCORD_BOT_TOKEN="DISCORD_BOT_TOKEN (Enter для пропуска): "
    if not "%DISCORD_BOT_TOKEN%"=="" (
        fly secrets set DISCORD_BOT_TOKEN="%DISCORD_BOT_TOKEN%" >nul 2>&1
        echo ✅ DISCORD_BOT_TOKEN установлен
    )
    
    set /p DISCORD_GUILD_ID="DISCORD_GUILD_ID (Enter для пропуска): "
    if not "%DISCORD_GUILD_ID%"=="" (
        fly secrets set DISCORD_GUILD_ID="%DISCORD_GUILD_ID%" >nul 2>&1
        echo ✅ DISCORD_GUILD_ID установлен
    )
    
    set /p TWITCH_CLIENT_ID="TWITCH_CLIENT_ID (Enter для пропуска): "
    if not "%TWITCH_CLIENT_ID%"=="" (
        fly secrets set TWITCH_CLIENT_ID="%TWITCH_CLIENT_ID%" >nul 2>&1
        echo ✅ TWITCH_CLIENT_ID установлен
    )
    
    set /p TWITCH_CLIENT_SECRET="TWITCH_CLIENT_SECRET (Enter для пропуска): "
    if not "%TWITCH_CLIENT_SECRET%"=="" (
        fly secrets set TWITCH_CLIENT_SECRET="%TWITCH_CLIENT_SECRET%" >nul 2>&1
        echo ✅ TWITCH_CLIENT_SECRET установлен
    )
)

if "%choice%"=="3" goto end

:deploy_only
echo.
echo ═══════════════════════════════════════════════════════════════
echo    🚀 Деплой приложения
echo ═══════════════════════════════════════════════════════════════
echo.

echo [7/8] Деплой на Fly.io...
echo.
echo Это может занять несколько минут...
echo.

fly deploy

if %errorlevel% neq 0 (
    echo.
    echo ❌ Ошибка деплоя
    echo.
    echo Проверьте логи: fly logs
    pause
    exit /b 1
)

echo.
echo ✅ Деплой завершен!
echo.

:: Проверка работы
echo [8/8] Проверка работы...
echo.
timeout /t 5 /nobreak >nul

echo Проверяю health endpoints...
curl -s https://lesnaya-komanda-backend.fly.dev/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Health check: OK
) else (
    echo ⚠️  Health check: Не отвечает (подождите минуту)
)

curl -s https://lesnaya-komanda-backend.fly.dev/health/db >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Database check: OK
) else (
    echo ⚠️  Database check: Не отвечает (подождите минуту)
)

echo.
echo ═══════════════════════════════════════════════════════════════
echo    ✅ Готово!
echo ═══════════════════════════════════════════════════════════════
echo.
echo Ваш бэкенд доступен по адресу:
echo 🌐 https://lesnaya-komanda-backend.fly.dev
echo.
echo Проверьте:
echo - Health: https://lesnaya-komanda-backend.fly.dev/health
echo - Database: https://lesnaya-komanda-backend.fly.dev/health/db
echo - API Docs: https://lesnaya-komanda-backend.fly.dev/api/docs
echo.
echo Не забудьте обновить NEXT_PUBLIC_API_URL на Vercel!
echo Инструкция: docs\UPDATE-FRONTEND-FOR-FLY.md
echo.

set /p open_docs="Открыть API документацию в браузере? (y/n): "
if /i "%open_docs%"=="y" (
    start https://lesnaya-komanda-backend.fly.dev/api/docs
)

goto end

:show_logs
echo.
echo ═══════════════════════════════════════════════════════════════
echo    📋 Логи приложения
echo ═══════════════════════════════════════════════════════════════
echo.
fly logs
goto end

:show_status
echo.
echo ═══════════════════════════════════════════════════════════════
echo    📊 Статус приложения
echo ═══════════════════════════════════════════════════════════════
echo.
fly status
echo.
echo Машины:
fly machine list
echo.
echo Health checks:
fly checks list
goto end

:end
echo.
pause
