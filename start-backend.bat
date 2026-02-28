@echo off
REM Всегда переходим в папку, где лежит этот .bat (корень проекта)
cd /d "%~dp0"
chcp 65001 >nul

echo 🌲 Запуск Backend сервера Лесной Команды...
echo.

REM Переход в папку backend
cd backend
if not exist "app\main.py" (
    echo ❌ Папка backend или app\main.py не найдены. Запускайте батник из корня проекта.
    pause
    exit /b 1
)

REM Активируем venv, если есть — иначе используем системный Python
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
    echo ✅ Используется venv
) else (
    python --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ Python не найден. Установите Python 3.11+ или создайте venv в backend.
        pause
        exit /b 1
    )
    echo ✅ Используется системный Python
)

pip --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ pip не найден.
    pause
    exit /b 1
)

REM Установка зависимостей (если нужно)
echo 📦 Установка зависимостей...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo.
    echo ❌ Ошибка установки зависимостей. Исправьте ошибку выше и запустите снова.
    pause
    exit /b 1
)

REM Проверка наличия .env файла
if not exist .env (
    echo ⚠️  Файл .env не найден. Создайте его на основе .env.example
    echo Пример содержимого:
    echo DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lesnaya
    echo SECRET_KEY=your-secret-key-here
    echo ALLOWED_ORIGINS=http://localhost:3000
    pause
    exit /b 1
)

echo ✅ Конфигурация найдена

REM Запуск сервера — обязательно через Python из venv, иначе воркер подхватит системный Python
echo 🚀 Запуск FastAPI сервера на http://localhost:8000
echo Нажмите Ctrl+C для остановки
echo.
echo Если появится ошибка подключения к БД — проверьте:
echo   - PostgreSQL запущен, база lesnaya создана
echo   - В backend\.env верные DATABASE_URL и SECRET_KEY
echo.
if exist "venv\Scripts\python.exe" (
    venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
) else (
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
)
if %errorlevel% neq 0 (
    echo.
    echo ❌ Сервер завершился с ошибкой. Проверьте вывод выше.
)
pause