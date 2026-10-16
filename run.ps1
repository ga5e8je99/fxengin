# ==============================================================================
# FXENGIN - Site Launcher & Manager
# ==============================================================================
param (
    [string]$Action = ""
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "FXEngin - Site Launcher"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

$VPS_HOST = "root@186.240.145.87"
$VPS_DIR = "/root/fxengin-website"

function Write-Header {
    Clear-Host
    Write-Host ""
    Write-Host " ============================================================================== " -ForegroundColor Cyan
    Write-Host "                FXENGIN  |  منظومة إدارة وتشغيل الموقع بالكامل                  " -ForegroundColor Yellow
    Write-Host " ============================================================================== " -ForegroundColor Cyan
    Write-Host ""
}

function Start-VPSSite {
    Write-Header
    Write-Host " [*] جاري الاتصال بالسيرفر السحابي (VPS: 186.240.145.87)..." -ForegroundColor Cyan
    
    $checkSSH = ssh -o BatchMode=yes -o ConnectTimeout=8 $VPS_HOST "echo CONNECTED" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host " [!] تعذر الاتصال المباشر بالسيرفر." -ForegroundColor Red
        Write-Host " تفاصيل الخطأ: $checkSSH" -ForegroundColor DarkGray
        Write-Host ""
        Read-Host " اضغط Enter للمتابعة..."
        return
    }

    Write-Host " [✓] تم الاتصال بالسيرفر بنجاح!" -ForegroundColor Green
    Write-Host ""
    Write-Host " [*] جاري تشغيل كافة خدمات الموقع عبر Docker Compose على السيرفر..." -ForegroundColor Cyan
    
    $upOutput = ssh $VPS_HOST "docker compose -f /root/fxengin-website/docker-compose.yml up -d" 2>&1
    $upOutput | ForEach-Object { Write-Host $_ -ForegroundColor Gray }

    Write-Host ""
    Write-Host " [*] التحقق من حالة الحاويات النشطة على السيرفر:" -ForegroundColor Cyan
    $psOutput = ssh $VPS_HOST "docker compose -f /root/fxengin-website/docker-compose.yml ps" 2>&1
    $psOutput | ForEach-Object { Write-Host $_ -ForegroundColor Green }

    Write-Host ""
    Write-Host " ============================================================================== " -ForegroundColor Green
    Write-Host "               [✓] تم تشغيل المنظومة والموقع بنجاح على السيرفر!                 " -ForegroundColor Yellow
    Write-Host " ============================================================================== " -ForegroundColor Green
    Write-Host ""
    Write-Host "  • رابط الموقع الرئيسي:      https://fxengen.com" -ForegroundColor Cyan
    Write-Host "  • لوحة تحكم الإدارة:        https://fxengen.com/admin" -ForegroundColor Cyan
    Write-Host "  • واجهة برمجة الباك إند:    https://core.fxengen.com" -ForegroundColor Cyan
    Write-Host "  • خادم الوسائط والبث:       https://live.fxengen.com" -ForegroundColor Cyan
    Write-Host ""

    $openBrowser = Read-Host " هل تريد فتح روابط الموقع في المتصفح الآن؟ (Y/n)"
    if ($openBrowser -ne "n" -and $openBrowser -ne "N") {
        Start-Process "https://fxengen.com"
        Start-Process "https://fxengen.com/admin"
    }
}

