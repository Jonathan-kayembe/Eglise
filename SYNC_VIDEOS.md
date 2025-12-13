# 🔄 Synchronisation des Vidéos YouTube



```bash
cd backend
npm run refresh-videos
```

Cette commande va :
-  Récupérer toutes les vidéos de votre chaîne YouTube
-  Ajouter les nouvelles vidéos dans la base de données
-  Mettre à jour les vidéos existantes (titre, description, vues, etc.)

## ⚠️ Important

- La synchronisation peut prendre plusieurs minutes selon le nombre de vidéos
- Les nouvelles vidéos seront ajoutées **sans** prédicateur ni thème associé
- Vous devrez associer manuellement les vidéos aux prédicateurs et thèmes après la synchronisation

## 🔄 Synchronisation automatique (Optionnel)

Pour automatiser la synchronisation, vous pouvez :

1. **Utiliser un cron job** (Linux/Mac) :
```bash
# Synchroniser toutes les heures
0 * * * * cd /chemin/vers/projet/backend && npm run refresh-videos
```

2. **Utiliser Task Scheduler** (Windows) :
   - Créez une tâche planifiée
   - Programmez l'exécution de `npm run refresh-videos`

3. **Utiliser un service cloud** (Heroku Scheduler, etc.)

## 📊 Vérifier les vidéos synchronisées

Après la synchronisation, vous pouvez vérifier dans votre base de données :

```sql
-- Compter le total de vidéos
SELECT COUNT(*) FROM videos;

-- Voir les 10 dernières vidéos
SELECT title, youtube_id, published_at 
FROM videos 
ORDER BY published_at DESC 
LIMIT 10;
```
