# Starts TrapScholar as a static local website using Python (no npm install).
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
Write-Host 'TrapScholar: open http://127.0.0.1:8080 in your browser.' -ForegroundColor Cyan
Write-Host 'Press Ctrl+C to stop the local server.' -ForegroundColor Gray
if (Get-Command python -ErrorAction SilentlyContinue) {
    python -m http.server 8080 --bind 127.0.0.1
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
    py -m http.server 8080 --bind 127.0.0.1
} else {
    Write-Error 'Python was not found. Install Python 3 or use any local static web server.'
}
