# ⚙️ Configuration

## Variables d'environnement configurées

Votre fichier `.env` dans le dossier `backend` a été créé avec :

- **Clé API YouTube** : ✅ Configurée
- **ID de la chaîne YouTube** : `UCRjaG7N4qnlMsRnejOkHuHQ`

## 📝 Prochaines étapes

### 1. Configurer la base de données

Modifiez le fichier `backend/.env` et mettez à jour :

```env
DB_PASSWORD=votre_mot_de_passe_mysql
DB_USER=root
```

### 2. Créer la base de données

```sql
CREATE DATABASE eglise_predications CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Initialiser les tables

```bash
cd backend
npm run migrate
```

### 4. Synchroniser les vidéos YouTube

```bash
npm run refresh-videos
```

Cette commande va :
- Récupérer toutes les vidéos de votre chaîne YouTube
- Les ajouter dans la base de données
- Prendre quelques minutes selon le nombre de vidéos

## 🔍 Vérification

Après la synchronisation, vous pouvez vérifier que les vidéos ont été importées :

```sql
SELECT COUNT(*) FROM videos;
SELECT title, youtube_id, published_at FROM videos ORDER BY published_at DESC LIMIT 10;
```

## ⚠️ Important

- Les vidéos seront importées **sans** prédicateur ni thème associé
- Vous devrez créer les prédicateurs et thèmes manuellement
- Ensuite, associez les vidéos via SQL ou une interface admin

Voir `QUICK_START.md` pour des exemples SQL.

