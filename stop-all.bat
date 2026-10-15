@echo off
setlocal

echo ====================================================
echo        FXEngin - Stopping All Running Services
echo ====================================================
echo.

for %%P in (3000 3001 5001) do (
    echo Checking port %%P...
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%%P " ^| findstr "LISTENING"') do (
        echo Killing PID %%a on port %%P...
        taskkill /F /PID %%a >nul 2>&1
    )
)

echo.
echo All ports (3000, 3001, 5001) have been released.
echo.
pause
