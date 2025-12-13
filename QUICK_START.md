# 🚀 Démarrage Rapide

## Installation en 5 minutes

### 1. Prérequis
- Node.js 18+ installé
- MySQL 8+ installé et démarré
- Clé API YouTube Data API v3

### 2. Configuration Backend

```bash
cd backend
npm install

# Créer le fichier .env (copiez env.example.txt et renommez-le en .env)
# Éditez .env avec vos valeurs :
# - DB_PASSWORD
# - YOUTUBE_API_KEY
# - YOUTUBE_CHANNEL_ID

# Créer la base de données
npm run migrate

# Synchroniser les vidéos YouTube
npm run refresh-videos
```

### 3. Configuration Frontend

```bash
cd ../frontend
npm install

# Créer le fichier .env
echo "VITE_API_URL=http://localhost:3001" > .env
```

### 4. Démarrer l'application

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

### 5. Accéder au site

Ouvrez votre navigateur sur : `http://localhost:5173`

## 📝 Prochaines étapes

1. **Créer des prédicateurs** : Insérez des données dans la table `preachers`
2. **Créer des thèmes** : Insérez des données dans la table `themes`
3. **Associer les vidéos** : Mettez à jour `preacher_id` et `theme_id` dans la table `videos`

### Exemple SQL pour créer un prédicateur

```sql
INSERT INTO preachers (name, slug, bio, photo, background_images)
VALUES (
  'Pasteur Jean Dupont',
  'pasteur-jean-dupont',
  'Biographie du pasteur...',
  'https://example.com/photo.jpg',
  '["https://example.com/bg1.jpg", "https://example.com/bg2.jpg"]'
);
```

### Exemple SQL pour créer un thème

```sql
INSERT INTO themes (name, slug, description, color)
VALUES (
  'Amour',
  'amour',
  'Prédications sur le thème de l\'amour',
  '#D4B98A'
);
```

### Exemple SQL pour associer une vidéo

```sql
UPDATE videos 
SET preacher_id = 1, theme_id = 1 
WHERE id = 1;
```

## 🎨 Personnalisation

- **Couleurs** : Modifiez `frontend/tailwind.config.js`
- **Traductions** : Modifiez `frontend/src/i18n/locales/`
- **Styles** : Modifiez `frontend/src/index.css`

## 🐛 Dépannage

### Le backend ne démarre pas
- Vérifiez que MySQL est démarré
- Vérifiez les identifiants dans `.env`
- Vérifiez que la base de données existe

### Les vidéos ne se chargent pas
- Vérifiez votre clé API YouTube
- Vérifiez l'ID de la chaîne YouTube
- Vérifiez les logs : `npm run refresh-videos`

### Erreur CORS
- Vérifiez que `FRONTEND_URL` dans le backend correspond à l'URL du frontend
- En développement : `http://localhost:5173`

## 📚 Documentation complète

- `README.md` - Vue d'ensemble
- `INSTALLATION.md` - Guide d'installation détaillé
- `DEPLOYMENT.md` - Guide de déploiement
- `ARCHITECTURE.md` - Architecture du projet

