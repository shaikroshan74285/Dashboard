param(
  [int]$Port = 5500
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

Write-Host "Starting MarketPulse India at http://127.0.0.1:$Port/" -ForegroundColor Cyan

$openBrowserJob = Start-Job -ScriptBlock {
  param($url)
  Start-Sleep -Seconds 1
  Start-Process $url | Out-Null
} -ArgumentList "http://127.0.0.1:$Port/"

try {
  if (Get-Command python -ErrorAction SilentlyContinue) {
    python -m http.server $Port --bind 127.0.0.1
    exit 0
  }

  if (Get-Command py -ErrorAction SilentlyContinue) {
    py -m http.server $Port --bind 127.0.0.1
    exit 0
  }

  Write-Host "Python was not found on this machine." -ForegroundColor Yellow
  Write-Host "Install Python 3, then run this script again." -ForegroundColor Yellow
  exit 1
} finally {
  if ($openBrowserJob) {
    Receive-Job -Job $openBrowserJob -Keep | Out-Null
    Remove-Job -Job $openBrowserJob -Force -ErrorAction SilentlyContinue
  }
}
