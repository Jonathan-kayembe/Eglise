# 🧹 Nettoyage de l'Historique Git - Guide PowerShell

Guide pratique pour supprimer les secrets de l'historique Git sur Windows avec PowerShell.

## ⚠️ AVERTISSEMENT CRITIQUE

**Ces opérations réécrivent l'historique Git. Elles sont IRRÉVERSIBLES.**

**AVANT DE COMMENCER :**
1. ✅ **Faites une backup complète** du dépôt
2. ✅ **Révoquez immédiatement** les clés/tokens exposés sur Google Cloud Console
3. ✅ **Informez tous les collaborateurs** qu'ils devront re-cloner après
4. ✅ **Sauvegardez vos modifications locales** non commitées

## 🔍 Étape 1 : Identifier les Secrets dans l'Historique

### Vérifier avec PowerShell

```powershell
# Chercher des clés API YouTube dans l'historique
git log -p --all -S "AIzaSy" | Select-Object -First 50

# Chercher des mots de passe
git log -p --all | Select-String -Pattern "password.*=" | Select-Object -First 20

# Lister tous les fichiers .env commités
git log --all --full-history --name-only -- "*.env" | Where-Object { $_ -notmatch "\.env\.example" } | Select-Object -Unique

# Vérifier un commit spécifique
git show <commit-hash> --name-only | Select-String "\.env"
```

### Identifier les commits problématiques

```powershell
# Lister les commits qui modifient des fichiers .env
git log --all --oneline -- "*.env" | Where-Object { $_ -notmatch "\.env\.example" }

# Voir le contenu d'un commit spécifique
git show <commit-hash> | Select-String -Pattern "API_KEY|PASSWORD"
```

## 🛠️ Étape 2 : Choisir la Méthode de Nettoyage

### Méthode A : git-filter-repo (RECOMMANDÉ)

**Avantages :** Plus rapide, plus sûr, recommandé par GitHub

#### Installation sur Windows

```powershell
# Option 1 : Avec pip (si Python est installé)
pip install git-filter-repo

# Option 2 : Avec Chocolatey
choco install git-filter-repo

# Option 3 : Télécharger depuis GitHub
# https://github.com/newren/git-filter-repo/releases
```

#### Utilisation

```powershell
# 1. Faire une backup d'abord !
git clone --mirror . ../backup-repo.git

# 2. Supprimer un fichier de tout l'historique
git filter-repo --path backend/.env --invert-paths

# 3. Remplacer une valeur spécifique
# Créez un fichier replace.txt avec :
# AIzaSyDmoa5ZZcQzd5jg0beCJiYCMHDTaSYHNvA==>YOUR_YOUTUBE_API_KEY_HERE
git filter-repo --replace-text replace.txt

# 4. Supprimer plusieurs fichiers
git filter-repo --path backend/.env --path frontend/.env --invert-paths

# 5. Remplacer plusieurs valeurs (créer replace.txt)
# Format : ancienne_valeur==>nouvelle_valeur
# Exemple :
# AIzaSyDmoa5ZZcQzd5jg0beCJiYCMHDTaSYHNvA==>YOUR_YOUTUBE_API_KEY_HERE
# votre_mot_de_passe==>YOUR_DATABASE_PASSWORD_HERE
git filter-repo --replace-text replace.txt
```

#### Créer le fichier replace.txt

```powershell
# Créez le fichier avec PowerShell
@"
AIzaSyDmoa5ZZcQzd5jg0beCJiYCMHDTaSYHNvA==>YOUR_YOUTUBE_API_KEY_HERE
UCRjaG7N4qnlMsRnejOkHuHQ==>YOUR_YOUTUBE_CHANNEL_ID_HERE
votre_mot_de_passe==>YOUR_DATABASE_PASSWORD_HERE
"@ | Out-File -FilePath replace.txt -Encoding UTF8
```

### Méthode B : BFG Repo-Cleaner

**Avantages :** Plus simple pour les remplacements de texte, interface Java

#### Installation

1. Téléchargez depuis : https://rtyley.github.io/bfg-repo-cleaner/
2. Ou avec Chocolatey : `choco install bfg`

#### Utilisation

```powershell
# 1. Clonez une copie propre du dépôt
git clone --mirror . ../backup-repo.git

# 2. Supprimer un fichier
java -jar bfg.jar --delete-files .env

# 3. Remplacer une valeur
# Créez secrets.txt avec le format :
# AIzaSyDmoa5ZZcQzd5jg0beCJiYCMHDTaSYHNvA==>YOUR_YOUTUBE_API_KEY_HERE
java -jar bfg.jar --replace-text secrets.txt

# 4. Nettoyer
cd backup-repo.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### Méthode C : git filter-branch (ANCIENNE - Dépréciée)

⚠️ **Déprécié** mais fonctionne toujours si les autres méthodes ne sont pas disponibles

```powershell
# Supprimer un fichier de tout l'historique
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch backend/.env" --prune-empty --tag-name-filter cat -- --all

# Remplacer une valeur (nécessite Git Bash ou WSL)
# Cette commande fonctionne mieux dans Git Bash
git filter-branch --force --tree-filter "if [ -f backend/.env ]; then sed -i 's/AIzaSyDmoa5ZZcQzd5jg0beCJiYCMHDTaSYHNvA/YOUR_YOUTUBE_API_KEY_HERE/g' backend/.env; fi" --prune-empty --tag-name-filter cat -- --all
```

## 🚀 Étape 3 : Forcer la Mise à Jour sur GitHub

⚠️ **ATTENTION** : Cela réécrit l'historique sur GitHub. Tous les collaborateurs devront re-cloner.

```powershell
# Forcer la mise à jour de toutes les branches
git push origin --force --all

