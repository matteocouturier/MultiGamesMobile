#!/usr/bin/env bash
# (Re)déploie l'app derrière Plesk : build de l'image + lancement du conteneur
# sur 127.0.0.1:8080 (c'est nginx/Plesk qui l'expose en https://minigames.644.fr).
# Usage : bash deploy-plesk.sh
set -euo pipefail
cd "$(dirname "$0")"

echo "==> Build de l'image (app web + serveur)..."
docker build -t multigames-server .

echo "==> (Re)lancement du conteneur sur 127.0.0.1:8080..."
docker rm -f multigames 2>/dev/null || true
docker run -d --name multigames --restart unless-stopped -p 127.0.0.1:8080:4000 multigames-server

echo "==> Vérification..."
sleep 2
if curl -fsS http://127.0.0.1:8080/health >/dev/null; then
  echo "✅ En ligne : https://minigames.644.fr"
else
  echo "⚠️  Pas de réponse. Logs : docker logs multigames"
  exit 1
fi
