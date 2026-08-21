Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "Pushing All 4 Standalone Repositories to GitHub..." -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan

$repos = @(
    @{ Name = "Module 1: Document Intelligence"; Path = "D:\Projects\Paperwork\standalone_repos\module-1-document-intelligence" },
    @{ Name = "Module 2: Eligibility Copilot"; Path = "D:\Projects\Paperwork\standalone_repos\module-2-eligibility-copilot" },
    @{ Name = "Module 3: Form Readiness Kit"; Path = "D:\Projects\Paperwork\standalone_repos\module-3-form-readiness-kit" },
    @{ Name = "Module 4: Bilingual Explainer & Voice"; Path = "D:\Projects\Paperwork\standalone_repos\module-4-bilingual-explainer" }
)

foreach ($repo in $repos) {
    Write-Host "`nPushing $($repo.Name)..." -ForegroundColor Yellow
    Push-Location $repo.Path
    try {
        git push -u origin main
        Write-Host "✅ $($repo.Name) pushed successfully!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to push $($repo.Name): $_" -ForegroundColor Red
    }
    Pop-Location
}

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "Done!" -ForegroundColor Cyan
