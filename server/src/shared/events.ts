/**
 * Typed Socket.IO event contract shared by server and client.
 * Client -> Server events use acknowledgement callbacks where a result is needed.
 */

import {
  Ack,
  GameDefinition,
  GameEvent,
  GameResults,
  GameStatePayload,
  RoomState,
} from './types';

/** Events emitted by the SERVER and listened to by the CLIENT. */
export interface ServerToClientEvents {
  'room:update': (state: RoomState) => void;
  'game:state': (payload: GameStatePayload) => void;
  'game:event': (event: GameEvent) => void;
  'game:ended': (results: GameResults) => void;
  /** Server asks the client to leave any local room view (kicked, room closed). */
  'room:closed': (reason: string) => void;
  'error:msg': (message: string) => void;
}

/** Events emitted by the CLIENT and listened to by the SERVER. */
export interface ClientToServerEvents {
  'catalog:list': (ack: (res: Ack<{ games: GameDefinition[] }>) => void) => void;

  'lobby:create': (
    data: { playerName: string; gameId: string },
    ack: (res: Ack<{ code: string }>) => void
  ) => void;

  'lobby:join': (
    data: { playerName: string; code: string },
    ack: (res: Ack<{ code: string }>) => void
  ) => void;

  'lobby:leave': (ack?: (res: Ack) => void) => void;

  'lobby:setTeam': (
    data: { teamId: string },
    ack?: (res: Ack) => void
  ) => void;

  'lobby:start': (ack?: (res: Ack) => void) => void;

  /** Host returns the room to the lobby after a game finished. */
  'lobby:rematch': (ack?: (res: Ack) => void) => void;

  'game:action': (
    data: { type: string; payload?: unknown },
    ack?: (res: Ack) => void
  ) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  playerId: string;
  roomCode: string | null;
}
