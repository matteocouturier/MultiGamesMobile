#!/usr/bin/env bash
# Déploiement en une commande sur un serveur (VPS) avec Docker.
# Usage sur ton serveur :  bash deploy.sh
# Idempotent : reconstruit l'image et relance proprement le conteneur.
set -euo pipefail

PORT_PUBLIC="${PORT_PUBLIC:-80}"   # port public (80 par défaut)
NAME="multigames"

# Se placer à la racine du repo (le Dockerfile racine compile l'app web + le serveur).
cd "$(dirname "$0")"

echo "==> Build de l'image Docker (app web + serveur)..."
docker build -t multigames-server .

echo "==> (Re)lancement du conteneur sur le port ${PORT_PUBLIC}..."
docker rm -f "$NAME" 2>/dev/null || true
docker run -d --name "$NAME" --restart unless-stopped -p "${PORT_PUBLIC}:4000" multigames-server

echo "==> Vérification /health..."
sleep 2
if curl -fsS "http://localhost:${PORT_PUBLIC}/health" >/dev/null; then
  echo "✅ Serveur en ligne sur le port ${PORT_PUBLIC}  (http://<IP_DU_SERVEUR>:${PORT_PUBLIC})"
else
  echo "⚠️  Le serveur ne répond pas encore — vérifie les logs : docker logs ${NAME}"
  exit 1
fi
