@echo off
echo ========================================
echo   ReUnite - Frontend Setup and Launch
echo ========================================
echo.

:: Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Please install Node.js LTS from nodejs.org
    pause
    exit /b 1
)

:: Check if .env exists
if not exist ".env" (
    echo Creating .env from template...
    copy .env.example .env
)

:: Install node modules if not already installed
if not exist "node_modules" (
    echo [1/2] Installing frontend packages (first time only)...
    npm install
) else (
    echo [1/2] Packages already installed, skipping...
)

:: Start frontend
echo.
echo ========================================
echo   Starting frontend on http://localhost:3000
echo   Make sure backend is running first!
echo   Press Ctrl+C to stop
echo ========================================
echo.
npm run dev

pause