function Start-LocalSite {
    Write-Header
    Write-Host " [*] فحص توفر Docker على جهازك المحلي..." -ForegroundColor Cyan
    
    $dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
    if (-not $dockerCmd) {
        Write-Host " [!] Docker غير مثبت أو غير موجود في مسار النظام (PATH)." -ForegroundColor Red
        Write-Host ""
        Write-Host " لتشغيل الموقع محلياً، يلزم تثبيت Docker Desktop:" -ForegroundColor Yellow
        Write-Host " 1. يمكنك تثبيته عبر تشغيل الأمر التالي في PowerShell:" -ForegroundColor White
        Write-Host "    winget install Docker.DockerDesktop" -ForegroundColor Green
        Write-Host " 2. أو تحميله مباشرة من الموقع الرسمي: https://www.docker.com/products/docker-desktop" -ForegroundColor White
        Write-Host ""
        Write-Host " ملاحظة: يمكنك دائماً تشغيل السايت على السيرفر (الخيار 1) مباشرة بنقرة واحدة." -ForegroundColor Cyan
        Write-Host ""
        Read-Host " اضغط Enter للمتابعة..."
        return
    }

    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host " [!] تطبيق Docker Desktop مثبت ولكنه غير مشغل حالياً." -ForegroundColor Red
        Write-Host " يرجى تشغيل برنامج Docker Desktop أولاً ثم إعادة المحاولة." -ForegroundColor Yellow
        Read-Host " اضغط Enter للمتابعة..."
        return
    }

    Write-Host " [✓] برنامج Docker جاهز ونشط." -ForegroundColor Green
    Write-Host " [*] جاري بناء وتشغيل الحاويات المحلية (Frontend, Admin, Backend, DB, Redis)..." -ForegroundColor Cyan
    
    docker compose -f "$ScriptDir\docker-compose.local.yml" up -d --build

    Write-Host ""
    Write-Host " [*] فحص حالة الحاويات المحلية:" -ForegroundColor Cyan
    docker compose -f "$ScriptDir\docker-compose.local.yml" ps

    Write-Host ""
    Write-Host " ============================================================================== " -ForegroundColor Green
    Write-Host "              [✓] تم تشغيل الموقع محلياً بنجاح (Local Environment)!             " -ForegroundColor Yellow
    Write-Host " ============================================================================== " -ForegroundColor Green
    Write-Host ""
    Write-Host "  • رابط الموقع المحلي (Frontend):   http://localhost:3000" -ForegroundColor Cyan
    Write-Host "  • لوحة الإدارة المحلية (Admin):     http://localhost:3005" -ForegroundColor Cyan
    Write-Host "  • الباك إند المحلي (Backend API):   http://localhost:3002" -ForegroundColor Cyan
    Write-Host ""

    $openBrowser = Read-Host " هل تريد فتح الموقع المحلي في المتصفح الآن؟ (Y/n)"
    if ($openBrowser -ne "n" -and $openBrowser -ne "N") {
        Start-Process "http://localhost:3000"
        Start-Process "http://localhost:3005"
    }
}

