import http from 'http';
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

server.listen(PORT, () => {
  console.log(`🎮 MultiGames server listening on :${PORT}`);
});
