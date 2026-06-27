# Build complet : compile l'app web (Expo) + le serveur, et sert le tout depuis
# un seul conteneur. Resultat : http://<serveur> ouvre directement le jeu jouable
# dans le navigateur, et gere aussi les WebSockets (meme origine).

# --- Stage 1 : build de l'app web (Expo export) ---
FROM node:20-alpine AS web
WORKDIR /web
COPY mobile/package*.json ./
RUN npm ci
COPY mobile/ ./
# Sortie -> /web/dist
RUN npx expo export --platform web

# --- Stage 2 : build du serveur TypeScript ---
FROM node:20-alpine AS server
WORKDIR /srv
COPY server/package*.json ./
RUN npm ci
COPY server/tsconfig.json ./
COPY server/src ./src
COPY server/scripts ./scripts
# Sortie -> /srv/dist (+ copie des configs JSON dans dist/content)
RUN npm run build

# --- Runtime ---
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY --from=server /srv/dist ./dist
# L'app web (build) servie par le serveur
COPY --from=web /web/dist ./public
ENV PORT=4000
ENV PUBLIC_DIR=/app/public
EXPOSE 4000
# Healthcheck pour Coolify/Docker (busybox wget dispo dans alpine).
HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/health || exit 1
CMD ["node", "dist/index.js"]
