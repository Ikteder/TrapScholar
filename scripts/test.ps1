$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error 'Node.js is required only for the tests, not to play the game.'
}
npm test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
