/**
 * Transport abstraction so the Room/engine never imports socket.io directly.
 * The socket layer provides a concrete implementation. This keeps the engine
 * testable and swappable (e.g. for a different real-time backend).
 */

import { GameEvent, GameResults, GameStatePayload, RoomState } from '../shared/types';

export interface RoomTransport {
  /** Broadcast the lobby/room state to everyone in the room. */
  roomUpdate(state: RoomState): void;
  /** Send a per-player game state to one player. */
  gameState(playerId: string, payload: GameStatePayload): void;
  /** Send a transient game event to one player or, if null, the whole room. */
  gameEvent(playerId: string | null, event: GameEvent): void;
  /** Notify the room the game ended with results. */
  gameEnded(results: GameResults): void;
  /** Tell every client the room was closed. */
  roomClosed(reason: string): void;
}
