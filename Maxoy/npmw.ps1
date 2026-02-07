param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$Args
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

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
  $index = Invoke-RestMethod -Uri $indexUrl -Method Get -UseBasicParsing

  $latestLts = $index | Where-Object { $_.lts -ne $false } | Select-Object -First 1
  if (-not $latestLts -or -not $latestLts.version) {
    throw "Node.js LTS sürümü bulunamadı. ($indexUrl)"
  }

  $version = [string]$latestLts.version
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

$node = Ensure-LocalNode

if (-not $Args -or $Args.Count -eq 0) {
  throw "Kullanım: .\\npmw.ps1 <npm-argümanları>. Örn: .\\npmw.ps1 install veya .\\npmw.ps1 run dev"
}

Push-Location $PSScriptRoot
try {
  & $node.NpmCmd @Args
} finally {
  Pop-Location
}
