#!/usr/bin/env bash
# Déploie MultiGames en HTTPS sur ton domaine (Caddy + app, certificat auto).
# Prérequis : 644.fr pointe vers ce serveur, ports 80 et 443 ouverts.
set -euo pipefail
cd "$(dirname "$0")"

echo "==> Arrêt de l'ancien conteneur HTTP (port 8080), s'il existe..."
docker rm -f multigames 2>/dev/null || true

echo "==> Vérification des ports 80 / 443..."
if command -v ss >/dev/null && ss -tlnp 2>/dev/null | grep -qE ':(80|443) '; then
  echo "⚠️  Un service occupe déjà le port 80 ou 443 :"
  ss -tlnp 2>/dev/null | grep -E ':(80|443) ' || true
  echo "   Caddy a besoin de 80 ET 443 pour le HTTPS. Libère-les (stoppe le service"
  echo "   concerné) puis relance ce script."
  exit 1
fi

echo "==> Build + lancement du stack HTTPS (Caddy + app)..."
docker compose up -d --build

echo ""
echo "✅ Stack lancé. Caddy récupère le certificat pour 644.fr (≈ 10-30 s)."
echo "   Test :   curl -I https://644.fr/health"
echo "   Logs :   docker compose logs -f caddy"
echo ""
echo "Ensuite l'app est sur  https://644.fr  (sans le :8080)."
