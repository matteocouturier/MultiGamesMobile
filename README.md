# 🎲 MultiGames Mobile

Application mobile de **mini-jeux multijoueurs en temps réel**. On arrive, on entre
un pseudo (mode invité), on choisit un mini-jeu, on **crée** ou **rejoint** un salon
via un **code à 6 lettres**, et quand le nombre minimal de joueurs est atteint, l'hôte
**lance la partie**.

Le projet est construit autour d'un **moteur de salons générique et extensible** :
ajouter un nouveau jeu = ajouter un module, sans toucher au cœur.

## 🏗️ Architecture

```
MultiGamesMobile/
├── server/                  # Moteur temps réel (Node.js + TypeScript + Socket.IO)
│   ├── src/
│   │   ├── core/            # Le MOTEUR (agnostique des jeux et des sockets)
│   │   │   ├── game.ts       #  - contrat des plugins de jeu (GameModule/GameInstance)
│   │   │   ├── registry.ts   #  - registre des jeux
│   │   │   ├── Room.ts        #  - lobby, équipes, cycle de vie d'une partie
│   │   │   ├── RoomManager.ts #  - création/jointure, codes, mapping joueur→salon
│   │   │   └── transport.ts   #  - abstraction réseau (découple du socket.io)
│   │   ├── games/           # Les JEUX (un dossier par jeu)
│   │   │   └── guessTheWord/  #  - jeu d'exemple "Devine le mot"
│   │   ├── shared/          # Contrat partagé (types + events Socket.IO typés)
│   │   ├── socket.ts        # Câblage Socket.IO ↔ moteur
│   │   └── index.ts         # Bootstrap HTTP + Socket.IO
│   └── test/e2e.test.ts     # Test bout-en-bout du moteur (4 joueurs)
│
└── mobile/                  # App Expo (React Native + TypeScript)
    └── src/
        ├── shared/          # Miroir de server/src/shared (source unique du contrat)
        ├── net/socket.ts    # Client Socket.IO
        ├── state/store.tsx  # State global (React Context)
        ├── components/      # UI réutilisable (Button, Card, Pill…)
        ├── screens/         # NameScreen, HomeScreen, LobbyScreen, GameScreen, ResultsScreen
        └── games/           # Vues de jeu côté client (miroir du registre serveur)
```

### Pourquoi c'est scalable
- Le **moteur** (`core/`) ne connaît aucun jeu en particulier : il gère salons,
  joueurs, équipes, timer et diffusion d'état. Il parle aux jeux via l'interface
  `GameInstance` et au réseau via `RoomTransport`.
- Chaque **jeu** est un module isolé qui implémente `GameModule` (métadonnées +
  fabrique d'instance). Il reçoit un `GameContext` pour diffuser l'état, émettre des
  événements, gérer des timers et terminer la partie.
- L'**état est calculé par joueur** (`getStateFor(playerId)`), ce qui permet de
  cacher des secrets (ex. le mot est masqué pour le devineur).
- L'état des salons est **en mémoire** par défaut (`RoomManager`) — couche isolée et
  remplaçable par Redis/une BDD plus tard sans toucher aux jeux ni au moteur.

## ▶️ Lancer le projet

### 1. Serveur
```bash
cd server
npm install
npm run dev          # démarre sur http://localhost:4000  (npm run build && npm start en prod)
```
Vérifs : `GET /health`, `GET /stats`.

### 2. App mobile
```bash
cd mobile
npm install
npm start            # Expo : scanne le QR code avec l'app Expo Go
```
> Sur téléphone physique, le client détecte automatiquement l'IP de ta machine de dev
> (via Expo) pour joindre le serveur sur le port 4000. Tu peux forcer l'URL avec la
> variable `EXPO_PUBLIC_SERVER_URL=http://TON_IP:4000`, ou via `mobile/app.json` →
> `extra.serverUrl`.

### 3. Tester le moteur (sans UI)
```bash
cd server
npx tsx test/e2e.test.ts   # simule 4 joueurs : create → join → start → jouer un tour
```

## 🎮 Jeu d'exemple : « Devine le mot »
- Équipes de 2 : un joueur **fait deviner** un mot, son coéquipier **devine**.
- **Chronomètre** + **score**, tours qui tournent entre les équipes.
- L'équipe adverse **arbitre** : `Trouvé` (+1), `Passer`, ou `Faute`.
- Le mot est **visible** par le faiseur-deviner et les arbitres, **caché** au devineur.

## ➕ Ajouter un nouveau jeu (en 4 étapes)

1. **Serveur** — crée `server/src/games/monJeu/` avec :
   - une classe qui implémente `GameInstance` (`start`, `handleAction`,
     `getStateFor`, `onPlayerLeave`, `dispose`) ;
   - un `index.ts` exportant un `GameModule` (`definition` + `create(ctx)`).
2. **Serveur** — enregistre-le dans `server/src/games/index.ts` :
   `registry.register(monJeuModule)`.
3. **Mobile** — crée la vue `mobile/src/games/monJeu/MonJeuView.tsx` qui lit l'état
   renvoyé par `getStateFor`.
4. **Mobile** — déclare-la dans `mobile/src/games/registry.ts` :
   `'mon-jeu': MonJeuView`.

C'est tout : le jeu apparaît automatiquement dans le catalogue, le lobby gère le
nombre de joueurs / les équipes, et l'écran de jeu route vers ta vue.

## 🔌 Contrat Socket.IO (résumé)

**Client → Serveur** : `catalog:list`, `lobby:create`, `lobby:join`, `lobby:leave`,
`lobby:setTeam`, `lobby:start`, `lobby:rematch`, `game:action`.

**Serveur → Client** : `room:update`, `game:state`, `game:event`, `game:ended`,
`room:closed`, `error:msg`.

Tous typés dans `shared/events.ts` et `shared/types.ts`.

## 🛣️ Pistes suivantes
- Persistance (Redis pour les salons live, Postgres pour comptes/historique/scores).
- Reconnexion par identité stable (aujourd'hui basée sur la session socket).
- Nouveaux jeux (quiz, dessin, réactions…) via le système de plugins.
