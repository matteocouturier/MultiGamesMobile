/**
 * Game plugin contract.
 *
 * A mini-game is a self-contained module that implements `GameModule`.
 * The engine never needs to know the internals of a game: it only creates an
 * instance through the registry, forwards player actions, and asks for the
 * per-player state to broadcast. Add a new game = add a new module and register
 * it. No change to the core engine is required.
 */

import { GameDefinition, GameEvent, GameResults } from '../shared/types';

/** A lightweight view of a player as seen by a game instance. */
export interface GamePlayer {
  id: string;
  name: string;
  teamId: string | null;
  connected: boolean;
}

/**
 * Services the engine gives to a running game instance so it can communicate
 * with the room without knowing about sockets.
 */
export interface GameContext {
  readonly roomCode: string;
  /** Snapshot of players at any time (always current). */
  players(): GamePlayer[];
  /** Push the latest per-player state to all clients (calls getStateFor each). */
  broadcastState(): void;
  /** Emit a transient event to everyone (or one player if playerId given). */
  emitEvent(event: GameEvent, playerId?: string): void;
  /** End the game and show results. The room returns to a finished screen. */
  endGame(results: GameResults): void;
  /** Schedule a callback; cleared automatically when the game ends. */
  setInterval(fn: () => void, ms: number): void;
  setTimeout(fn: () => void, ms: number): void;
}

/** A live instance of a game, owned by a single room. */
export interface GameInstance {
  /** Called once when the host launches the game. */
  start(): void;
  /** Route a player action coming from the client. */
  handleAction(playerId: string, type: string, payload?: unknown): void;
  /** Return the state visible to a specific player (hide secrets accordingly). */
  getStateFor(playerId: string): unknown;
  /** A player disconnected or left mid-game. */
  onPlayerLeave(playerId: string): void;
  /** Called when the room tears the game down; release timers/resources. */
  dispose(): void;
}

/** Factory + metadata for a game. This is what gets registered. */
export interface GameModule {
  definition: GameDefinition;
  create(ctx: GameContext): GameInstance;
}
