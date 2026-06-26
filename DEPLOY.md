# 🚀 Déploiement

Le serveur (`server/`) écoute sur `process.env.PORT` (défaut 4000), expose `/health`
et accepte les WebSockets (Socket.IO). Voici plusieurs façons de l'héberger.

---

## Option A — Ton propre VPS (Ubuntu) avec Docker  ✅ recommandé si tu as un serveur

En SSH sur ton serveur :

```bash
# 1. Installer Docker (si absent)
curl -fsSL https://get.docker.com | sh

# 2. Récupérer le code
git clone https://github.com/matteocouturier/MultiGamesMobile.git
cd MultiGamesMobile/server

# 3. Builder et lancer (port 80 public -> 4000 interne)
docker build -t multigames-server .
docker run -d --name multigames --restart unless-stopped -p 80:4000 multigames-server

# 4. Vérifier
curl http://localhost/health     # -> {"ok":true,...}
```

Ton serveur est joignable sur `http://IP_DU_SERVEUR`. Pour le mettre à jour :
```bash
cd MultiGamesMobile && git pull
cd server && docker build -t multigames-server . \
 && docker rm -f multigames \
 && docker run -d --name multigames --restart unless-stopped -p 80:4000 multigames-server
```

### HTTPS + nom de domaine (recommandé pour la prod)
Avec un domaine pointant vers ton serveur, mets un reverse proxy Caddy (HTTPS auto) :
```bash
sudo apt install -y caddy
echo 'ton-domaine.com {
    reverse_proxy localhost:4000
}' | sudo tee /etc/caddy/Caddyfile
sudo systemctl restart caddy
docker run -d --name multigames --restart unless-stopped -p 4000:4000 multigames-server
```
→ Le serveur est servi en `https://ton-domaine.com` (Socket.IO en wss:// inclus).

---

## Option B — Ton VPS sans Docker (Node + PM2)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash - && sudo apt install -y nodejs
git clone https://github.com/matteocouturier/MultiGamesMobile.git
cd MultiGamesMobile/server
npm ci && npm run build
sudo npm i -g pm2
PORT=4000 pm2 start dist/index.js --name multigames
pm2 startup && pm2 save        # redémarrage auto au boot
```
Mets ensuite Caddy/Nginx devant pour le HTTPS (cf. Option A).

---

## Option C — Plateformes 1-clic (pas de serveur à gérer)

- **Render** : repo déjà prêt via `render.yaml`. Sur render.com → New → Blueprint →
  choisis ce repo. Build Docker automatique, URL `https://...onrender.com`.
- **Railway** : New Project → Deploy from GitHub → Root directory = `server`.
  Détecte le Dockerfile tout seul.
- **Fly.io** : `cd server && fly launch --copy-config --now` (config dans `fly.toml`,
  change le nom d'app avant). Déploiements suivants : `fly deploy`.

---

## Brancher l'app mobile sur le serveur déployé

Une fois l'URL connue (ex. `https://multigames.onrender.com`), pointe le mobile dessus.
Deux façons :

- **Variable d'env** (recommandé) : lance Expo avec
  `EXPO_PUBLIC_SERVER_URL=https://ton-serveur npm start`
- **ou** édite `mobile/app.json` → `expo.extra.serverUrl`.

> En prod, utilise une URL **https://** : Socket.IO passera automatiquement en
> WebSocket sécurisé (wss://).

### Publier l'app mobile elle-même
L'app Expo se teste/distribue via **EAS** (Expo Application Services) :
```bash
cd mobile
npm i -g eas-cli && eas login
eas update            # diffuse une version testable dans Expo Go (lien/QR)
# plus tard, pour les stores :
eas build -p android  # / -p ios
```
