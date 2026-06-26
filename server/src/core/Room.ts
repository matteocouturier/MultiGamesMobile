import { GameDefinition, GameEvent, GameResults, PublicPlayer, RoomState, TeamInfo } from '../shared/types';
import { GameContext, GameInstance, GamePlayer, GameModule } from './game';
import { RoomTransport } from './transport';

interface PlayerRecord {
  id: string;
  name: string;
  connected: boolean;
  teamId: string | null;
}

const TEAM_PRESETS: Omit<TeamInfo, 'id'>[] = [
  { name: 'Rouge', color: '#FF5A5F' },
  { name: 'Bleu', color: '#4C8DFF' },
  { name: 'Vert', color: '#34C759' },
  { name: 'Jaune', color: '#FFC53D' },
];

/**
 * A single game room. Owns the lobby state, team assignment and the running
 * game instance. Stays agnostic of socket.io through the RoomTransport.
 */
export class Room {
  readonly code: string;
  readonly module: GameModule;
  private readonly def: GameDefinition;
  private readonly transport: RoomTransport;

  status: RoomState['status'] = 'lobby';
  hostId: string | null = null;

  private players = new Map<string, PlayerRecord>();
  private teams: TeamInfo[] = [];
  private instance: GameInstance | null = null;
  private timers = new Set<NodeJS.Timeout>();

  /** Called by the manager when the room becomes empty so it can be disposed. */
  onEmpty?: () => void;

  constructor(code: string, module: GameModule, transport: RoomTransport) {
    this.code = code;
    this.module = module;
    this.def = module.definition;
    this.transport = transport;

    if (this.def.teamBased) {
      const teamCount = Math.max(2, Math.ceil(this.def.maxPlayers / this.def.teamSize));
      this.teams = Array.from({ length: Math.min(teamCount, TEAM_PRESETS.length) }, (_, i) => ({
        id: `team-${i}`,
        ...TEAM_PRESETS[i],
      }));
    }
  }

  // ---- Lobby management ---------------------------------------------------

  isFull(): boolean {
    return this.players.size >= this.def.maxPlayers;
  }

  isEmpty(): boolean {
    return this.players.size === 0;
  }

  hasPlayer(playerId: string): boolean {
    return this.players.has(playerId);
  }

  addPlayer(playerId: string, name: string): PlayerRecord {
    const clean = name.trim().slice(0, 20) || 'Joueur';
    const record: PlayerRecord = {
      id: playerId,
      name: clean,
      connected: true,
      teamId: this.def.teamBased ? this.pickBalancedTeam() : null,
    };
    this.players.set(playerId, record);
    if (!this.hostId) this.hostId = playerId;
    this.broadcastRoom();
    return record;
  }

  removePlayer(playerId: string): void {
    if (!this.players.has(playerId)) return;
    this.players.delete(playerId);

    if (this.instance) this.instance.onPlayerLeave(playerId);

    if (this.hostId === playerId) {
      // Promote the next remaining player to host.
      this.hostId = this.players.keys().next().value ?? null;
    }

    if (this.isEmpty()) {
      this.dispose();
      this.onEmpty?.();
      return;
    }
    this.broadcastRoom();
  }

  setConnected(playerId: string, connected: boolean): void {
    const p = this.players.get(playerId);
    if (!p) return;
    p.connected = connected;
    if (this.instance && !connected) this.instance.onPlayerLeave(playerId);
    this.broadcastRoom();
  }

  setTeam(playerId: string, teamId: string): void {
    if (this.status !== 'lobby' || !this.def.teamBased) return;
    const p = this.players.get(playerId);
    if (!p || !this.teams.some((t) => t.id === teamId)) return;
    p.teamId = teamId;
    this.broadcastRoom();
  }

  private pickBalancedTeam(): string {
    const counts = new Map(this.teams.map((t) => [t.id, 0]));
    for (const p of this.players.values()) {
      if (p.teamId) counts.set(p.teamId, (counts.get(p.teamId) ?? 0) + 1);
    }
    let best = this.teams[0].id;
    let min = Infinity;
    for (const t of this.teams) {
      const c = counts.get(t.id) ?? 0;
      if (c < min) {
        min = c;
        best = t.id;
      }
    }
    return best;
  }

