import http from 'http';
import path from 'path';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from './shared/events';
import { attachSocketServer } from './socket';
import { registerGames } from './games';

const PORT = Number(process.env.PORT) || 4000;

registerGames();

const app = express();
app.use(cors());
app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

const server = http.createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
  server,
  {
    cors: { origin: '*' },
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true,
    },
  }
);

const manager = attachSocketServer(io);

app.get('/stats', (_req, res) => res.json(manager.stats()));

// Serve the compiled web app (Expo web export) if it's bundled with the server.
// This makes the game playable directly in the browser from the same origin —
// no separate hosting, no app install. Falls back to a status page in dev.
const PUBLIC_DIR = process.env.PUBLIC_DIR || path.join(__dirname, '..', 'public');
const hasWebApp = fs.existsSync(path.join(PUBLIC_DIR, 'index.html'));

if (hasWebApp) {
  app.use(express.static(PUBLIC_DIR));
  // SPA fallback: any non-API route returns the app shell.
  app.get('*', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));
} else {
  app.get('/', (_req, res) => {
    const { rooms, players } = manager.stats();
    res.type('html').send(`<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>MultiGames · Serveur</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
    font-family:system-ui,-apple-system,sans-serif;background:#0E0B1E;color:#F4F2FF}
  .card{background:#1C1736;border:1px solid #2E2858;border-radius:24px;padding:40px;
    text-align:center;max-width:380px;box-shadow:0 8px 32px rgba(0,0,0,.4)}
  h1{font-size:42px;margin:0 0 4px} .tag{color:#A39FC4;margin-bottom:24px}
  .dot{color:#34C759} .stats{display:flex;gap:24px;justify-content:center;margin-top:8px}
  .stat b{font-size:28px;color:#7C5CFF;display:block} .stat span{color:#A39FC4;font-size:13px}
</style></head><body><div class="card">
  <h1>🎲 MultiGames</h1>
  <div class="tag"><span class="dot">●</span> Serveur en ligne</div>
  <div class="stats">
    <div class="stat"><b>${rooms}</b><span>salons actifs</span></div>
    <div class="stat"><b>${players}</b><span>joueurs connectés</span></div>
  </div>
</div></body></html>`);
  });
}

server.listen(PORT, () => {
  console.log(`🎮 MultiGames server listening on :${PORT}`);
});
