# Script pour supprimer les fichiers .env du tracking Git
# Usage: .\supprimer-env-git.ps1

Write-Host "🗑️  Suppression des fichiers .env du tracking Git" -ForegroundColor Cyan
Write-Host ""

# Vérifier que nous sommes dans un dépôt Git
if (-not (Test-Path .git)) {
    Write-Host "❌ Erreur : Ce n'est pas un dépôt Git" -ForegroundColor Red
    exit 1
}

# 1. Vérifier les fichiers .env trackés
Write-Host "1️⃣  Recherche des fichiers .env trackés..." -ForegroundColor Yellow
$trackedEnv = git ls-files | Select-String "\.env$" | Where-Object { $_ -notmatch "\.env\.example" }

if (-not $trackedEnv) {
    Write-Host "   ✅ Aucun fichier .env tracké (sauf .env.example)" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Rien à faire ! Les fichiers .env ne sont pas trackés par Git." -ForegroundColor Green
    exit 0
}

Write-Host "   ⚠️  Fichiers .env trackés trouvés :" -ForegroundColor Red
$trackedEnv | ForEach-Object { Write-Host "      $_" -ForegroundColor Red }
Write-Host ""

# 2. Supprimer du tracking Git (sans supprimer du disque)
Write-Host "2️⃣  Suppression du tracking Git..." -ForegroundColor Yellow
$trackedEnv | ForEach-Object {
    Write-Host "   Suppression de : $_" -ForegroundColor Gray
    git rm --cached $_ 2>$null
}

Write-Host "   ✅ Fichiers supprimés du tracking Git" -ForegroundColor Green
Write-Host ""

# 3. Vérifier que .gitignore est correct
Write-Host "3️⃣  Vérification du .gitignore..." -ForegroundColor Yellow
$gitignoreContent = Get-Content .gitignore -ErrorAction SilentlyContinue
if ($gitignoreContent -match "\.env") {
    Write-Host "   ✅ .gitignore contient déjà .env" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  .gitignore ne contient pas .env" -ForegroundColor Yellow
    Write-Host "   Ajout de .env au .gitignore..." -ForegroundColor Gray
    Add-Content -Path .gitignore -Value "`n# Environment variables`n.env`n.env.*`n!.env.example"
    Write-Host "   ✅ .env ajouté au .gitignore" -ForegroundColor Green
}
Write-Host ""

# 4. Afficher le statut
Write-Host "4️⃣  Statut Git actuel :" -ForegroundColor Yellow
git status --short
Write-Host ""

# Résumé
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "✅ TERMINÉ !" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Prochaines étapes :" -ForegroundColor Cyan
Write-Host "   1. Vérifiez les changements : git status" -ForegroundColor White
Write-Host "   2. Commitez la suppression :" -ForegroundColor White
Write-Host "      git commit -m 'Remove .env files from Git tracking'" -ForegroundColor Gray
Write-Host "   3. Poussez les changements : git push" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Note : Les fichiers .env restent sur votre disque," -ForegroundColor Yellow
Write-Host "   mais ne seront plus trackés par Git." -ForegroundColor Yellow
Write-Host ""
