# Analyse Complète du Projet - Site de Prédication de l'Église

## Vue d'ensemble

Ce projet est une plateforme simple et moderne pour le **Tabernacle Chrétien d'Ottawa** qui permet de présenter l'église et d'afficher les prédications YouTube. Les visiteurs peuvent facilement voir et rechercher les vidéos.

L'application est construite avec une architecture **frontend/backend** séparée.

### Technologies principales
- **Frontend** : React + Vite, React Router, TailwindCSS, Framer Motion, i18next (FR/EN)
- **Backend** : Node.js + Express, MySQL, YouTube Data API v3
- **Déploiement** : Docker, Docker Compose

---

## PAGES DU FRONTEND

### 1. Page d'Accueil (`/`)
**Fichier** : `frontend/src/pages/HomePage.jsx`

#### Fonctionnalités :
- Affichage du logo de l'église
- Verset biblique (Hébreux 13:8)
- Message de bienvenue
- Section "Services" avec 4 services :
  - Service du dimanche (10h00-13h00)
  - Service du Vendredi (19h00-21h00)
  - Service en ligne (Mardi et jeudi à 19h00)
  - École du dimanche (9h30-10h00)
- Section "Prédications" avec :
  - Barre de recherche intégrée
  - Carrousel de vidéos (5 premières, seulement sans recherche)
  - Grille de vidéos avec pagination (12 vidéos par page)
  - Affichage des résultats de recherche
  - Navigation entre pages
- Gestion des erreurs et états de chargement

---

### 2. Page Vidéo (`/video/:id`)
**Fichier** : `frontend/src/pages/VideoPage.jsx`

#### Fonctionnalités :
- Lecteur YouTube intégré (iframe)
- Informations de la vidéo :
  - Titre
  - Date de publication
  - Prédicateur (lien cliquable si disponible)
  - Thème (badge coloré si disponible)
  - Description nettoyée
  - Tags (hashtags)
- Description standard de l'église
- Sidebar avec vidéos suggérées (6 vidéos)
- Bouton retour
- Formatage des dates selon la langue

---

## COMPOSANTS RÉUTILISABLES

### Composants principaux :
1. **Header** - Navigation principale avec changement de langue (Accueil, Vidéos)
2. **Footer** - Pied de page avec informations
3. **VideoCard** - Carte d'affichage d'une vidéo
4. **VideoCarousel** - Carrousel de vidéos avec navigation
5. **VideoGrid** - Grille de vidéos avec pagination
6. **SearchBar** - Barre de recherche
7. **LoaderSkeleton** - Squelette de chargement
8. **SEO** - Gestion des métadonnées SEO

---

## API ENDPOINTS (BACKEND)

### 1. Vidéos (`/api/videos`)

#### `GET /api/videos`
- Liste des vidéos avec pagination et filtres
- **Paramètres** :
  - `limit` : Nombre de résultats (1-100)
  - `page` : Numéro de page
  - `preacher` : ID du prédicateur
  - `theme` : ID du thème
  - `q` : Terme de recherche
  - `sort` : Ordre de tri (asc/desc)
- **Retour** : Liste paginée de vidéos

#### `GET /api/videos/:id`
- Détails d'une vidéo par ID
- **Retour** : Objet vidéo complet

#### `GET /api/videos/:id/suggested`
- Vidéos suggérées pour une vidéo
- **Retour** : Liste de 6 vidéos suggérées

#### `POST /api/videos/sync`
- Synchroniser les vidéos depuis YouTube
- **Fonctionnalités** :
  - Récupère toutes les vidéos de la chaîne YouTube
  - Extrait les tags depuis les hashtags
  - Extrait les dates depuis les titres
  - Insère ou met à jour dans la base de données
- **Retour** : Statistiques (créées, mises à jour, erreurs)

---

### 2. Prédicateurs (`/api/preachers`)

#### `GET /api/preachers`
- Liste de tous les prédicateurs
- **Retour** : Liste avec nombre de vidéos par prédicateur

#### `GET /api/preachers/:slug`
- Détails d'un prédicateur par slug
- **Retour** : Objet prédicateur complet

#### `GET /api/preachers/:slug/videos`
- Vidéos d'un prédicateur
- **Paramètres** :
  - `limit` : Nombre de résultats (1-100)
  - `page` : Numéro de page
- **Retour** : Liste paginée de vidéos

---

### 3. Thèmes (`/api/themes`)

#### `GET /api/themes`
- Liste de tous les thèmes
- **Retour** : Liste de tous les thèmes

#### `GET /api/themes/:slug`
- Détails d'un thème par slug
- **Retour** : Objet thème complet

#### `GET /api/themes/:slug/videos`
- Vidéos d'un thème
- **Paramètres** :
  - `limit` : Nombre de résultats (1-100)
  - `page` : Numéro de page
- **Retour** : Liste paginée de vidéos

---

### 4. Recherche (`/api/search`)

#### `GET /api/search`
- Recherche globale dans vidéos, prédicateurs et thèmes
- **Paramètres** :
  - `q` : Terme de recherche (requis)
  - `limit` : Nombre de résultats (1-100)
  - `page` : Numéro de page
- **Fonctionnalités** :
  - Recherche dans les titres et descriptions de vidéos
  - Recherche fuzzy dans les noms de prédicateurs
  - Recherche fuzzy dans les noms de thèmes
  - Normalisation des accents
- **Retour** : Objet avec `videos`, `preachers`, `themes`

---

### 5. Playlists (`/api/playlists`)

#### `GET /api/playlists`
- Liste toutes les playlists
- **Paramètres** :
  - `featured` : Filtrer les playlists mises en avant
  - `type` : Filtrer par type (preacher, theme, custom)
