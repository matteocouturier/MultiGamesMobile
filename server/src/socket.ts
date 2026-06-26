import { Server, Socket } from 'socket.io';
import {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from './shared/events';
import { RoomManager } from './core/RoomManager';
import { registry } from './core/registry';

type IO = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

const personalRoom = (playerId: string) => `player:${playerId}`;

/** Grace period before a disconnected player is dropped from the room. */
const DISCONNECT_GRACE_MS = 8000;

export function attachSocketServer(io: IO): RoomManager {
  // Transport bridges the engine to socket.io rooms. Per-player messages use a
  // personal room each socket joins on connection.
  const manager = new RoomManager((code) => ({
    roomUpdate: (state) => io.to(code).emit('room:update', state),
    gameState: (playerId, payload) => io.to(personalRoom(playerId)).emit('game:state', payload),
    gameEvent: (playerId, event) =>
      (playerId ? io.to(personalRoom(playerId)) : io.to(code)).emit('game:event', event),
    gameEnded: (results) => io.to(code).emit('game:ended', results),
    roomClosed: (reason) => io.to(code).emit('room:closed', reason),
  }));

  const pendingRemoval = new Map<string, NodeJS.Timeout>();

  io.on('connection', (socket: AppSocket) => {
    const playerId = socket.id;
    socket.data.playerId = playerId;
    socket.data.roomCode = null;
    socket.join(personalRoom(playerId));

    // Connection state recovery: a brief drop reconnects with the same id.
    if (socket.recovered) {
      const room = manager.getRoomOfPlayer(playerId);
      if (room) {
        const t = pendingRemoval.get(playerId);
        if (t) {
          clearTimeout(t);
          pendingRemoval.delete(playerId);
        }
        manager.setConnected(playerId, true);
        socket.join(room.code);
        socket.data.roomCode = room.code;
        room.syncPlayer(playerId);
      }
    }

    socket.on('catalog:list', (ack) => {
      ack({ ok: true, data: { games: registry.definitions() } });
    });

    socket.on('lobby:create', ({ playerName, gameId }, ack) => {
      try {
        if (!registry.has(gameId)) return ack({ ok: false, error: 'Jeu inconnu' });
        const room = manager.createRoom(gameId, playerId, playerName);
        socket.join(room.code);
        socket.data.roomCode = room.code;
        ack({ ok: true, data: { code: room.code } });
      } catch (e) {
        ack({ ok: false, error: errMsg(e) });
      }
    });

    socket.on('lobby:join', ({ playerName, code }, ack) => {
      try {
        const room = manager.joinRoom(code, playerId, playerName);
        socket.join(room.code);
        socket.data.roomCode = room.code;
        ack({ ok: true, data: { code: room.code } });
      } catch (e) {
        ack({ ok: false, error: errMsg(e) });
      }
    });

    socket.on('lobby:leave', (ack) => {
      leaveCurrentRoom(socket);
      ack?.({ ok: true, data: {} });
    });

    socket.on('lobby:setTeam', ({ teamId }, ack) => {
      manager.getRoomOfPlayer(playerId)?.setTeam(playerId, teamId);
      ack?.({ ok: true, data: {} });
    });

    socket.on('lobby:start', (ack) => {
      const room = manager.getRoomOfPlayer(playerId);
      if (!room) return ack?.({ ok: false, error: 'Aucun salon' });
      const res = room.start(playerId);
      ack?.(res.ok ? { ok: true, data: {} } : { ok: false, error: res.error ?? 'Erreur' });
    });

    socket.on('lobby:rematch', (ack) => {
      manager.getRoomOfPlayer(playerId)?.backToLobby(playerId);
      ack?.({ ok: true, data: {} });
    });

    socket.on('game:action', ({ type, payload }, ack) => {
      manager.getRoomOfPlayer(playerId)?.handleAction(playerId, type, payload);
      ack?.({ ok: true, data: {} });
    });

    socket.on('disconnect', () => {
      const room = manager.getRoomOfPlayer(playerId);
      if (!room) return;
      manager.setConnected(playerId, false);
      // Grace period: if not recovered/reconnected, drop the player.
      const t = setTimeout(() => {
        pendingRemoval.delete(playerId);
        manager.leave(playerId);
      }, DISCONNECT_GRACE_MS);
      pendingRemoval.set(playerId, t);
    });
  });

  function leaveCurrentRoom(socket: AppSocket): void {
    const code = socket.data.roomCode;
    manager.leave(socket.data.playerId);
    if (code) socket.leave(code);
    socket.data.roomCode = null;
  }

  return manager;
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Erreur inattendue';
}
