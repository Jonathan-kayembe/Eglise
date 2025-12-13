# Architecture du Projet

## 🏗️ Vue d'ensemble

Le projet est structuré en deux parties principales :
- **Frontend** : Application React avec Vite
- **Backend** : API REST avec Express et MySQL

## 📁 Structure détaillée

### Backend (`/backend`)

```
backend/
├── config/
│   └── database.js          # Configuration de la connexion MySQL
├── middleware/
│   └── validation.js         # Validation des requêtes
├── routes/
│   ├── videos.js            # Routes pour les vidéos
│   ├── preachers.js         # Routes pour les prédicateurs
│   ├── themes.js            # Routes pour les thèmes
│   └── search.js            # Route de recherche globale
├── services/
│   ├── youtubeService.js    # Intégration YouTube API
│   ├── videoService.js      # Logique métier vidéos
│   ├── preacherService.js   # Logique métier prédicateurs
│   └── themeService.js      # Logique métier thèmes
├── scripts/
│   ├── migrate.js           # Migration de la base de données
│   └── refreshVideos.js     # Synchronisation YouTube
├── server.js                # Point d'entrée
├── package.json
└── Dockerfile
```

### Frontend (`/frontend`)

```
frontend/
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── LanguageSwitcher.jsx
│   │   ├── BackgroundSlideshow/
│   │   │   └── BackgroundSlideshow.jsx
│   │   ├── VideoCard/
│   │   │   └── VideoCard.jsx
│   │   ├── SearchBar/
│   │   │   └── SearchBar.jsx
│   │   └── FilterBar/
│   │       └── FilterBar.jsx
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   ├── PreacherPage.jsx
│   │   ├── ThemePage.jsx
│   │   └── VideoPage.jsx
│   ├── api/
│   │   ├── client.js
│   │   ├── videos.js
│   │   ├── preachers.js
│   │   ├── themes.js
│   │   └── search.js
│   ├── i18n/
│   │   ├── config.js
│   │   └── locales/
│   │       ├── fr.json
│   │       └── en.json
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/
├── package.json
├── vite.config.js
├── tailwind.config.js
└── Dockerfile
```

## 🗄️ Base de données

### Schéma

#### Table `preachers`
- `id` (INT, PK)
- `name` (VARCHAR)
- `slug` (VARCHAR, UNIQUE)
- `bio` (TEXT)
- `photo` (VARCHAR)
- `background_images` (JSON)
- `created_at`, `updated_at` (TIMESTAMP)

#### Table `themes`
- `id` (INT, PK)
- `name` (VARCHAR)
- `slug` (VARCHAR, UNIQUE)
- `description` (TEXT)
- `color` (VARCHAR)
- `created_at`, `updated_at` (TIMESTAMP)

#### Table `videos`
- `id` (INT, PK)
- `youtube_id` (VARCHAR, UNIQUE)
- `title` (VARCHAR)
- `description` (TEXT)
- `thumbnail` (VARCHAR)
- `preacher_id` (INT, FK → preachers.id)
- `theme_id` (INT, FK → themes.id)
- `published_at` (DATETIME)
- `tags` (JSON)
- `duration` (INT)
- `view_count` (INT)
- `created_at`, `updated_at` (TIMESTAMP)

## 🔄 Flux de données

### Synchronisation YouTube

1. Script `refreshVideos.js` appelé
2. `youtubeService.js` récupère toutes les vidéos via YouTube API
3. Pour chaque vidéo :
   - Vérifie si elle existe déjà (par `youtube_id`)
   - Crée ou met à jour dans la base de données
   - Associe prédicateur/thème (manuellement ou automatiquement)

### Requête API typique

1. Client frontend fait une requête à `/api/videos`
2. Route `routes/videos.js` reçoit la requête
3. Validation via `middleware/validation.js`
4. Service `services/videoService.js` interroge la DB
5. Réponse JSON retournée au client

## 🎨 Design System

### Couleurs
- **Beige** : `#F5EEDF` - Fond principal
- **Blanc** : `#FFFFFF` - Cartes, texte
- **Or** : `#D4B98A` - Accents, boutons
- **Noir profond** : `#121212` - Texte principal

### Typographies
- **Titres** : Playfair Display (serif)
- **Corps** : Inter (sans-serif)

### Animations
- Transitions fluides (300-600ms)
- Fade-in / Slide-up
- Hover effects (scale, shadow)
- Respect de `prefers-reduced-motion`

## 🔐 Sécurité

- Clés API stockées côté serveur uniquement
- Rate limiting sur les endpoints
- Validation des inputs
- CORS configuré
- Helmet.js pour les headers de sécurité

## 🚀 Performance

- Pagination sur les listes
- Lazy loading des images
- Cache Redis (optionnel)
- Compression gzip
- Optimisation des requêtes SQL (indexes)

## 📱 Responsive

- Mobile-first design
- Breakpoints Tailwind :
  - `sm`: 640px
  - `md`: 768px
  - `lg`: 1024px
  - `xl`: 1280px

