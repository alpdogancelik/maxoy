# PowerShell Deployment Script for Maxoy
# Usage: .\deploy.ps1 [-Environment production]

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("staging", "production")]
    [string]$Environment = "production"
)

$ErrorActionPreference = "Stop"
$ComposeFile = "docker-compose.prod.yml"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Maxoy Deployment Script" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Check if .env.production exists
if (-not (Test-Path ".env.production")) {
    Write-Host "Error: .env.production file not found" -ForegroundColor Red
    Write-Host "Please copy .env.production.example to .env.production and configure it"
    exit 1
}

# Load environment variables
Get-Content .env.production | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
    }
}

Write-Host "Step 1: Pulling latest changes..." -ForegroundColor Yellow
git pull origin main

Write-Host "Step 2: Pulling Docker images..." -ForegroundColor Yellow
docker compose -f $ComposeFile pull

Write-Host "Step 3: Building application..." -ForegroundColor Yellow
docker compose -f $ComposeFile build --no-cache app

Write-Host "Step 4: Stopping old containers..." -ForegroundColor Yellow
docker compose -f $ComposeFile down

Write-Host "Step 5: Starting services..." -ForegroundColor Yellow
docker compose -f $ComposeFile up -d

Write-Host "Step 6: Waiting for database..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "Step 7: Running database migrations..." -ForegroundColor Yellow
docker compose -f $ComposeFile exec -T app npx prisma migrate deploy

Write-Host "Step 8: Health check..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

$AppPort = $env:APP_PORT
if (-not $AppPort) { $AppPort = "3000" }

try {
    $response = Invoke-WebRequest -Uri "http://localhost:$AppPort/admin/health" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Application is healthy" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Health check failed" -ForegroundColor Red
    Write-Host "Check logs with: docker compose -f $ComposeFile logs app"
    exit 1
}

Write-Host "Step 9: Cleaning up..." -ForegroundColor Yellow
docker system prune -f

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "View logs: docker compose -f $ComposeFile logs -f app"
Write-Host "Stop: docker compose -f $ComposeFile down"
Write-Host "Restart: docker compose -f $ComposeFile restart app"
