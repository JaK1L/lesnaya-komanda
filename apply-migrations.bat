@echo off
echo ========================================
echo MIGRATION TOOL - Lesnaya Komanda
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python from https://www.python.org/
    pause
    exit /b 1
)

REM Check if requests module is installed
python -c "import requests" >nul 2>&1
if errorlevel 1 (
    echo Installing requests module...
    pip install requests
    if errorlevel 1 (
        echo ERROR: Failed to install requests module
        pause
        exit /b 1
    )
)

REM Run the migration script
python apply-migrations.py

echo.
echo ========================================
echo Done!
echo ========================================
pause