  canStart(): boolean {
    if (this.status !== 'lobby') return false;
    if (this.players.size < this.def.minPlayers) return false;
    if (this.def.teamBased) {
      // Every active team needs at least one member, and at least 2 teams used.
      const used = new Set([...this.players.values()].map((p) => p.teamId));
      if (used.size < 2) return false;
    }
    return true;
  }

  // ---- Game lifecycle -----------------------------------------------------

  start(requesterId: string): { ok: boolean; error?: string } {
    if (requesterId !== this.hostId) return { ok: false, error: "Seul l'hôte peut lancer" };
    if (!this.canStart()) return { ok: false, error: 'Conditions de départ non remplies' };

    this.status = 'in_game';
    this.instance = this.module.create(this.buildContext());
    this.broadcastRoom();
    this.instance.start();
    return { ok: true };
  }

  handleAction(playerId: string, type: string, payload?: unknown): void {
    if (this.status === 'in_game' && this.instance) {
      this.instance.handleAction(playerId, type, payload);
    }
  }

  /** Re-send current state to a (re)connecting player. */
  syncPlayer(playerId: string): void {
    this.transport.roomUpdate(this.toState());
    if (this.status === 'in_game' && this.instance) {
      this.transport.gameState(playerId, {
        gameId: this.def.id,
        state: this.instance.getStateFor(playerId),
      });
    }
  }

  private buildContext(): GameContext {
    const self = this;
    return {
      roomCode: this.code,
      players(): GamePlayer[] {
        return [...self.players.values()].map((p) => ({
          id: p.id,
          name: p.name,
          teamId: p.teamId,
          connected: p.connected,
        }));
      },
      broadcastState(): void {
        if (!self.instance) return;
        for (const p of self.players.values()) {
          self.transport.gameState(p.id, {
            gameId: self.def.id,
            state: self.instance.getStateFor(p.id),
          });
        }
      },
      emitEvent(event: GameEvent, playerId?: string): void {
        self.transport.gameEvent(playerId ?? null, event);
      },
      endGame(results: GameResults): void {
        self.finishGame(results);
      },
      setInterval(fn: () => void, ms: number): void {
        const t = setInterval(fn, ms);
        self.timers.add(t);
      },
      setTimeout(fn: () => void, ms: number): void {
        const t = setTimeout(() => {
          self.timers.delete(t);
          fn();
        }, ms);
        self.timers.add(t);
      },
    };
  }

  private finishGame(results: GameResults): void {
    this.clearTimers();
    this.instance?.dispose();
    this.instance = null;
    this.status = 'finished';
    this.transport.gameEnded(results);
    this.broadcastRoom();
  }

  /** Return everyone to the lobby for a rematch (host action). */
  backToLobby(requesterId: string): void {
    if (requesterId !== this.hostId || this.status !== 'finished') return;
    this.status = 'lobby';
    this.broadcastRoom();
  }

  private clearTimers(): void {
    for (const t of this.timers) clearInterval(t);
    this.timers.clear();
  }

  dispose(): void {
    this.clearTimers();
    this.instance?.dispose();
    this.instance = null;
  }

  // ---- State serialization ------------------------------------------------

  private toPublicPlayers(): PublicPlayer[] {
    return [...this.players.values()].map((p) => ({
      id: p.id,
      name: p.name,
      isHost: p.id === this.hostId,
      connected: p.connected,
      teamId: p.teamId,
    }));
  }

  toState(): RoomState {
    return {
      code: this.code,
      status: this.status,
      gameId: this.def.id,
      game: this.def,
      hostId: this.hostId ?? '',
      players: this.toPublicPlayers(),
      teams: this.teams,
      canStart: this.canStart(),
    };
  }

  broadcastRoom(): void {
    this.transport.roomUpdate(this.toState());
  }
}
