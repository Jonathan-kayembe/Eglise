# 📺 Module YouTube React - Instructions d'Installation

## 🎯 Vue d'ensemble

Ce module React affiche automatiquement les dernières vidéos YouTube de votre chaîne avec :
- ✅ Carrousel Swiper avec autoplay
- ✅ Grid responsive (3 colonnes → 2 → 1)
- ✅ Cards stylées avec hover effects
- ✅ Design moderne et premium
- ✅ Chargement avec skeleton loader
- ✅ Gestion d'erreurs

## 📦 Installation

### 1. Installer Swiper

```bash
cd frontend
npm install swiper
```

### 2. Configuration de l'API (SÉCURISÉ)

**⚠️ IMPORTANT SÉCURITÉ** : Les clés API YouTube ne doivent JAMAIS être exposées côté frontend.

Créez ou modifiez le fichier `.env` dans le dossier `frontend` :

```env
VITE_API_URL=http://localhost:3001
```

**Note** : Tous les appels à l'API YouTube passent maintenant par le backend pour des raisons de sécurité. La clé API est uniquement configurée côté serveur.

### 3. Redémarrer le serveur de développement

```bash
npm run dev
```

## 🚀 Utilisation

### Option 1 : Page dédiée (déjà configurée)

Le module est déjà intégré dans une page dédiée accessible via :
- Route : `/youtube`
- Fichier : `src/pages/YouTubePage.jsx`

### Option 2 : Intégrer dans une page existante

```jsx
import { YouTubeVideos } from '../components/YouTube/YouTubeVideos';

function MaPage() {
  return (
    <div>
      <h1>Mes Vidéos</h1>
      <YouTubeVideos maxResults={20} showCarousel={true} />
    </div>
  );
}
```

### Option 3 : Utiliser uniquement le carrousel

```jsx
import { VideoCarousel } from '../components/YouTube/VideoCarousel';
import { youtubeService } from '../services/youtubeService';
import { useState, useEffect } from 'react';

function MonComposant() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    youtubeService.fetchLatestVideos(8).then(setVideos);
  }, []);

  return <VideoCarousel videos={videos} />;
}
```

### Option 4 : Utiliser uniquement une card

```jsx
import { VideoCard } from '../components/YouTube/VideoCard';

function MonComposant() {
  const video = {
    videoId: 'abc123',
    title: 'Titre de la vidéo',
    description: 'Description...',
    thumbnail: 'https://...',
    publishedAt: '2024-01-01T00:00:00Z'
  };

  return <VideoCard video={video} />;
}
```

## 🎨 Personnalisation

### Modifier le nombre de vidéos

```jsx
<YouTubeVideos maxResults={30} showCarousel={true} />
```

### Désactiver le carrousel

```jsx
<YouTubeVideos maxResults={20} showCarousel={false} />
```

### Personnaliser les styles

Modifiez le fichier `src/components/YouTube/YouTubeVideos.css`

### Personnaliser le comportement du carrousel

Modifiez `src/components/YouTube/VideoCarousel.jsx` :

```jsx
<Swiper
  autoplay={{
    delay: 3000, // 3 secondes au lieu de 5
    disableOnInteraction: false,
  }}
  // ... autres options
/>
```

## 📁 Structure des fichiers

```
frontend/src/
├── services/
│   └── youtubeService.js          # Service API YouTube
├── components/
│   └── YouTube/
│       ├── YouTubeVideos.jsx       # Composant principal
│       ├── VideoCarousel.jsx       # Carrousel Swiper
│       ├── VideoCard.jsx           # Card individuelle
│       └── YouTubeVideos.css       # Styles CSS
└── pages/
    └── YouTubePage.jsx             # Page d'exemple
```

## 🔧 API YouTube Service

### Méthodes disponibles

```javascript
import { youtubeService } from '../services/youtubeService';

// Récupérer les dernières vidéos
const videos = await youtubeService.fetchLatestVideos(20);

// Récupérer les détails d'une vidéo
const details = await youtubeService.getVideoDetails('videoId');

// Formater une durée
const formatted = youtubeService.formatDuration(3665); // "1:01:05"
```

