@echo off
REM ---------------------------------------------------------------------------
REM StudyMentor AI - Windows launcher
REM Double-click this file, or run it from Command Prompt / PowerShell.
REM It installs dependencies and seeds sample data on first run, then starts
REM the API and the web app together. Press Ctrl+C to stop.
REM ---------------------------------------------------------------------------
setlocal
cd /d "%~dp0"
title StudyMentor AI

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js was not found.
  echo   Install the Node.js 22 LTS or 24 LTS installer from https://nodejs.org
  echo   then close this window and double-click run-windows.bat again.
  echo.
  pause
  exit /b 1
)

for /f "tokens=1 delims=." %%v in ('node -p "process.versions.node"') do set NODE_MAJOR=%%v
if %NODE_MAJOR% LSS 22 (
  echo.
  echo   Node.js 22.13 or newer is required. Found:
  node -v
  echo   Download it from https://nodejs.org
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing dependencies, this can take a minute...
  call npm install
  if errorlevel 1 (
    echo.
    echo   npm install failed. Check your internet connection and try again.
    pause
    exit /b 1
  )
)

if not exist "data\studaymentor.db" (
  echo Creating the local database and sample content...
  call npm run seed
  if errorlevel 1 (
    echo.
    echo   Seeding failed. See the message above.
    pause
    exit /b 1
  )
)

echo.
echo Starting StudyMentor AI...
echo Your browser will open at http://localhost:3000 once the servers are ready.
echo Demo login: demo@studaymentor.app / Demo@1234
echo.

REM Give the servers a moment, then open the browser.
start "" /b cmd /c "timeout /t 6 >nul & start http://localhost:3000"

call npm run dev:all

echo.
echo StudyMentor AI has stopped.
pause
