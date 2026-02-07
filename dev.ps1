Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Ensure Node.js exists on Windows even if global PATH is broken (e.g. npm.ps1 present but node.exe missing).
function Ensure-LocalNode {
  $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
  if ($nodeCmd) {
    return @{ NodeDir = Split-Path -Parent $nodeCmd.Source; NpmCmd = "npm" }
  }

  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

  $toolRoot = Join-Path $env:LOCALAPPDATA "maxoy-tools\node"
  if (-not (Test-Path $toolRoot)) {
    New-Item -ItemType Directory -Path $toolRoot | Out-Null
  }

  $indexUrl = "https://nodejs.org/dist/index.json"
  try {
    $index = Invoke-RestMethod -Uri $indexUrl -Method Get -UseBasicParsing
  } catch {
    throw "Node.js bulunamadı ve indirilemedi. Lütfen internet bağlantınızı kontrol edin. ($indexUrl)"
  }

  $latestLts = $index | Where-Object { $_.lts -ne $false } | Select-Object -First 1
  if (-not $latestLts -or -not $latestLts.version) {
    throw "Node.js LTS sürümü bulunamadı. ($indexUrl)"
  }

  $version = [string]$latestLts.version  # e.g. v20.11.1
  $folderName = "node-$version-win-x64"
  $nodeDir = Join-Path $toolRoot $folderName
  $nodeExe = Join-Path $nodeDir "node.exe"
  $npmCmd = Join-Path $nodeDir "npm.cmd"

  if (-not (Test-Path $nodeExe)) {
    $zipUrl = "https://nodejs.org/dist/$version/$folderName.zip"
    $zipPath = Join-Path $toolRoot "$folderName.zip"

    Write-Host "Node.js indiriliyor ($version)..." -ForegroundColor Cyan
    Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath -UseBasicParsing

    Write-Host "Node.js açılıyor..." -ForegroundColor Cyan
    Expand-Archive -Path $zipPath -DestinationPath $toolRoot -Force
  }

  if (-not (Test-Path $nodeExe) -or -not (Test-Path $npmCmd)) {
    throw "Node.js kurulumu tamamlanamadı. $nodeDir"
  }

  $env:Path = "$nodeDir;$env:Path"
  return @{ NodeDir = $nodeDir; NpmCmd = $npmCmd }
}

# Helper to run the active Next.js app from the correct folder on Windows.
$appRoot = Join-Path $PSScriptRoot "Maxoy"

if (-not (Test-Path $appRoot)) {
  throw "Expected app folder not found: $appRoot"
}

$node = Ensure-LocalNode

Push-Location $appRoot
try {
  if (-not (Test-Path (Join-Path $appRoot "node_modules"))) {
    & $node.NpmCmd install
  }
  & $node.NpmCmd run dev
} finally {
  Pop-Location
}


