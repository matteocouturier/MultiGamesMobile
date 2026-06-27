#!/usr/bin/env bash
# Déclenche un déploiement Coolify depuis le terminal (Coolify récupère la
# dernière version du repo GitHub, rebuild et met en ligne).
#
# Pré-requis : un token API Coolify (Coolify → Keys & Tokens → API Tokens).
# Donne-le via la variable d'env COOLIFY_TOKEN :
#     export COOLIFY_TOKEN=ton_token        # (à mettre dans ~/.bashrc pour le garder)
#     bash coolify-deploy.sh
set -euo pipefail

COOLIFY_URL="http://85.215.156.85:8000/api/v1/deploy?uuid=mnpoy753mxl7ktfg8k5li6a3&force=true"

echo "==> Déclenchement du déploiement Coolify..."
if [ -n "${COOLIFY_TOKEN:-}" ]; then
  curl --fail-with-body -sS -X GET -H "Authorization: Bearer ${COOLIFY_TOKEN}" "$COOLIFY_URL"
else
  # Sans token (si l'endpoint l'autorise). Sinon, exporte COOLIFY_TOKEN.
  curl --fail-with-body -sS -X GET "$COOLIFY_URL"
fi
echo ""
echo "✅ Déploiement lancé. Suis l'avancement dans l'interface Coolify."
