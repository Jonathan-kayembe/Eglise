# 🔐 Guide de Sécurité - Bonnes Pratiques

## ⚠️ IMPORTANT : Protection des Secrets

Ce document décrit les bonnes pratiques pour éviter la publication accidentelle de clés API, mots de passe et autres secrets sur GitHub ou tout autre dépôt public.

## 🎯 Principes Fondamentaux

### 1. **JAMAIS de secrets dans le code source**
- ❌ Ne jamais hardcoder des clés API, tokens, ou mots de passe dans le code
- ❌ Ne jamais commiter de fichiers `.env` contenant des valeurs réelles
- ✅ Utiliser uniquement des variables d'environnement
- ✅ Utiliser des fichiers `.env.example` avec des valeurs fictives

### 2. **Architecture sécurisée**
- ✅ **Backend uniquement** : Toutes les clés API sensibles doivent être côté serveur
- ❌ **Frontend** : Ne jamais exposer de clés API au client (elles sont visibles dans le code source compilé)
- ✅ **Proxy backend** : Faire passer tous les appels API sensibles par le backend

## 📁 Structure des Fichiers Sécurisés

### Fichiers à IGNORER (dans `.gitignore`)
```
.env
.env.*
!.env.example
*.env
config.env
**/*.secret
**/*.key
**/credentials.json
```

### Fichiers à COMMITER (sécurisés)
```
.env.example          # Modèle avec valeurs fictives
.env*.example         # Autres exemples
```

## 🔧 Configuration Backend

### Fichier `backend/.env` (NE JAMAIS COMMITER)
```env
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_vrai_mot_de_passe
DB_NAME=eglise_predications
YOUTUBE_API_KEY=votre_vraie_cle_api
YOUTUBE_CHANNEL_ID=votre_channel_id
NODE_ENV=development
```

### Fichier `backend/.env.example` (À COMMITER)
```env
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_DATABASE_PASSWORD_HERE
DB_NAME=eglise_predications
YOUTUBE_API_KEY=YOUR_YOUTUBE_API_KEY_HERE
YOUTUBE_CHANNEL_ID=YOUR_YOUTUBE_CHANNEL_ID_HERE
NODE_ENV=development
```

## 🎨 Configuration Frontend

### Fichier `frontend/.env` (NE JAMAIS COMMITER)
```env
VITE_API_URL=http://localhost:3001
```

### Fichier `frontend/.env.example` (À COMMITER)
```env
VITE_API_URL=http://localhost:3001
# ⚠️ ATTENTION : Ne pas utiliser de clé API YouTube côté frontend
# Tous les appels API doivent passer par le backend pour des raisons de sécurité
```

## ✅ Vérifications Avant Commit

### Checklist de sécurité

Avant chaque commit, vérifiez :

- [ ] Aucun fichier `.env` n'est dans le staging area
- [ ] Aucune clé API réelle dans les fichiers d'exemple
- [ ] Aucun secret hardcodé dans le code source
- [ ] Le `.gitignore` exclut bien tous les fichiers sensibles
- [ ] Les fichiers `.env.example` contiennent uniquement des valeurs fictives

### Commandes de vérification

```bash
# Vérifier qu'aucun .env n'est tracké
git ls-files | grep -E "\.env$|\.env\."

# Vérifier le contenu avant commit
git diff --cached | grep -i "api_key\|password\|secret\|token"

# Vérifier l'historique pour des secrets (si nécessaire)
git log -p | grep -i "api_key\|password\|secret"
```

## 🚨 Si un Secret a Déjà été Publié

### Étape 1 : Révoquer immédiatement