### Format des données

Chaque vidéo retournée contient :

```javascript
{
  videoId: "abc123",
  title: "Titre de la vidéo",
  description: "Description complète...",
  thumbnail: "https://i.ytimg.com/...",
  publishedAt: "2024-01-01T00:00:00Z",
  channelTitle: "Nom de la chaîne"
}
```

## 🎯 Fonctionnalités

### ✅ Carrousel Swiper
- Navigation avec flèches
- Pagination dynamique
- Autoplay (5 secondes)
- Pause au survol
- Responsive (4 → 3 → 2 → 1 colonnes)
- Touch/swipe sur mobile

### ✅ Grid responsive
- 3 colonnes desktop (≥1024px)
- 2 colonnes tablette (≥640px)
- 1 colonne mobile (<640px)
- Gap uniforme de 2rem

### ✅ Cards
- Ratio 16:9 respecté
- Hover effect (zoom + shadow)
- Bouton play au survol
- Bouton "Voir sur YouTube"
- Description tronquée (3 lignes max)

### ✅ États
- Skeleton loader pendant le chargement
- Message d'erreur avec bouton retry
- Message si aucune vidéo

## 🐛 Dépannage

### Erreur : "YOUTUBE_API_KEY n'est pas définie"

Cette erreur ne devrait plus se produire car les appels API passent par le backend.

Si vous rencontrez des erreurs :
1. Vérifiez que le backend est démarré et accessible
2. Vérifiez que `VITE_API_URL` est correctement configuré dans `frontend/.env`
3. Vérifiez que `YOUTUBE_API_KEY` est configuré dans `backend/.env` (côté serveur uniquement)
4. Redémarrez le serveur de développement

### Le carrousel ne s'affiche pas

1. Vérifiez que Swiper est installé : `npm list swiper`
2. Vérifiez que les imports CSS sont présents dans `VideoCarousel.jsx`
3. Vérifiez la console pour les erreurs

### Les vidéos ne se chargent pas

1. Vérifiez votre clé API YouTube
2. Vérifiez que l'ID de la chaîne est correct dans `youtubeService.js`
3. Vérifiez les quotas de l'API YouTube
4. Ouvrez la console du navigateur pour voir les erreurs

## 📝 Notes importantes

- **Quotas API** : L'API YouTube a des limites de requêtes (10000/jour par défaut)
- **CORS** : Les appels se font via le backend (proxy)
- **Sécurité** : ✅ La clé API est uniquement côté serveur, jamais exposée au client
- **Performance** : Les images sont chargées en lazy loading

## 🎨 Personnalisation avancée

### Changer les couleurs

Dans `YouTubeVideos.css`, modifiez :

```css
.video-card-button {
  background: #D4B98A; /* Votre couleur */
}
```

### Changer les breakpoints

Dans `VideoCarousel.jsx` :

```jsx
breakpoints={{
  768: { slidesPerView: 2 },  // Au lieu de 640
  1200: { slidesPerView: 4 },  // Au lieu de 1280
}}
```

## ✅ Checklist d'intégration

- [ ] Swiper installé (`npm install swiper`)
- [ ] Backend configuré avec `YOUTUBE_API_KEY` dans `backend/.env`
- [ ] Fichier `frontend/.env` créé avec `VITE_API_URL`
- [ ] Backend démarré et accessible
- [ ] Serveur frontend redémarré après modification du `.env`
- [ ] Route `/youtube` accessible
- [ ] Vidéos s'affichent correctement
- [ ] Carrousel fonctionne (flèches, pagination, autoplay)
- [ ] Grid responsive fonctionne
- [ ] Hover effects fonctionnent
- [ ] Mobile responsive

## 🚀 Prêt à l'emploi !

Le module est maintenant complètement fonctionnel et prêt à être utilisé dans votre application React.

