# Site de Prédication de l'Église

Site web premium et moderne pour afficher toutes les prédications YouTube de la chaîne officielle, avec filtrage par prédicateur et thème, recherche avancée et pages dédiées.

## 🎨 Design

- Style premium inspiré Spotify/Apple Music
- Palette : Beige (#F5EEDF), Blanc (#FFFFFF), Or (#D4B98A), Noir (#121212)
- Typographies : Playfair Display / Cormorant pour titres, Inter / DM Sans pour texte
- Animations fluides avec Framer Motion

## 🏗️ Architecture

### Frontend
- React + Vite
- React Router
- TailwindCSS
- Framer Motion
- Axios
- i18next (FR/EN)

### Backend
- Node.js + Express
- MySQL
- YouTube Data API v3
- Redis (optionnel pour cache)

## 🚀 Installation

### Prérequis
- Node.js 18+
- MySQL 8+
- Redis (optionnel)
- Clé API YouTube Data API v3

### Configuration

1. **Cloner et installer les dépendances**

```bash
# Installer les dépendances frontend
cd frontend
npm install

# Installer les dépendances backend
cd ../backend
npm install
```

2. **Configurer les variables d'environnement**

Backend (`.env`):
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

Frontend (`.env`):
```env
VITE_API_URL=http://localhost:3001
```

3. **Initialiser la base de données**

```bash
cd backend
npm run migrate
```

4. **Synchroniser les vidéos YouTube**

```bash
cd backend
npm run refresh-videos
```

## 🎯 Utilisation

### Développement

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Production avec Docker

```bash
docker-compose up -d
```

## 📡 API Endpoints

### Vidéos
- `GET /api/videos` - Liste des vidéos (pagination, filtres)
- `GET /api/videos/:id` - Détails d'une vidéo
- `GET /api/search?q=...` - Recherche avancée

### Prédicateurs
- `GET /api/preachers` - Liste des prédicateurs
- `GET /api/preachers/:slug` - Détails d'un prédicateur

### Thèmes
- `GET /api/themes` - Liste des thèmes
- `GET /api/themes/:slug` - Détails d'un thème

## 🔧 Scripts

### Backend
- `npm run dev` - Développement avec nodemon
- `npm run start` - Production
- `npm run migrate` - Créer les tables
- `npm run refresh-videos` - Synchroniser les vidéos YouTube

### Frontend
- `npm run dev` - Développement
- `npm run build` - Build production
- `npm run preview` - Prévisualiser le build

## 🐳 Docker

Le projet inclut des Dockerfiles et docker-compose.yml pour un déploiement facile.

```bash
docker-compose up -d
```

## 📝 Structure du projet

```
.
├── frontend/              # Application React
│   ├── src/
│   │   ├── components/   # Composants réutilisables
│   │   ├── pages/        # Pages de l'application
│   │   ├── api/          # Clients API
│   │   └── i18n/         # Traductions
│   ├── public/
│   └── package.json
├── backend/               # API Express
│   ├── config/           # Configuration
│   ├── routes/           # Routes API
│   ├── services/         # Services métier
│   ├── scripts/          # Scripts utilitaires
│   └── package.json
├── docker-compose.yml     # Configuration Docker
├── README.md
├── INSTALLATION.md        # Guide d'installation
└── DEPLOYMENT.md          # Guide de déploiement
```

## 🔐 Sécurité

- ✅ Les clés API sont stockées côté serveur uniquement (jamais exposées au frontend)
- ✅ Rate limiting sur les endpoints API
- ✅ Validation des inputs
- ✅ Variables d'environnement pour les credentials
- ✅ Fichiers `.env` exclus de Git via `.gitignore`
- ✅ Fichiers `.env.example` avec valeurs fictives uniquement

📖 **Voir [SECURITE.md](SECURITE.md) pour le guide complet de sécurité et les bonnes pratiques**

## 📄 Licence

Propriétaire - Église