1. **Clé API YouTube** : Allez sur [Google Cloud Console](https://console.cloud.google.com/apis/credentials) et révoquez la clé
2. **Mot de passe base de données** : Changez le mot de passe immédiatement
3. **Tokens** : Révoquez tous les tokens exposés

### Étape 2 : Nettoyer l'historique Git

⚠️ **ATTENTION** : Ces commandes réécrivent l'historique Git. Ne les utilisez que si vous êtes sûr de ce que vous faites.

#### Option A : Utiliser git-filter-repo (recommandé)

```bash
# Installer git-filter-repo
pip install git-filter-repo

# Supprimer un fichier de tout l'historique
git filter-repo --path backend/.env --invert-paths

# Supprimer une valeur spécifique de tout l'historique
git filter-repo --replace-text <(echo "AIzaSyDmoa5ZZcQzd5jg0beCJiYCMHDTaSYHNvA==>YOUR_YOUTUBE_API_KEY_HERE")
```

#### Option B : Utiliser BFG Repo-Cleaner

```bash
# Télécharger BFG : https://rtyley.github.io/bfg-repo-cleaner/

# Supprimer un fichier
java -jar bfg.jar --delete-files .env

# Remplacer une valeur
java -jar bfg.jar --replace-text secrets.txt
# Dans secrets.txt : AIzaSyDmoa5ZZcQzd5jg0beCJiYCMHDTaSYHNvA==>YOUR_YOUTUBE_API_KEY_HERE
```

#### Option C : Réécriture manuelle avec git filter-branch

```bash
# Supprimer un fichier de tout l'historique
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/.env" \
  --prune-empty --tag-name-filter cat -- --all

# Forcer la mise à jour sur GitHub (après backup !)
git push origin --force --all
git push origin --force --tags
```

### Étape 3 : Nettoyer GitHub

1. Allez dans les **Settings** de votre dépôt GitHub
2. Section **Secrets and variables** → **Dependabot alerts**
3. Vérifiez les alertes de sécurité
4. Utilisez l'outil **Secret scanning** de GitHub si disponible

### Étape 4 : Prévenir les collaborateurs

- Informez tous les collaborateurs du problème
- Demandez-leur de cloner à nouveau le dépôt après le nettoyage
- Partagez les nouvelles clés API de manière sécurisée (via un gestionnaire de mots de passe, pas par email)

## 🛡️ Bonnes Pratiques pour l'Avenir

### 1. Utiliser un gestionnaire de secrets

Pour les projets professionnels, utilisez :
- **HashiCorp Vault** : Pour les secrets en production
- **AWS Secrets Manager** : Si vous utilisez AWS
- **Azure Key Vault** : Si vous utilisez Azure
- **1Password Secrets Automation** : Pour les équipes

### 2. Utiliser des pre-commit hooks

Créez un fichier `.git/hooks/pre-commit` :

```bash
#!/bin/sh
# Vérifier qu'aucun .env n'est commité
if git diff --cached --name-only | grep -E "\.env$|\.env\."; then
    echo "❌ ERREUR : Tentative de commit d'un fichier .env"
    echo "Les fichiers .env ne doivent jamais être commités"
    exit 1
fi

# Vérifier les patterns de secrets
if git diff --cached | grep -iE "api[_-]?key\s*=\s*[A-Za-z0-9]{20,}|password\s*=\s*[^YOUR_|your_]"; then
    echo "❌ ERREUR : Possible secret détecté dans le code"
    echo "Vérifiez que vous n'avez pas commité de vraies clés API ou mots de passe"
    exit 1
fi
```

### 3. Utiliser des outils de détection

- **git-secrets** : Détecte les secrets avant le commit
- **truffleHog** : Scan l'historique Git pour les secrets
- **gitleaks** : Scanner de fuites de secrets

Installation et utilisation de gitleaks :

```bash
# Installer gitleaks
# Windows (avec Chocolatey)
choco install gitleaks

# Scanner le dépôt
gitleaks detect --source . --verbose

# Scanner avant commit (hook)
gitleaks protect --no-banner
```

### 4. Configuration CI/CD

Ajoutez des vérifications dans votre pipeline CI/CD :

```yaml
# .github/workflows/security.yml
name: Security Scan
on: [push, pull_request]
jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Gitleaks
        uses: gitleaks/gitleaks-action@v2
```

### 5. Documentation claire

- Toujours documenter où obtenir les clés API
- Toujours fournir des fichiers `.env.example`
- Toujours expliquer pourquoi certains secrets ne doivent pas être commités

## 📋 Checklist de Déploiement

Avant chaque déploiement :

- [ ] Toutes les variables d'environnement sont configurées sur le serveur
- [ ] Aucun secret n'est dans le code déployé
- [ ] Les clés API de production sont différentes de celles de développement
- [ ] Les logs ne contiennent pas de secrets
- [ ] Les variables d'environnement sont injectées de manière sécurisée

## 🔍 Audit Régulier

Effectuez un audit de sécurité régulier :

1. **Scanner l'historique Git** : Utilisez gitleaks ou truffleHog
2. **Vérifier les dépendances** : `npm audit` ou `npm audit fix`
3. **Vérifier les permissions** : Qui a accès au dépôt ?
4. **Vérifier les clés API** : Sont-elles toujours nécessaires ? Permissions minimales ?

## 📚 Ressources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [12 Factor App - Config](https://12factor.net/config)
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

## 🆘 En Cas de Problème

Si vous découvrez qu'un secret a été publié :

1. **Ne paniquez pas** mais agissez rapidement
2. **Révoquez immédiatement** la clé/token exposé
3. **Nettoyez l'historique Git** (voir section ci-dessus)
4. **Changez tous les mots de passe** potentiellement exposés
5. **Documentez l'incident** pour éviter qu'il se reproduise

---

**Rappel** : La sécurité est une responsabilité partagée. Chaque développeur doit être vigilant.
