@echo off
cd /d "%~dp0"
chcp 65001 >nul

echo 📦 Установка всех зависимостей...
echo.

echo 🐍 Установка Python зависимостей (backend)...
cd backend
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
    echo    Используется venv
)
pip install -r requirements.txt
cd ..

echo 🌐 Установка Node.js зависимостей...
cd frontend
npm install
cd ..

echo ✅ Все зависимости установлены!
echo.
echo Теперь вы можете запустить:
echo   start-backend.bat  - для backend сервера
echo   start-frontend.bat - для frontend приложения
echo.

pause