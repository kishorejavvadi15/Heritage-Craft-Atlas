param(
    [string]$Message = "Deploy latest changes"
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Text)
    Write-Host ""
    Write-Host "==> $Text" -ForegroundColor Cyan
}

function Invoke-Checked {
    param(
        [string]$Command,
        [string[]]$Arguments
    )

    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed: $Command $($Arguments -join ' ')"
    }
}

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

Write-Step "Building frontend"
Invoke-Checked "npm" @("run", "build")

Write-Step "Checking backend syntax"
Invoke-Checked "python" @("-m", "py_compile", "backend/main.py")

Write-Step "Inspecting git status"
$statusLines = git status --porcelain
if ($LASTEXITCODE -ne 0) {
    throw "Unable to read git status."
}

if (@($statusLines).Count -eq 0) {
    Write-Step "No changes to commit"
} else {
    Write-Step "Staging repository changes"
    Invoke-Checked "git" @("add", "-A")

    Write-Step "Creating commit"
    & git commit -m $Message
    if ($LASTEXITCODE -ne 0) {
        throw "git commit failed."
    }
}

Write-Step "Pushing main to GitHub"
Invoke-Checked "git" @("push", "origin", "main")

Write-Step "Deployment handoff complete"
Write-Host "GitHub push finished. If Render and Vercel are connected to this repository, they will redeploy automatically." -ForegroundColor Green
