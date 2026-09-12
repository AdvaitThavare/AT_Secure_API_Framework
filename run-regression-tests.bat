@echo off
setlocal

cd /d "%~dp0"

echo ==========================================
echo   Starting AT Secure API Framework Server
echo ==========================================

start "AT Secure API Server" cmd /k "node dist/server.js"

timeout /t 2 /nobreak >nul

echo.
echo ==========================================
echo   Running Regression Test Suite
echo ==========================================
echo.

call npx playwright test Tests

echo.
echo ==========================================
echo   Regression Test Execution Completed
echo ==========================================
echo.

pause