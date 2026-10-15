@echo off
setlocal
cd /d "%~dp0"

echo ====================================================
echo        FXEngin - Installing All Dependencies
echo ====================================================
echo.

echo [1/3] Installing Backend Dependencies...
cd /d "%~dp0backend"
call npm install
call npx prisma generate
if %errorlevel% neq 0 (
    echo [ERROR] Backend install failed.
)

echo.
echo [2/3] Installing Frontend Dependencies...
cd /d "%~dp0frontend"
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Frontend install failed.
)

echo.
echo [3/3] Installing Admin Dashboard Dependencies...
cd /d "%~dp0admin"
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Admin install failed.
)

cd /d "%~dp0"
echo.
echo ====================================================
echo        Installation Completed Successfully!
echo ====================================================
pause