function Check-Status {
    Write-Header
    Write-Host " [*] فحص حالة السايت على السيرفر (VPS: 186.240.145.87)..." -ForegroundColor Cyan
    $statusVPS = ssh -o BatchMode=yes -o ConnectTimeout=6 $VPS_HOST "docker compose -f /root/fxengin-website/docker-compose.yml ps" 2>&1
    if ($LASTEXITCODE -eq 0) {
        $statusVPS | ForEach-Object { Write-Host $_ -ForegroundColor Green }
    } else {
        Write-Host " [!] تعذر الاستعلام من السيرفر." -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host " [*] فحص حالة الحاويات المحلية (Local Docker)..." -ForegroundColor Cyan
    $dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
    if ($dockerCmd) {
        $statusLocal = docker compose -f "$ScriptDir\docker-compose.local.yml" ps 2>&1
        $statusLocal | ForEach-Object { Write-Host $_ -ForegroundColor Gray }
    } else {
        Write-Host " Docker المحلي غير متوفر حالياً على هذا الجهاز." -ForegroundColor DarkGray
    }

    Write-Host ""
    Read-Host " اضغط Enter للمتابعة..."
}

function Restart-Site {
    Write-Header
    Write-Host " [1] إعادة تشغيل السيرفر (VPS Live)" -ForegroundColor Cyan
    Write-Host " [2] إعادة تشغيل البيئة المحلية (Local Docker)" -ForegroundColor Cyan
    Write-Host " [0] رجوع" -ForegroundColor DarkGray
    Write-Host ""
    $target = Read-Host " حدد وجهة إعادة التشغيل (1/2)"
    
    if ($target -eq "1") {
        Write-Host " [*] جاري إعادة تشغيل خدمات السيرفر..." -ForegroundColor Yellow
        $restartOutput = ssh $VPS_HOST "docker compose -f /root/fxengin-website/docker-compose.yml restart" 2>&1
        $restartOutput | ForEach-Object { Write-Host $_ -ForegroundColor Gray }
        Write-Host " [✓] تمت إعادة التشغيل بنجاح." -ForegroundColor Green
        Read-Host " اضغط Enter للمتابعة..."
    } elseif ($target -eq "2") {
        Write-Host " [*] جاري إعادة تشغيل البيئة المحلية..." -ForegroundColor Yellow
        docker compose -f "$ScriptDir\docker-compose.local.yml" restart
        Write-Host " [✓] تمت إعادة التشغيل بنجاح." -ForegroundColor Green
        Read-Host " اضغط Enter للمتابعة..."
    }
}

function View-Logs {
    Write-Header
    Write-Host " [*] اختر الخدمة التي تريد استعراض سجلاتها الحية:" -ForegroundColor Cyan
    Write-Host " [1] الباك إند (fxengin_backend)" -ForegroundColor White
    Write-Host " [2] الواجهة الأمامية (fxengin_frontend)" -ForegroundColor White
    Write-Host " [3] لوحة الإدارة (fxengin_admin)" -ForegroundColor White
    Write-Host " [4] خادم قاعدة البيانات (fxengin_postgres)" -ForegroundColor White
    Write-Host " [5] كافة الخدمات معاً" -ForegroundColor White
    Write-Host " [0] رجوع" -ForegroundColor DarkGray
    Write-Host ""
    $svc = Read-Host " اختيارك (1-5)"
    
    $container = ""
    if ($svc -eq "1") { $container = "fxengin_backend" }
    elseif ($svc -eq "2") { $container = "fxengin_frontend" }
    elseif ($svc -eq "3") { $container = "fxengin_admin" }
    elseif ($svc -eq "4") { $container = "fxengin_postgres" }
    elseif ($svc -eq "5") { $container = "" }
    else { return }

    Write-Host " [*] جاري جلب السجلات (اضغط Ctrl+C للخروج من السجلات)..." -ForegroundColor Yellow
    ssh -t $VPS_HOST "docker compose -f /root/fxengin-website/docker-compose.yml logs -f --tail=100 $container"
}

function Stop-Site {
    Write-Header
    Write-Host " [1] إيقاف السيرفر السحابي (VPS Live)" -ForegroundColor Cyan
    Write-Host " [2] إيقاف البيئة المحلية (Localhost)" -ForegroundColor Cyan
    Write-Host " [0] إلغاء" -ForegroundColor DarkGray
    Write-Host ""
    $target = Read-Host " اختر ما تريد إيقافه (1/2)"
    
    if ($target -eq "1") {
        $confirm = Read-Host " هل أنت متأكد من إيقاف موقع الإنتاج الحي على السيرفر؟ (yes/NO)"
        if ($confirm -eq "yes") {
            Write-Host " [*] جاري إيقاف حاويات السيرفر..." -ForegroundColor Yellow
            $stopOut = ssh $VPS_HOST "docker compose -f /root/fxengin-website/docker-compose.yml stop" 2>&1
            $stopOut | ForEach-Object { Write-Host $_ -ForegroundColor Gray }
            Write-Host " [✓] تم إيقاف الخدمات بنجاح." -ForegroundColor Green
        }
        Read-Host " اضغط Enter للمتابعة..."
    } elseif ($target -eq "2") {
        Write-Host " [*] جاري إيقاف الحاويات المحلية..." -ForegroundColor Yellow
        docker compose -f "$ScriptDir\docker-compose.local.yml" stop
        Write-Host " [✓] تم إيقاف الخدمات المحلية بنجاح." -ForegroundColor Green
        Read-Host " اضغط Enter للمتابعة..."
    }
}

# --- Direct Action Routing ---
if ($Action -eq "server") { Start-VPSSite; exit }
if ($Action -eq "local")  { Start-LocalSite; exit }
if ($Action -eq "status") { Check-Status; exit }
if ($Action -eq "stop")   { Stop-Site; exit }
if ($Action -eq "restart") { Restart-Site; exit }

# --- Interactive Menu Loop ---
do {
    Write-Header
    Write-Host "  [1] تشغيل الموقع بالكامل على السيرفر (VPS Live)     <-- تشغيل فوري بنقرة واحدة" -ForegroundColor Green
    Write-Host "  [2] تشغيل الموقع محلياً على هذا الجهاز (Localhost)" -ForegroundColor White
    Write-Host "  [3] فحص حالة الموقع والسيرفر (Status & Health Check)" -ForegroundColor White
    Write-Host "  [4] إعادة تشغيل الموقع بالكامل (Restart All Services)" -ForegroundColor White
    Write-Host "  [5] عرض السجلات الحية للموقع (Live Logs)" -ForegroundColor White
    Write-Host "  [6] إيقاف تشغيل الموقع (Stop Site Services)" -ForegroundColor Yellow
    Write-Host "  [7] فتح روابط الموقع المباشرة في المتصفح (Open Live URLs)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  [0] خروج (Exit)" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host " ------------------------------------------------------------------------------ " -ForegroundColor DarkGray
    $choice = Read-Host " الرجاء اختيار رقم العملية (أو اضغط Enter لتشغيل السايت فوراً)"

    if ($choice -eq "" -or $choice -eq "1") {
        Start-VPSSite
        break
    } elseif ($choice -eq "2") {
        Start-LocalSite
    } elseif ($choice -eq "3") {
        Check-Status
    } elseif ($choice -eq "4") {
        Restart-Site
    } elseif ($choice -eq "5") {
        View-Logs
    } elseif ($choice -eq "6") {
        Stop-Site
    } elseif ($choice -eq "7") {
        Start-Process "https://fxengen.com"
        Start-Process "https://fxengen.com/admin"
    } elseif ($choice -eq "0") {
        break
    }
} while ($true)