# Forcer la mise à jour des tags
git push origin --force --tags

# Si vous avez des pull requests ouvertes, elles devront être recréées
```

## 🔄 Étape 4 : Nettoyer les Références Locales

```powershell
# Nettoyer les références obsolètes
git for-each-ref --format="delete %(refname)" refs/original | ForEach-Object { git update-ref $_ }
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

## 📋 Script PowerShell Complet

Créez un fichier `clean-history.ps1` :

```powershell
# Script de nettoyage de l'historique Git
param(
    [string]$SecretToReplace = "",
    [string]$Replacement = "YOUR_SECRET_HERE"
)

Write-Host "🧹 Nettoyage de l'historique Git" -ForegroundColor Cyan
Write-Host "⚠️  ATTENTION : Cette opération est IRRÉVERSIBLE" -ForegroundColor Red
Write-Host ""

# Demander confirmation
$confirmation = Read-Host "Voulez-vous continuer ? (oui/non)"
if ($confirmation -ne "oui") {
    Write-Host "Opération annulée" -ForegroundColor Yellow
    exit
}

# Faire une backup
Write-Host "📦 Création d'une backup..." -ForegroundColor Yellow
$backupDir = "../backup-repo-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
git clone --mirror . $backupDir
Write-Host "✅ Backup créée dans : $backupDir" -ForegroundColor Green

# Créer le fichier de remplacement si nécessaire
if ($SecretToReplace -ne "") {
    Write-Host "📝 Création du fichier de remplacement..." -ForegroundColor Yellow
    "$SecretToReplace==>$Replacement" | Out-File -FilePath replace.txt -Encoding UTF8
    Write-Host "✅ Fichier replace.txt créé" -ForegroundColor Green
    
    # Utiliser git-filter-repo si disponible
    $filterRepo = Get-Command git-filter-repo -ErrorAction SilentlyContinue
    if ($filterRepo) {
        Write-Host "🔧 Utilisation de git-filter-repo..." -ForegroundColor Yellow
        git filter-repo --replace-text replace.txt
    } else {
        Write-Host "⚠️  git-filter-repo non trouvé. Installation requise." -ForegroundColor Yellow
        Write-Host "   Installez avec : pip install git-filter-repo" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "✅ Nettoyage terminé !" -ForegroundColor Green
Write-Host "📋 Prochaines étapes :" -ForegroundColor Cyan
Write-Host "   1. Vérifiez l'historique : git log" -ForegroundColor White
Write-Host "   2. Forcez la mise à jour : git push origin --force --all" -ForegroundColor White
Write-Host "   3. Informez les collaborateurs" -ForegroundColor White
```

Utilisation :
```powershell
# Nettoyer une clé API spécifique
.\clean-history.ps1 -SecretToReplace "AIzaSyDmoa5ZZcQzd5jg0beCJiYCMHDTaSYHNvA" -Replacement "YOUR_YOUTUBE_API_KEY_HERE"
```

## ✅ Étape 5 : Vérification

```powershell
# Vérifier que le secret n'est plus dans l'historique
git log -p --all -S "AIzaSyDmoa5ZZcQzd5jg0beCJiYCMHDTaSYHNvA"

# Devrait ne rien retourner (ou seulement des valeurs remplacées)
```

## 🔐 Étape 6 : Révoquer les Secrets (IMMÉDIATEMENT)

**AVANT de nettoyer l'historique, révoquez les clés :**

1. **Clé API YouTube** :
   - Allez sur https://console.cloud.google.com/apis/credentials
   - Révoquez la clé exposée
   - Créez une nouvelle clé

2. **Mots de passe base de données** :
   - Changez le mot de passe MySQL
   - Mettez à jour tous les environnements

## 👥 Étape 7 : Informer les Collaborateurs

Envoyez ce message à tous les collaborateurs :

```
⚠️ IMPORTANT : Nettoyage de l'historique Git

L'historique Git a été nettoyé pour supprimer des secrets exposés.

ACTION REQUISE :
1. Sauvegardez vos modifications locales
2. Supprimez votre clone local
3. Re-clonez le dépôt :
   git clone [URL_DU_REPO]
4. Recréez vos branches de travail si nécessaire

Les pull requests ouvertes devront être recréées.
```

## 📝 Exemple Complet : Nettoyer une Clé API YouTube

```powershell
# 1. Faire une backup
git clone --mirror . ../backup-repo.git

# 2. Créer le fichier de remplacement
@"
AIzaSyDmoa5ZZcQzd5jg0beCJiYCMHDTaSYHNvA==>YOUR_YOUTUBE_API_KEY_HERE
"@ | Out-File -FilePath replace.txt -Encoding UTF8

# 3. Nettoyer l'historique
git filter-repo --replace-text replace.txt

# 4. Vérifier
git log -p --all -S "AIzaSyDmoa5ZZcQzd5jg0beCJiYCMHDTaSYHNvA" | Select-Object -First 10

# 5. Nettoyer les références
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 6. Forcer la mise à jour sur GitHub
git push origin --force --all
```

## 🛡️ Prévention Future

Après le nettoyage, mettez en place :

1. **Pre-commit hooks** (voir `.git/hooks/pre-commit.example`)
2. **GitHub Secret Scanning** (activé par défaut)
3. **gitleaks** dans votre CI/CD
4. **Formation** de l'équipe sur les bonnes pratiques

## 📚 Ressources

- [GitHub : Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [git-filter-repo documentation](https://github.com/newren/git-filter-repo)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)

---

**Rappel** : Mieux vaut prévenir que guérir. Utilisez toujours `.env.example` et vérifiez avant chaque commit.
