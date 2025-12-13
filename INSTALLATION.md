# Guide d'Installation

## 📋 Prérequis

- Node.js 18+ et npm
- MySQL 8+
- Redis (optionnel, pour le cache)
- Clé API YouTube Data API v3

## 🔑 Obtenir une clé API YouTube

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'API YouTube Data API v3
4. Créez des identifiants (clé API)
5. Copiez la clé API

## 🗄️ Configuration de la base de données

1. Créez une base de données MySQL :
```sql
CREATE DATABASE eglise_predications CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Créez un utilisateur (optionnel) :
```sql
CREATE USER 'eglise_user'@'localhost' IDENTIFIED BY 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON eglise_predications.* TO 'eglise_user'@'localhost';
FLUSH PRIVILEGES;
```

## ⚙️ Installation

### 1. Cloner le projet

```bash
cd "C:\Personnel Projet\Église"
```

### 2. Backend

```bash
cd backend
npm install
```

Créez un fichier `.env` à partir de `.env.example` :

```env
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=eglise_predications
YOUTUBE_API_KEY=votre_cle_api_youtube
YOUTUBE_CHANNEL_ID=id_de_la_chaîne_youtube
REDIS_URL=redis://localhost:6379
NODE_ENV=development
```

Initialisez la base de données :

```bash
npm run migrate
```

### 3. Frontend

```bash
cd ../frontend
npm install
```

Créez un fichier `.env` à partir de `.env.example` :

```env
VITE_API_URL=http://localhost:3001
```

## 🚀 Démarrage

### Développement

**Terminal 1 - Backend :**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend :**
```bash
cd frontend
npm run dev
```

Le site sera accessible sur `http://localhost:5173`

### Synchronisation des vidéos YouTube

Dans un nouveau terminal :

```bash
cd backend
npm run refresh-videos
```

Cette commande va :
- Récupérer toutes les vidéos de votre chaîne YouTube
- Les ajouter dans la base de données
- Mettre à jour les vidéos existantes

⚠️ **Important** : Après la synchronisation, vous devrez associer manuellement les vidéos aux prédicateurs et thèmes via une interface admin (à créer) ou directement en base de données.

## 🐳 Déploiement avec Docker

### Prérequis
- Docker
- Docker Compose

### Configuration

1. Créez un fichier `.env` à la racine du projet :

```env
DB_PASSWORD=votre_mot_de_passe
DB_USER=eglise_user
DB_NAME=eglise_predications
YOUTUBE_API_KEY=votre_cle_api_youtube
YOUTUBE_CHANNEL_ID=id_de_la_chaîne_youtube
VITE_API_URL=http://localhost:3001
```

2. Lancez les conteneurs :

```bash
docker-compose up -d
```

3. Initialisez la base de données :

```bash
docker-compose exec backend npm run migrate
```

4. Synchronisez les vidéos :

```bash
docker-compose exec backend npm run refresh-videos
```

## 📝 Notes importantes

- La première synchronisation peut prendre du temps selon le nombre de vidéos
- Les vidéos doivent être associées manuellement aux prédicateurs et thèmes
- Pour créer des prédicateurs et thèmes, utilisez directement MySQL ou créez une interface admin

## 🔧 Dépannage

### Erreur de connexion à la base de données
- Vérifiez que MySQL est démarré
- Vérifiez les identifiants dans `.env`
- Vérifiez que la base de données existe

### Erreur YouTube API
- Vérifiez que votre clé API est valide
- Vérifiez que l'API YouTube Data API v3 est activée
- Vérifiez que l'ID de la chaîne est correct

### Erreur CORS
- Vérifiez que `FRONTEND_URL` dans le backend correspond à l'URL du frontend
- En développement, utilisez `http://localhost:5173`

