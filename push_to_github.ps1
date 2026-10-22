param(
    [Parameter(Mandatory=$false)]
    [string]$RepoUrl
)

$git = Join-Path $PSScriptRoot ".git_bin\cmd\git.exe"

if (-not $RepoUrl) {
    $RepoUrl = Read-Host "Enter your GitHub repository URL (e.g. https://github.com/username/ai-practice-assistant.git)"
}

if (-not $RepoUrl) {
    Write-Host "No URL entered. Aborting." -ForegroundColor Yellow
    exit 1
}

Write-Host "Setting remote origin to $RepoUrl..." -ForegroundColor Cyan
& $git remote remove origin 2>$null
& $git remote add origin $RepoUrl

Write-Host "Pushing main branch to GitHub..." -ForegroundColor Cyan
& $git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "Successfully pushed to GitHub!" -ForegroundColor Green
} else {
    Write-Host "Push failed. If this is a private repo, ensure you are authenticated or use a GitHub Personal Access Token." -ForegroundColor Red
}
