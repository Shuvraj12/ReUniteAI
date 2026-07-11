@echo off
echo ========================================
echo   ReUnite - Backend Setup and Launch
echo ========================================
echo.

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.11+ from python.org
    pause
    exit /b 1
)

:: Check if venv exists, create if not
if not exist "venv" (
    echo [1/4] Creating virtual environment...
    python -m venv venv
) else (
    echo [1/4] Virtual environment already exists, skipping...
)

:: Activate venv
echo [2/4] Activating virtual environment...
call venv\Scripts\activate

:: Install dependencies
echo [3/4] Installing Python packages (this may take 5-10 mins first time)...
pip install -r requirements.txt

:: Check if .env exists
if not exist ".env" (
    echo [4/4] Creating .env from template...
    copy .env.example .env
    echo.
    echo !! IMPORTANT: Open .env in Notepad and fill in your PostgreSQL password !!
    echo    DATABASE_URL=postgresql+asyncpg://trace_user:YOUR_PASSWORD@localhost:5432/trace_db
    echo.
    notepad .env
    pause
)

:: Setup database
echo Setting up database...
psql -U postgres -c "CREATE USER trace_user WITH PASSWORD 'trace_pass';" 2>nul
psql -U postgres -c "CREATE DATABASE trace_db OWNER trace_user;" 2>nul
echo Database ready!

:: Start backend
echo.
echo ========================================
echo   Starting backend on http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo   Press Ctrl+C to stop
echo ========================================
echo.
uvicorn main:app --reload --host 0.0.0.0 --port 8000

pause
