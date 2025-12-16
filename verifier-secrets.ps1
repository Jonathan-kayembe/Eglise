# Script de vérification des secrets dans l'historique Git
# Usage: .\verifier-secrets.ps1

Write-Host "🔍 Vérification des secrets dans l'historique Git" -ForegroundColor Cyan
Write-Host ""

# Vérifier que nous sommes dans un dépôt Git
if (-not (Test-Path .git)) {
    Write-Host "❌ Erreur : Ce n'est pas un dépôt Git" -ForegroundColor Red
    Write-Host "   Assurez-vous d'être dans le répertoire du projet" -ForegroundColor Yellow
    exit 1
}

Write-Host "📂 Répertoire actuel : $(Get-Location)" -ForegroundColor Gray
Write-Host ""

# 1. Chercher des clés API YouTube
Write-Host "1️⃣  Recherche de clés API YouTube (AIzaSy)..." -ForegroundColor Yellow
$youtubeKeys = git log -p --all -S "AIzaSy" 2>$null | Select-String -Pattern "AIzaSy[A-Za-z0-9_-]{20,}" | Select-Object -First 10
if ($youtubeKeys) {
    Write-Host "   ⚠️  Clés API YouTube trouvées dans l'historique :" -ForegroundColor Red
    $youtubeKeys | ForEach-Object { Write-Host "      $($_.Line.Trim())" -ForegroundColor Red }
} else {
    Write-Host "   ✅ Aucune clé API YouTube trouvée" -ForegroundColor Green
}
Write-Host ""

# 2. Chercher des mots de passe
Write-Host "2️⃣  Recherche de mots de passe..." -ForegroundColor Yellow
$passwords = git log -p --all | Select-String -Pattern "password\s*=\s*[^YOUR_|your_|YOUR_|votre_|ta_|YOUR_DATABASE]" -CaseSensitive:$false | Select-Object -First 10
if ($passwords) {
    Write-Host "   ⚠️  Mots de passe potentiels trouvés :" -ForegroundColor Red
    $passwords | ForEach-Object { Write-Host "      $($_.Line.Trim())" -ForegroundColor Red }
} else {
    Write-Host "   ✅ Aucun mot de passe suspect trouvé" -ForegroundColor Green
}
Write-Host ""

# 3. Vérifier les fichiers .env trackés
Write-Host "3️⃣  Vérification des fichiers .env trackés..." -ForegroundColor Yellow
$trackedEnv = git ls-files | Select-String "\.env$" | Where-Object { $_ -notmatch "\.env\.example" }
if ($trackedEnv) {
    Write-Host "   ⚠️  Fichiers .env trackés par Git :" -ForegroundColor Red
    $trackedEnv | ForEach-Object { Write-Host "      $_" -ForegroundColor Red }
} else {
    Write-Host "   ✅ Aucun fichier .env tracké (sauf .env.example)" -ForegroundColor Green
}
Write-Host ""

# 4. Vérifier les fichiers .env dans l'historique
Write-Host "4️⃣  Vérification des fichiers .env dans l'historique..." -ForegroundColor Yellow
$envInHistory = git log --all --full-history --name-only -- "*.env" 2>$null | Where-Object { $_ -notmatch "\.env\.example" -and $_ -ne "" } | Select-Object -Unique
if ($envInHistory) {
    Write-Host "   ⚠️  Fichiers .env trouvés dans l'historique :" -ForegroundColor Red
    $envInHistory | ForEach-Object { Write-Host "      $_" -ForegroundColor Red }
} else {
    Write-Host "   ✅ Aucun fichier .env dans l'historique (sauf .env.example)" -ForegroundColor Green
}
Write-Host ""

# 5. Vérifier le staging area
Write-Host "5️⃣  Vérification du staging area..." -ForegroundColor Yellow
$stagedEnv = git diff --cached --name-only 2>$null | Select-String "\.env$" | Where-Object { $_ -notmatch "\.env\.example" }
if ($stagedEnv) {
    Write-Host "   ⚠️  Fichiers .env dans le staging :" -ForegroundColor Red
    $stagedEnv | ForEach-Object { Write-Host "      $_" -ForegroundColor Red }
} else {
    Write-Host "   ✅ Aucun fichier .env dans le staging" -ForegroundColor Green
}
Write-Host ""

# Résumé
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
if ($youtubeKeys -or $passwords -or $trackedEnv -or $envInHistory -or $stagedEnv) {
    Write-Host "⚠️  RÉSULTAT : Des secrets ont été détectés !" -ForegroundColor Red
    Write-Host "   Consultez NETTOYAGE_HISTORIQUE_POWERSHELL.md pour les supprimer" -ForegroundColor Yellow
} else {
    Write-Host "✅ RÉSULTAT : Aucun secret détecté dans l'historique" -ForegroundColor Green
    Write-Host "   Votre dépôt semble propre !" -ForegroundColor Green
}
Write-Host ""
