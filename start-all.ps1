# FXEngin - Start All Projects Script (PowerShell)
$rootDir = $PSScriptRoot
if (-not $rootDir) { $rootDir = Get-Location }

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "        FXEngin - Starting All 3 Projects           " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] Starting Backend API (Port 5001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootDir\backend'; Write-Host '--- FXEngin Backend (Port 5001) ---' -ForegroundColor Green; npm run start:dev"

Start-Sleep -Seconds 2

Write-Host "[2/3] Starting Frontend (Port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootDir\frontend'; Write-Host '--- FXEngin Frontend (Port 3000) ---' -ForegroundColor Green; npm run dev"

Start-Sleep -Seconds 2

Write-Host "[3/3] Starting Admin Dashboard (Port 3001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootDir\admin'; Write-Host '--- FXEngin Admin Dashboard (Port 3001) ---' -ForegroundColor Green; npm run dev"

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "                 Available Local URLs:              " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host " - Frontend:         http://localhost:3000" -ForegroundColor Green
Write-Host " - Admin Dashboard:  http://localhost:3001" -ForegroundColor Green
Write-Host " - Backend API:      http://localhost:5001" -ForegroundColor Green
Write-Host " - API Swagger Docs: http://localhost:5001/docs" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop all services at any time, run: .\stop-all.bat" -ForegroundColor Gray
