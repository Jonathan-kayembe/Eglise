# 🧹 Guide de Nettoyage de l'Historique Git

Si un secret a été accidentellement publié sur GitHub, suivez ces étapes pour le supprimer de l'historique.

## ⚠️ AVERTISSEMENT

Ces opérations réécrivent l'historique Git. Elles sont **irréversibles** et peuvent affecter tous les collaborateurs.

**Avant de commencer :**
1. Faites une **backup complète** du dépôt
2. Informez tous les collaborateurs
3. Révoquez immédiatement les clés/tokens exposés

## 🔍 Étape 1 : Identifier le Problème

### Vérifier l'historique

**Linux/Mac/Git Bash :**
```bash
# Chercher des clés API dans l'historique
git log -p --all -S "AIzaSy" | head -50

# Chercher des mots de passe
git log -p --all | grep -i "password.*=" | head -20

# Lister tous les fichiers .env qui ont été commités
git log --all --full-history -- "*.env" | grep -v ".env.example"
```

**Windows PowerShell :**
```powershell
# Chercher des clés API dans l'historique
git log -p --all -S "AIzaSy" | Select-Object -First 50

# Chercher des mots de passe
git log -p --all | Select-String -Pattern "password.*=" | Select-Object -First 20

# Lister tous les fichiers .env qui ont été commités
git log --all --full-history --name-only -- "*.env" | Where-Object { $_ -notmatch "\.env\.example" } | Select-Object -Unique
```

📖 **Voir [NETTOYAGE_HISTORIQUE_POWERSHELL.md](NETTOYAGE_HISTORIQUE_POWERSHELL.md) pour le guide complet PowerShell**

## 🛠️ Étape 2 : Choisir la Méthode de Nettoyage

### Méthode A : git-filter-repo (RECOMMANDÉ)

**Avantages :** Plus rapide, plus sûr, recommandé par GitHub

#### Installation

```bash
# Windows (avec pip)
pip install git-filter-repo

# Ou avec Chocolatey
choco install git-filter-repo
```

#### Utilisation

```bash
# 1. Supprimer un fichier de tout l'historique
git filter-repo --path backend/.env --invert-paths

# 2. Remplacer une valeur spécifique
git filter-repo --replace-text <(echo "AIzaSyDmoa5ZZcQzd5jg0beCJiYCMHDTaSYHNvA==>YOUR_YOUTUBE_API_KEY_HERE")

# 3. Supprimer plusieurs fichiers
git filter-repo --path backend/.env --path frontend/.env --invert-paths

# 4. Utiliser un fichier de remplacements
# Créez replace.txt :
# AIzaSyDmoa5ZZcQzd5jg0beCJiYCMHDTaSYHNvA==>YOUR_YOUTUBE_API_KEY_HERE
# votre_mot_de_passe==>YOUR_DATABASE_PASSWORD_HERE
git filter-repo --replace-text replace.txt
```

### Méthode B : BFG Repo-Cleaner

**Avantages :** Plus simple pour les remplacements de texte

#### Installation

1. Téléchargez depuis : https://rtyley.github.io/bfg-repo-cleaner/
2. Ou avec Chocolatey : `choco install bfg`

#### Utilisation

```bash
# 1. Supprimer un fichier
java -jar bfg.jar --delete-files .env

# 2. Remplacer une valeur
# Créez secrets.txt :
# AIzaSyDmoa5ZZcQzd5jg0beCJiYCMHDTaSYHNvA==>YOUR_YOUTUBE_API_KEY_HERE
java -jar bfg.jar --replace-text secrets.txt

# 3. Nettoyer les fichiers de plus de 100M
java -jar bfg.jar --strip-blobs-bigger-than 100M
```

### Méthode C : git filter-branch (ANCIENNE MÉTHODE)

⚠️ **Déprécié** mais fonctionne toujours

```bash
# Supprimer un fichier de tout l'historique
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/.env" \
  --prune-empty --tag-name-filter cat -- --all

# Remplacer une valeur
git filter-branch --force --tree-filter \
  "find . -type f -exec sed -i 's/AIzaSyDmoa5ZZcQzd5jg0beCJiYCMHDTaSYHNvA/YOUR_YOUTUBE_API_KEY_HERE/g' {} +" \
  --prune-empty --tag-name-filter cat -- --all
```

## 🚀 Étape 3 : Forcer la Mise à Jour sur GitHub

⚠️ **ATTENTION** : Cela réécrit l'historique sur GitHub. Tous les collaborateurs devront re-cloner.

```bash
# Forcer la mise à jour de toutes les branches
git push origin --force --all

# Forcer la mise à jour des tags
git push origin --force --tags

# Si vous avez des pull requests ouvertes, elles devront être recréées
```

## 🔄 Étape 4 : Nettoyer les Références Locales

```bash
# Nettoyer les références obsolètes
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

## 👥 Étape 5 : Informer les Collaborateurs

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

## ✅ Étape 6 : Vérification

```bash
# Vérifier que le secret n'est plus dans l'historique
git log -p --all -S "AIzaSyDmoa5ZZcQzd5jg0beCJiYCMHDTaSYHNvA"

# Devrait ne rien retourner
```

## 🔐 Étape 7 : Révoquer les Secrets

**IMMÉDIATEMENT** après avoir identifié le problème :

1. **Clé API YouTube** :
   - Allez sur https://console.cloud.google.com/apis/credentials
   - Révoquez la clé exposée
   - Créez une nouvelle clé

2. **Mots de passe base de données** :
   - Changez le mot de passe MySQL
   - Mettez à jour tous les environnements

3. **Tokens** :
   - Révoquez tous les tokens exposés
   - Générez de nouveaux tokens

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
