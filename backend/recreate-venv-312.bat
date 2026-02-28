@echo off
cd /d "%~dp0"
chcp 65001 >nul
echo Пересоздание venv с Python 3.12 (для совместимости с pydantic)...
echo.

py -3.12 --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python 3.12 не найден. Установи его с https://www.python.org/downloads/
    echo Либо запусти: py -3.11 -m venv venv
    pause
    exit /b 1
)

if exist venv (
    echo Удаляю старый venv...
    rmdir /s /q venv
)

echo Создаю venv с Python 3.12...
py -3.12 -m venv venv
call venv\Scripts\activate.bat
echo Устанавливаю зависимости...
python -m pip install --upgrade pip
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo.
    echo ❌ Ошибка установки зависимостей. Проверь вывод выше.
    pause
    exit /b 1
)
echo.
echo Готово. Запускай start-backend.bat из корня проекта.
pause
