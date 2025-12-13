# Script PowerShell pour nettoyer l'historique Git des secrets
# Usage: .\clean-git-history.ps1

param(
    [string]$SecretToReplace = "",
    [string]$Replacement = "YOUR_SECRET_HERE",
    [string[]]$FilesToRemove = @()
)

Write-Host "🧹 Nettoyage de l'historique Git" -ForegroundColor Cyan
Write-Host "⚠️  ATTENTION : Cette opération est IRRÉVERSIBLE" -ForegroundColor Red
Write-Host ""

# Vérifier que nous sommes dans un dépôt Git
if (-not (Test-Path .git)) {
    Write-Host "❌ Erreur : Ce n'est pas un dépôt Git" -ForegroundColor Red
    exit 1
}

# Afficher l'état actuel
Write-Host "📊 État actuel du dépôt :" -ForegroundColor Yellow
git status --short
Write-Host ""

# Demander confirmation
Write-Host "⚠️  Cette opération va :" -ForegroundColor Yellow
Write-Host "   - Réécrire tout l'historique Git" -ForegroundColor White
Write-Host "   - Supprimer les secrets de tous les commits" -ForegroundColor White
Write-Host "   - Nécessiter un force push sur GitHub" -ForegroundColor White
Write-Host ""
$confirmation = Read-Host "Voulez-vous continuer ? (tapez 'OUI' pour confirmer)"
if ($confirmation -ne "OUI") {
    Write-Host "❌ Opération annulée" -ForegroundColor Yellow
    exit 0
}

# Faire une backup
Write-Host ""
Write-Host "📦 Création d'une backup..." -ForegroundColor Yellow
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupDir = "../backup-repo-$timestamp"
try {
    git clone --mirror . $backupDir
    Write-Host "✅ Backup créée dans : $backupDir" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Erreur lors de la création de la backup : $_" -ForegroundColor Yellow
    $continue = Read-Host "Continuer quand même ? (oui/non)"
    if ($continue -ne "oui") {
        exit 1
    }
}

# Vérifier si git-filter-repo est disponible
$filterRepo = Get-Command git-filter-repo -ErrorAction SilentlyContinue
if (-not $filterRepo) {
    Write-Host ""
    Write-Host "❌ git-filter-repo n'est pas installé" -ForegroundColor Red
    Write-Host "📥 Installation requise :" -ForegroundColor Yellow
    Write-Host "   Option 1 : pip install git-filter-repo" -ForegroundColor White
    Write-Host "   Option 2 : choco install git-filter-repo" -ForegroundColor White
    Write-Host ""
    Write-Host "   Ou utilisez BFG Repo-Cleaner :" -ForegroundColor Yellow
    Write-Host "   https://rtyley.github.io/bfg-repo-cleaner/" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "🔧 Utilisation de git-filter-repo..." -ForegroundColor Yellow

# Supprimer des fichiers si spécifiés
if ($FilesToRemove.Count -gt 0) {
    Write-Host "🗑️  Suppression des fichiers de l'historique..." -ForegroundColor Yellow
    $filesArg = $FilesToRemove -join " --path "
    $command = "git filter-repo --path $filesArg --invert-paths"
    Invoke-Expression $command
    Write-Host "✅ Fichiers supprimés de l'historique" -ForegroundColor Green
}

# Remplacer des secrets si spécifié
if ($SecretToReplace -ne "") {
    Write-Host "🔄 Remplacement des secrets dans l'historique..." -ForegroundColor Yellow
    
    # Créer le fichier de remplacement
    $replaceFile = "replace.txt"
    "$SecretToReplace==>$Replacement" | Out-File -FilePath $replaceFile -Encoding UTF8 -NoNewline
    Write-Host "   Fichier de remplacement créé : $replaceFile" -ForegroundColor Gray
    
    # Exécuter git-filter-repo
    git filter-repo --replace-text $replaceFile
    
    # Supprimer le fichier temporaire
    Remove-Item $replaceFile -ErrorAction SilentlyContinue
    
    Write-Host "✅ Secrets remplacés dans l'historique" -ForegroundColor Green
}

# Nettoyer les références
Write-Host ""
Write-Host "🧹 Nettoyage des références Git..." -ForegroundColor Yellow
git reflog expire --expire=now --all
git gc --prune=now --aggressive
Write-Host "✅ Nettoyage terminé" -ForegroundColor Green

# Vérification
Write-Host ""
Write-Host "✅ Nettoyage terminé !" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Prochaines étapes :" -ForegroundColor Cyan
Write-Host "   1. Vérifiez l'historique : git log" -ForegroundColor White
Write-Host "   2. Vérifiez que les secrets sont supprimés :" -ForegroundColor White
Write-Host "      git log -p --all -S `"$SecretToReplace`" | Select-Object -First 10" -ForegroundColor Gray
Write-Host "   3. Forcez la mise à jour sur GitHub :" -ForegroundColor White
Write-Host "      git push origin --force --all" -ForegroundColor Gray
Write-Host "   4. Informez tous les collaborateurs de re-cloner le dépôt" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANT : Révoquez immédiatement les clés exposées sur :" -ForegroundColor Red
Write-Host "   https://console.cloud.google.com/apis/credentials" -ForegroundColor White
