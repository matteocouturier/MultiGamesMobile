# Build complet : compile l'app web (Expo) + le serveur, et sert le tout depuis
# un seul conteneur. Résultat : http://<serveur> ouvre directement le jeu jouable
# dans le navigateur, et gère aussi les WebSockets (même origine).

# --- Stage 1 : build de l'app web (Expo export) ---
FROM node:20-alpine AS web
WORKDIR /web
COPY mobile/package*.json ./
RUN npm ci
COPY mobile/ ./
RUN npx expo export --platform web   # -> /web/dist

# --- Stage 2 : build du serveur TypeScript ---
FROM node:20-alpine AS server
WORKDIR /srv
COPY server/package*.json ./
RUN npm ci
COPY server/tsconfig.json ./
COPY server/src ./src
RUN npm run build                    # -> /srv/dist

# --- Runtime ---
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY --from=server /srv/dist ./dist
COPY --from=web /web/dist ./public   # l'app web servie par le serveur
ENV PORT=4000
ENV PUBLIC_DIR=/app/public
EXPOSE 4000
CMD ["node", "dist/index.js"]
