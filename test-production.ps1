# Test Production Build Locally
# Usage: .\test-production.ps1

param(
    [Parameter(Mandatory=$false)]
    [switch]$Clean = $false
)

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Testing Production Build" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

if ($Clean) {
    Write-Host "Cleaning previous build..." -ForegroundColor Yellow
    docker compose -f docker-compose.prod.yml down -v
    docker rmi maxoy:test -ErrorAction SilentlyContinue
}

# Check if .env.production exists
if (-not (Test-Path ".env.production")) {
    Write-Host "Creating .env.production from example..." -ForegroundColor Yellow
    Copy-Item .env.production.example .env.production
    Write-Host "Please edit .env.production with your settings" -ForegroundColor Red
    exit 1
}

Write-Host "Building production Docker image..." -ForegroundColor Yellow
docker build -t maxoy:test -f Dockerfile .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Starting services..." -ForegroundColor Yellow
$env:IMAGE_TAG = "test"
docker compose -f docker-compose.prod.yml up -d

Write-Host "Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host "Running database migrations..." -ForegroundColor Yellow
docker compose -f docker-compose.prod.yml exec -T app npx prisma migrate deploy

Write-Host "Seeding database (optional)..." -ForegroundColor Yellow
docker compose -f docker-compose.prod.yml exec -T app npx prisma db seed

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "Production build is running!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access the application at:" -ForegroundColor Cyan
Write-Host "  Admin: http://localhost/admin/login" -ForegroundColor White
Write-Host "  Health: http://localhost/admin/health" -ForegroundColor White
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Cyan
Write-Host "  View logs: docker compose -f docker-compose.prod.yml logs -f app" -ForegroundColor White
Write-Host "  Stop: docker compose -f docker-compose.prod.yml down" -ForegroundColor White
Write-Host "  Cleanup: docker compose -f docker-compose.prod.yml down -v" -ForegroundColor White
