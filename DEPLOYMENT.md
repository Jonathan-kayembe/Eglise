# Guide de Déploiement

## 🌐 Options de déploiement

### Option 1 : Vercel (Frontend) + Render/Railway (Backend)

#### Frontend sur Vercel

1. Installez Vercel CLI :
```bash
npm i -g vercel
```

2. Dans le dossier `frontend` :
```bash
vercel
```

3. Configurez les variables d'environnement dans Vercel :
- `VITE_API_URL` : URL de votre backend

#### Backend sur Render/Railway

1. Créez un compte sur [Render](https://render.com) ou [Railway](https://railway.app)

2. Créez une nouvelle base de données MySQL

3. Créez un nouveau service Web :
   - Build Command : `npm install`
   - Start Command : `npm start`
   - Variables d'environnement :
     ```
     PORT=3001
     DB_HOST=votre_host_mysql
     DB_USER=votre_user
     DB_PASSWORD=votre_password
     DB_NAME=eglise_predications
     YOUTUBE_API_KEY=votre_cle
     YOUTUBE_CHANNEL_ID=votre_channel_id
     NODE_ENV=production
     ```

4. Exécutez la migration :
```bash
npm run migrate
```

5. Synchronisez les vidéos :
```bash
npm run refresh-videos
```

### Option 2 : DigitalOcean App Platform

1. Créez un compte DigitalOcean

2. Créez une base de données MySQL gérée

3. Créez deux apps :
   - **Backend** :
     - Source : GitHub repo
     - Build Command : `cd backend && npm install`
     - Run Command : `cd backend && npm start`
     - Variables d'environnement : (voir ci-dessus)
   
   - **Frontend** :
     - Source : GitHub repo
     - Build Command : `cd frontend && npm install && npm run build`
     - Output Directory : `frontend/dist`
     - Variables d'environnement :
       - `VITE_API_URL` : URL du backend

### Option 3 : VPS (Ubuntu/Debian)

#### Installation sur un VPS

1. Connectez-vous à votre serveur :
```bash
ssh user@votre-serveur
```

2. Installez les dépendances :
```bash
sudo apt update
sudo apt install -y nodejs npm mysql-server nginx
```

3. Configurez MySQL :
```bash
sudo mysql_secure_installation
sudo mysql -u root -p
```

```sql
CREATE DATABASE eglise_predications CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'eglise_user'@'localhost' IDENTIFIED BY 'mot_de_passe_securise';
GRANT ALL PRIVILEGES ON eglise_predications.* TO 'eglise_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

4. Clonez le projet :
```bash
cd /var/www
git clone votre-repo eglise
cd eglise
```

5. Configurez le backend :
```bash
cd backend
npm install --production
cp .env.example .env
# Éditez .env avec vos valeurs
npm run migrate
npm run refresh-videos
```

6. Configurez PM2 pour le backend :
```bash
sudo npm install -g pm2
pm2 start server.js --name eglise-backend
pm2 save
pm2 startup
```

7. Configurez Nginx pour le frontend :
```bash
cd ../frontend
npm install
npm run build
```

8. Créez la configuration Nginx :
```bash
sudo nano /etc/nginx/sites-available/eglise
```

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    # Frontend
    location / {
        root /var/www/eglise/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

9. Activez le site :
```bash
sudo ln -s /etc/nginx/sites-available/eglise /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

10. Configurez SSL avec Let's Encrypt :
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com
```

## 🔄 Mise à jour

### Mise à jour des vidéos

```bash
cd backend
npm run refresh-videos
```

Ou avec Docker :
```bash
docker-compose exec backend npm run refresh-videos
```

### Mise à jour du code

1. Pull les dernières modifications :
```bash
git pull
```

2. Rebuild et redémarrez :
```bash
# Backend
cd backend
npm install
pm2 restart eglise-backend

# Frontend
cd ../frontend
npm install
npm run build
sudo systemctl reload nginx
```

## 📊 Monitoring

### PM2 Monitoring

```bash
pm2 monit
pm2 logs eglise-backend
```

### Logs Nginx

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 🔐 Sécurité

- Utilisez des mots de passe forts
- Activez le firewall :
```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

- Mettez à jour régulièrement :
```bash
sudo apt update && sudo apt upgrade -y
```

- Configurez des backups automatiques de la base de données

