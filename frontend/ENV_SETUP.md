# Configuration des variables d'environnement

⚠️ **IMPORTANT SÉCURITÉ** : Les clés API YouTube ne doivent **JAMAIS** être exposées côté frontend.

## Configuration Frontend

Créez un fichier `.env` à la racine du dossier `frontend` avec la variable suivante :

```env
# URL de l'API backend
VITE_API_URL=http://localhost:3001
```

## Architecture Sécurisée

Tous les appels à l'API YouTube passent maintenant par le **backend** pour des raisons de sécurité :

- ✅ La clé API YouTube est uniquement configurée côté serveur (`backend/.env`)
- ✅ Le frontend communique uniquement avec le backend via `VITE_API_URL`
- ✅ Aucune clé API n'est exposée au client

## Configuration Backend

La clé API YouTube doit être configurée dans `backend/.env` :

```env
YOUTUBE_API_KEY=votre_cle_api_youtube
YOUTUBE_CHANNEL_ID=votre_channel_id
```

## Obtenir une clé API YouTube

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un projet ou sélectionnez un projet existant
3. Activez l'API YouTube Data API v3
4. Créez des identifiants (clé API)
5. Copiez la clé dans votre fichier `backend/.env` (pas dans le frontend !)

## Voir aussi

- `../SECURITE.md` : Guide complet de sécurité
- `backend/.env.example` : Modèle de configuration backend

