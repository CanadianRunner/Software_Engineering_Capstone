# Portfolio Application Startup Script
# Save as: C:\Users\seank\Documents\code\Software_Engineering_Capstone\start-portfolio.ps1

$root = 'C:\Users\seank\Documents\code\Software_Engineering_Capstone'

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Portfolio Server Startup Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# STEP 1: Start Cloudflare DDNS (CRITICAL)
# ============================================
Write-Host "[1/5] Starting Cloudflare DDNS..." -ForegroundColor Yellow

cd "C:\Users\seank\cloudflare-ddns"

docker compose up -d
Start-Sleep -Seconds 2

$rootDdns = docker ps --filter "name=cloudflare-ddns-root" --format "{{.Names}}"
$vpnDdns  = docker ps --filter "name=cloudflare-ddns-vpn" --format "{{.Names}}"

if ($rootDdns -and $vpnDdns) {
    Write-Host "✓ Cloudflare DDNS containers are running" -ForegroundColor Green
    Write-Host "Recent DDNS logs:" -ForegroundColor Yellow
    docker logs --tail 5 cloudflare-ddns-root
    docker logs --tail 5 cloudflare-ddns-vpn
} else {
    Write-Host "✗ Cloudflare DDNS failed to start correctly" -ForegroundColor Red
    return
}

Write-Host ""

# ============================================
# STEP 2: Check and Start MySQL
# ============================================
Write-Host "[2/5] Checking MySQL..." -ForegroundColor Yellow

$mysqlService = Get-Service -Name "MySQL*" -ErrorAction SilentlyContinue
if ($mysqlService) {
    if ($mysqlService.Status -eq "Running") {
        Write-Host "✓ MySQL is already running" -ForegroundColor Green
    } else {
        Write-Host "→ Starting MySQL..." -ForegroundColor Yellow
        Start-Service $mysqlService.Name
        Start-Sleep -Seconds 3
        Write-Host "✓ MySQL started successfully" -ForegroundColor Green
    }
} else {
    Write-Host "✗ MySQL service not found" -ForegroundColor Red
    return
}

$mysqlTest = netstat -an | Select-String ":3306.*LISTENING"
if ($mysqlTest) {
    Write-Host "✓ MySQL is listening on port 3306" -ForegroundColor Green
} else {
    Write-Host "✗ MySQL is not listening on port 3306" -ForegroundColor Red
    return
}

Write-Host ""

# ============================================
# STEP 3: Check and Start Docker/Nginx
# ============================================
Write-Host "[3/5] Checking Docker & Nginx..." -ForegroundColor Yellow

$dockerProcess = Get-Process -Name "Docker Desktop" -ErrorAction SilentlyContinue
if (-not $dockerProcess) {
    Write-Host "✗ Docker Desktop is not running" -ForegroundColor Red
    Write-Host "  Please start Docker Desktop manually" -ForegroundColor Yellow
    return
}
Write-Host "✓ Docker Desktop is running" -ForegroundColor Green

cd "C:\nginx-proxy-manager"
$nginxContainer = docker ps --filter "name=nginx-proxy-manager" --format "{{.Names}}"

if ($nginxContainer) {
    Write-Host "✓ Nginx container is running" -ForegroundColor Green
} else {
    Write-Host "→ Starting Nginx..." -ForegroundColor Yellow
    docker compose up -d
    Start-Sleep -Seconds 5

    $nginxContainer = docker ps --filter "name=nginx-proxy-manager" --format "{{.Names}}"
    if ($nginxContainer) {
        Write-Host "✓ Nginx started successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to start Nginx" -ForegroundColor Red
        return
    }
}

$port80 = netstat -an | Select-String ":80.*LISTENING"
$port443 = netstat -an | Select-String ":443.*LISTENING"

if ($port80) {
    Write-Host "✓ Port 80 is listening" -ForegroundColor Green
} else {
    Write-Host "✗ Port 80 is not listening" -ForegroundColor Red
}

if ($port443) {
    Write-Host "✓ Port 443 is listening" -ForegroundColor Green
} else {
    Write-Host "✗ Port 443 is not listening" -ForegroundColor Red
}

Write-Host ""

# ============================================
# STEP 4: Start Backend
# ============================================
Write-Host "[4/5] Starting Backend..." -ForegroundColor Yellow

cd "$root\portfolio-page-backend"
if (-not (Test-Path .\*.csproj)) {
    Write-Host "✗ No .csproj found in backend folder" -ForegroundColor Red
    return
}

Write-Host "→ Building backend..." -ForegroundColor Yellow
dotnet build --verbosity quiet

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Backend build failed" -ForegroundColor Red
    return
}

Write-Host "✓ Backend built successfully" -ForegroundColor Green
Write-Host "→ Starting backend in a new window..." -ForegroundColor Yellow

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\portfolio-page-backend'; dotnet run"
Start-Sleep -Seconds 5

$backendTest = netstat -an | Select-String ":5001.*LISTENING"
if ($backendTest) {
    Write-Host "✓ Backend is listening on port 5001" -ForegroundColor Green
} else {
    Write-Host "⚠ Backend may still be starting..." -ForegroundColor Yellow
}

Write-Host ""

# ============================================
# STEP 5: Start Frontend
# ============================================
Write-Host "[5/5] Starting Frontend..." -ForegroundColor Yellow

cd "$root\portfolio-page"
if (-not (Test-Path .\package.json)) {
    Write-Host "✗ package.json not found in frontend folder" -ForegroundColor Red
    return
}

if (-not (Test-Path .\node_modules)) {
    Write-Host "→ Installing frontend dependencies..." -ForegroundColor Yellow
    npm install --silent

    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ npm install failed" -ForegroundColor Red
        return
    }
}

Write-Host "→ Building frontend..." -ForegroundColor Yellow
npm run build --silent

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Frontend build failed" -ForegroundColor Red
    return
}

Write-Host "✓ Frontend built successfully" -ForegroundColor Green
Write-Host "→ Starting frontend in a new window..." -ForegroundColor Yellow

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\portfolio-page'; npx serve -s build -l 3000"
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Startup Complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your portfolio is running:" -ForegroundColor White
Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Backend:   https://localhost:5001" -ForegroundColor Cyan
Write-Host "  Public:    https://sean-keane.com" -ForegroundColor Green
Write-Host "  Nginx:     http://localhost:81" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Enter to exit..."
Read-Host