- **Retour** : Liste de playlists

#### `GET /api/playlists/:slug`
- Détails d'une playlist par slug
- **Retour** : Objet playlist complet

#### `GET /api/playlists/:slug/videos`
- Vidéos d'une playlist
- **Paramètres** :
  - `limit` : Nombre de résultats (1-100)
  - `page` : Numéro de page
- **Retour** : Playlist + liste paginée de vidéos

#### `POST /api/playlists/sync`
- Synchronise les playlists automatiques
- **Fonctionnalités** :
  - Crée des playlists pour chaque prédicateur
  - Crée des playlists pour chaque thème
  - Met à jour les playlists existantes
- **Retour** : Statistiques de synchronisation

---

### 6. Santé (`/health`)
- Endpoint de santé pour vérifier que le serveur fonctionne
- **Retour** : `{ status: 'OK', timestamp: ... }`

---

## SCRIPTS BACKEND

### Scripts de gestion des vidéos :
1. **`npm run refresh-videos`** - Synchronise les vidéos depuis YouTube
2. **`npm run create-db`** - Crée la base de données
3. **`npm run migrate`** - Exécute les migrations

### Scripts de gestion des prédicateurs :
1. **`npm run list-preachers`** - Liste tous les prédicateurs
2. **`npm run auto-assign-preachers`** - Mode test : analyse les titres pour extraire les prédicateurs
3. **`npm run auto-assign-preachers:apply`** - Applique l'extraction automatique des prédicateurs
4. **`npm run clean-preachers`** - Mode test : détecte les doublons de prédicateurs
5. **`npm run clean-preachers:apply`** - Fusionne les doublons de prédicateurs
6. **`npm run add-preacher`** - Ajoute un prédicateur manuellement
7. **`npm run find-preacher-videos`** - Trouve les vidéos d'un prédicateur
8. **`npm run fix-preacher-name`** - Corrige le nom d'un prédicateur
9. **`npm run merge-duplicates`** - Fusionne les doublons
10. **`npm run quick-merge`** - Fusion rapide de doublons
11. **`npm run count-preacher-videos`** - Compte les vidéos par prédicateur
12. **`npm run diagnose-preacher`** - Diagnostique les problèmes de prédicateurs

### Scripts d'analyse :
1. **`npm run analyze-titles`** - Analyse les titres de vidéos
2. **`npm run assign-preacher`** - Assigne un prédicateur à des vidéos

---

## FONCTIONNALITÉS AVANCÉES

### 1. Internationalisation (i18n)
- Support FR/EN
- Détection automatique de la langue
- Changement de langue dans le header
- Formatage des dates selon la langue

### 2. Performance
- Code splitting avec React.lazy()
- Lazy loading des images
- Pagination pour réduire les chargements
- Optimisation des requêtes API

### 3. Sécurité
- Rate limiting (100 requêtes / 15 min)
- Helmet.js pour les headers de sécurité
- Validation des inputs avec express-validator
- CORS configuré
- Variables d'environnement pour les secrets

### 4. Design
- Palette de couleurs premium (Beige, Or, Noir)
- Typographies élégantes (Playfair Display, Inter)
- Animations fluides avec Framer Motion
- Responsive design (mobile, tablette, desktop)
- Effets visuels modernes

---

## STRUCTURE DE LA BASE DE DONNÉES

### Tables principales :
1. **videos** - Vidéos YouTube synchronisées
2. **preachers** - Prédicateurs
3. **themes** - Thèmes de prédication
4. **playlists** - Playlists (automatiques et personnalisées)
5. **playlist_videos** - Relation many-to-many entre playlists et vidéos

### Relations :
- `videos.preacher_id` → `preachers.id`
- `videos.theme_id` → `themes.id`
- `playlist_videos.playlist_id` → `playlists.id`
- `playlist_videos.video_id` → `videos.id`

---

## DÉPLOIEMENT

### Docker
- Dockerfile pour frontend (Nginx)
- Dockerfile pour backend (Node.js)
- docker-compose.yml pour orchestrer les services

### Variables d'environnement requises :
- **Backend** : PORT, DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, YOUTUBE_API_KEY, YOUTUBE_CHANNEL_ID
- **Frontend** : VITE_API_URL

---

## DOCUMENTATION DISPONIBLE

1. **README.md** - Guide principal
2. **GUIDE_ASSOCIATION_PREDICATEURS.md** - Guide d'extraction automatique des prédicateurs
3. **GUIDE_NETTOYAGE_PREDICATEURS.md** - Guide de nettoyage des doublons
4. **GUIDE_PLAYLISTS.md** - Guide de gestion des playlists
5. **CONFIGURATION.md** - Guide de configuration
6. **DEPLOYMENT.md** - Guide de déploiement
7. **QUICK_START.md** - Guide de démarrage rapide
8. **SYNC_VIDEOS.md** - Guide de synchronisation des vidéos

---

## RÉSUMÉ DES FONCTIONNALITÉS

### Frontend :
- 2 pages principales (Accueil, Vidéo)
- Recherche intégrée sur la page d'accueil
- Pagination des vidéos
- Internationalisation (FR/EN)
- Design premium et responsive

### Backend :
- 6 groupes de routes API
- Synchronisation YouTube
- Extraction automatique de prédicateurs
- Gestion des playlists automatiques
- Recherche fuzzy
- Validation et sécurité
- 20+ scripts utilitaires

### Infrastructure :
- Docker support
- MySQL database
- YouTube Data API v3
- Rate limiting
- Error handling

---

*Document généré le : {{ date }}*
