@echo off
setlocal
cd /d "%~dp0"

echo ====================================================
echo        FXEngin - Starting All 3 Projects
echo ====================================================
echo.

echo [1/3] Starting Backend API on http://localhost:5001 ...
start "FXEngin - Backend (Port 5001)" /D "%~dp0backend" cmd /k "npm run start:dev"

echo [2/3] Starting Frontend on http://localhost:3000 ...
start "FXEngin - Frontend (Port 3000)" /D "%~dp0frontend" cmd /k "npm run dev"

echo [3/3] Starting Admin Dashboard on http://localhost:3001 ...
start "FXEngin - Admin (Port 3001)" /D "%~dp0admin" cmd /k "npm run dev"

echo.
echo ====================================================
echo                 Available Local URLs:
echo ====================================================
echo  - Frontend:         http://localhost:3000
echo  - Admin Dashboard:  http://localhost:3001
echo  - Backend API:      http://localhost:5001
echo  - API Swagger Docs: http://localhost:5001/docs
echo ====================================================
echo.
echo Each service has been launched in a separate window.
echo To stop all services, run: stop-all.bat
echo.
pause
