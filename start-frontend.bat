@echo off
REM Всегда переходим в папку, где лежит этот .bat (корень проекта)
cd /d "%~dp0"
chcp 65001 >nul
setlocal EnableExtensions

echo 🌐 Запуск Frontend приложения Лесной Команды...
echo.

REM Переход в папку frontend
cd frontend
if not exist "package.json" (
    echo ❌ Папка frontend или package.json не найдены. Запускайте батник из корня проекта.
    pause
    exit /b 1
)

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js не найден. Установите Node.js 18 или выше.
    pause
    exit /b 1
)
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm не найден.
    pause
    exit /b 1
)
echo ✅ Node.js и npm найдены

REM Установка зависимостей (если нужно)
if not exist node_modules (
    echo 📦 Установка зависимостей...
    npm install
    if %errorlevel% neq 0 (
        echo.
        echo ❌ npm install завершился с ошибкой. Проверьте вывод выше.
        pause
        exit /b 1
    )
)

REM Проверка наличия .env.local файла
if not exist .env.local (
    echo ⚠️  Файл .env.local не найден. Создайте его.
    echo Пример содержимого:
    echo NEXT_PUBLIC_API_URL=http://localhost:8000
    echo.
)

echo ✅ Зависимости установлены

REM Запуск development сервера
echo 🚀 Запуск Next.js на http://localhost:3000
echo Сначала запустите start-backend.bat в другом окне.
echo Нажмите Ctrl+C для остановки
echo.
REM Открываем отдельное окно cmd, которое не закроется само
cmd /k "npm run dev"