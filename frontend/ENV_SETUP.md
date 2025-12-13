# Configuration des variables d'environnement

Créez un fichier `.env` à la racine du dossier `frontend` avec les variables suivantes :

```env
# Clé API YouTube
# Obtenez votre clé sur : https://console.cloud.google.com/apis/credentials
VITE_YOUTUBE_API_KEY=ta_cle_api

# ID de la chaîne YouTube
# Format: UCRjaG7N4qnlMsRnejOkHuHQ
VITE_YOUTUBE_CHANNEL_ID=UCRjaG7N4qnlMsRnejOkHuHQ
```

## Instructions

1. Copiez le contenu ci-dessus dans un fichier `.env` à la racine du dossier `frontend`
2. Remplacez `ta_cle_api` par votre vraie clé API YouTube
3. Le `VITE_YOUTUBE_CHANNEL_ID` est déjà configuré par défaut dans le code, mais vous pouvez le personnaliser

## Obtenir une clé API YouTube

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un projet ou sélectionnez un projet existant
3. Activez l'API YouTube Data API v3
4. Créez des identifiants (clé API)
5. Copiez la clé dans votre fichier `.env`

