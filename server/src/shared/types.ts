/**
 * Shared types between server and mobile client.
 * Keep this file framework-agnostic (no server-only imports) so it can be
 * copied/symlinked to the mobile app as the single source of truth.
 */

export type RoomStatus = 'lobby' | 'in_game' | 'finished';

export interface PublicPlayer {
  id: string;
  name: string;
  isHost: boolean;
  connected: boolean;
  teamId: string | null;
}

export interface TeamInfo {
  id: string;
  name: string;
  color: string;
}

/** Static metadata describing a mini-game. Used to render the game list. */
export interface GameDefinition {
  id: string;
  name: string;
  description: string;
  /** Short tagline shown on the card. */
  tagline: string;
  minPlayers: number;
  maxPlayers: number;
  /** Whether players are split into teams in the lobby. */
  teamBased: boolean;
  /** If team based, the number of players per team (informative). */
  teamSize: number;
  /** Emoji or icon key for the card. */
  icon: string;
  /** Accent color (hex) used on the card and in game. */
  color: string;
}

/** Full lobby/room state broadcast to every client in the room. */
export interface RoomState {
  code: string;
  status: RoomStatus;
  gameId: string;
  game: GameDefinition;
  hostId: string;
  players: PublicPlayer[];
  teams: TeamInfo[];
  /** True when min players reached and the host may start. */
  canStart: boolean;
}

/** Wrapper for the per-player game view. `state` shape is game-specific. */
export interface GameStatePayload<T = unknown> {
  gameId: string;
  state: T;
}

/** Transient one-shot event emitted during a game (toasts, animations...). */
export interface GameEvent {
  type: string;
  payload?: unknown;
}

export interface GameResults {
  gameId: string;
  /** Ranking lines ready to display, best first. */
  ranking: { label: string; score: number; color?: string }[];
  /** Optional free-form summary. */
  summary?: string;
}

export interface AckOk<T = Record<string, unknown>> {
  ok: true;
  data: T;
}
export interface AckError {
  ok: false;
  error: string;
}
export type Ack<T = Record<string, unknown>> = AckOk<T> | AckError;
