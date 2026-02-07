# PowerShell Backup Script for Maxoy Database
# Usage: .\backup.ps1

$ErrorActionPreference = "Stop"

$BackupDir = ".\backups"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = "$BackupDir\maxoy_backup_$Timestamp.sql"
$ComposeFile = "docker-compose.prod.yml"

Write-Host "Creating backup directory..." -ForegroundColor Yellow
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

Write-Host "Creating database backup..." -ForegroundColor Yellow
docker compose -f $ComposeFile exec -T db pg_dump -U maxoy maxoy | Out-File -FilePath $BackupFile -Encoding utf8

Write-Host "Compressing backup..." -ForegroundColor Yellow
Compress-Archive -Path $BackupFile -DestinationPath "$BackupFile.zip"
Remove-Item $BackupFile

Write-Host "Backup completed: $BackupFile.zip" -ForegroundColor Green

# Keep only last 7 backups
Write-Host "Cleaning old backups..." -ForegroundColor Yellow
Get-ChildItem -Path $BackupDir -Filter "maxoy_backup_*.zip" | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -Skip 7 | 
    Remove-Item -Force

Write-Host "Backup process finished" -ForegroundColor Green
