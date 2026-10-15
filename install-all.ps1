# FXEngin - Install All Dependencies Script (PowerShell)
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "       FXEngin - تثبيت مكتبات جميع المشاريع         " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

$rootDir = $PSScriptRoot

# 1. Backend
Write-Host "[1/3] جاري تثبيت مكتبات الباك إند (Backend)..." -ForegroundColor Yellow
Set-Location "$rootDir\backend"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] فشل تثبيت مكتبات backend!" -ForegroundColor Red
    exit $LASTEXITCODE
}
Write-Host "[*] توليد عميل Prisma (Prisma Client)..." -ForegroundColor Yellow
npx prisma generate

# 2. Frontend
Write-Host "`n[2/3] جاري تثبيت مكتبات الفرونت إند (Frontend)..." -ForegroundColor Yellow
Set-Location "$rootDir\frontend"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] فشل تثبيت مكتبات frontend!" -ForegroundColor Red
    exit $LASTEXITCODE
}

# 3. Admin Dashboard
Write-Host "`n[3/3] جاري تثبيت مكتبات لوحة التحكم (Admin Dashboard)..." -ForegroundColor Yellow
Set-Location "$rootDir\admin"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] فشل تثبيت مكتبات admin!" -ForegroundColor Red
    exit $LASTEXITCODE
}

Set-Location $rootDir
Write-Host "`n====================================================" -ForegroundColor Green
Write-Host "     تم تثبيت جميع المكتبات بنجاح للمشاريع الثلاثة!   " -ForegroundColor Green
Write-Host "    يمكنك الآن تشغيل المشاريع عبر: .\start-all.ps1    " -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
