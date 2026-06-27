#!/usr/bin/env bash
# Déploie MultiGames en HTTPS DERRIÈRE le nginx déjà présent sur le serveur.
# - (re)build + lance l'app dans Docker sur 127.0.0.1:8080
# - installe le vhost nginx pour 644.fr
# - obtient le certificat Let's Encrypt via certbot (--nginx)
#
# À lancer en root, depuis le dossier du repo : bash deploy-nginx.sh
set -euo pipefail
cd "$(dirname "$0")"

DOMAIN="644.fr"
EMAIL="matteocouturier@gmail.com"

echo "==> 1/4 Build + lancement de l'app sur 127.0.0.1:8080 ..."
docker build -t multigames-server .
docker rm -f multigames 2>/dev/null || true
docker run -d --name multigames --restart unless-stopped -p 127.0.0.1:8080:4000 multigames-server
sleep 2
curl -fsS http://127.0.0.1:8080/health >/dev/null && echo "    app OK (127.0.0.1:8080)"

echo "==> 2/4 Installation du vhost nginx ..."
if [ -d /etc/nginx/sites-available ]; then
  cp nginx/644.fr.conf /etc/nginx/sites-available/644.fr.conf
  ln -sf /etc/nginx/sites-available/644.fr.conf /etc/nginx/sites-enabled/644.fr.conf
else
  cp nginx/644.fr.conf /etc/nginx/conf.d/644.fr.conf
fi

echo "==> 3/4 Test + rechargement de nginx ..."
nginx -t
systemctl reload nginx || service nginx reload

echo "==> 4/4 Certificat HTTPS (certbot) ..."
if ! command -v certbot >/dev/null; then
  echo "    Installation de certbot..."
  apt-get update -y && apt-get install -y certbot python3-certbot-nginx
fi
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect

echo ""
echo "✅ Terminé ! Ton app est sur https://$DOMAIN"
echo "   Test : curl -I https://$DOMAIN/health"
