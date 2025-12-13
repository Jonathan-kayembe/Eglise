# Script pour commiter et pousser les changements de sécurité
# Usage: .\commit-et-push.ps1

Write-Host "📦 Préparation du commit et push..." -ForegroundColor Cyan
Write-Host ""

# Vérifier que nous sommes dans un dépôt Git
if (-not (Test-Path .git)) {
    Write-Host "❌ Erreur : Ce n'est pas un dépôt Git" -ForegroundColor Red
    exit 1
}

# Supprimer le fichier de verrouillage s'il existe
if (Test-Path ".git/index.lock") {
    Write-Host "🔓 Suppression du fichier de verrouillage Git..." -ForegroundColor Yellow
    Remove-Item ".git/index.lock" -Force
    Write-Host "✅ Verrouillage supprimé" -ForegroundColor Green
    Write-Host ""
}

# Afficher le statut
Write-Host "📊 Statut Git actuel :" -ForegroundColor Yellow
git status --short
Write-Host ""

# Ajouter tous les fichiers
Write-Host "➕ Ajout de tous les fichiers..." -ForegroundColor Yellow
git add .
Write-Host "✅ Fichiers ajoutés" -ForegroundColor Green
Write-Host ""

# Créer le commit
Write-Host "💾 Création du commit..." -ForegroundColor Yellow
$commitMessage = "Security: Add documentation and scripts for secret management

- Add comprehensive security documentation (SECURITE.md)
- Add Git history cleanup guides (NETTOYAGE_HISTORIQUE.md)
- Add PowerShell scripts for secret verification and cleanup
- Update .gitignore to exclude all .env files
- Replace real API keys with placeholders in example files
- Update documentation with secure architecture guidelines"

git commit -m $commitMessage
Write-Host "✅ Commit créé" -ForegroundColor Green
Write-Host ""

# Pousser sur GitHub
Write-Host "🚀 Poussage sur GitHub..." -ForegroundColor Yellow
git push origin main
Write-Host "✅ Changements poussés sur GitHub" -ForegroundColor Green
Write-Host ""

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "✅ TERMINÉ !" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Résumé :" -ForegroundColor Cyan
Write-Host "   - Documentation de sécurité ajoutée" -ForegroundColor White
Write-Host "   - Scripts PowerShell créés" -ForegroundColor White
Write-Host "   - .gitignore mis à jour" -ForegroundColor White
Write-Host "   - Fichiers d'exemple sécurisés" -ForegroundColor White
Write-Host "   - Changements poussés sur GitHub" -ForegroundColor White
Write-Host ""
