@echo off
setlocal
echo ==========================================
echo    University Dashboard Startup Tool
echo ==========================================
echo.

echo [1/3] Cleaning up existing ports (5000, 5173)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul
timeout /t 1 /nobreak >nul

echo [2/3] Starting Backend Server...
start "UniFlow-Backend" cmd /c "node server/server.js"
timeout /t 3 /nobreak >nul

echo [3/3] Starting Frontend Dashboard...
start "UniFlow-Frontend" cmd /c "npm run dev"
echo.
echo ==========================================
echo ✅ System is starting!
echo.
echo 1. Check the Backend window for "Connected to MongoDB"
echo 2. Open http://localhost:5173 in your browser
echo ==========================================
echo.
pause
