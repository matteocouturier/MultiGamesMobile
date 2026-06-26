import { GameContext, GameInstance } from '../../core/game';
import { GameResults } from '../../shared/types';

const ROUNDS = 5;
const MIN_ARM = 2000;
const MAX_ARM = 6000;
const RESULT_MS = 3000;

/**
 * Réflexe — free-for-all. Wait for the signal, then tap as fast as possible.
 * First valid tap wins the round; tapping too early is a false start (locked out
 * for the round). Most round wins after 5 rounds wins the game.
 */
export class ReflexGame implements GameInstance {
  private phase: 'arming' | 'go' | 'result' | 'ended' = 'arming';
  private round = 0;
  private wins = new Map<string, number>();
  private names = new Map<string, string>();
  private falseStart = new Set<string>();
  private goAt = 0;
  private winnerId: string | null = null;
  private lastReactionMs: number | null = null;

  constructor(private ctx: GameContext) {}

  start(): void {
    for (const p of this.ctx.players()) {
      this.wins.set(p.id, 0);
      this.names.set(p.id, p.name);
    }
    this.startRound();
  }

  dispose(): void {}

  private startRound(): void {
    this.round += 1;
    this.phase = 'arming';
    this.falseStart.clear();
    this.winnerId = null;
    this.lastReactionMs = null;
    this.ctx.broadcastState();
    const delay = MIN_ARM + Math.floor(Math.random() * (MAX_ARM - MIN_ARM));
    this.ctx.setTimeout(() => {
      if (this.phase === 'arming') this.go();
    }, delay);
  }

  private go(): void {
    this.phase = 'go';
    this.goAt = Date.now();
    this.ctx.emitEvent({ type: 'go' });
    this.ctx.broadcastState();
    // If everyone false-started, no one can win: end the round after a moment.
    if (this.falseStart.size >= this.wins.size) {
      this.ctx.setTimeout(() => this.endRound(), 600);
    }
  }

  private endRound(): void {
    this.phase = 'result';
    this.ctx.broadcastState();
    this.ctx.setTimeout(() => {
      if (this.round >= ROUNDS) this.endGame();
      else this.startRound();
    }, RESULT_MS);
  }

  handleAction(playerId: string, type: string, _payload?: unknown): void {
    if (type !== 'tap') return;
    if (this.phase === 'arming') {
      // Too early -> false start, locked out this round.
      if (!this.falseStart.has(playerId)) {
        this.falseStart.add(playerId);
        this.ctx.emitEvent({ type: 'falsestart' }, playerId);
        this.ctx.broadcastState();
      }
      return;
    }
    if (this.phase === 'go' && !this.winnerId && !this.falseStart.has(playerId)) {
      this.winnerId = playerId;
      this.lastReactionMs = Date.now() - this.goAt;
      this.wins.set(playerId, (this.wins.get(playerId) ?? 0) + 1);
      this.ctx.emitEvent({ type: 'win', payload: { name: this.names.get(playerId), ms: this.lastReactionMs } });
      this.endRound();
    }
  }

  onPlayerLeave(playerId: string): void {
    this.wins.delete(playerId);
    this.names.delete(playerId);
    if (this.phase !== 'ended') this.ctx.broadcastState();
  }

  private board() {
    return [...this.wins.entries()]
      .map(([id, w]) => ({ id, label: this.names.get(id) ?? '?', score: w }))
      .sort((a, b) => b.score - a.score);
  }

  private endGame(): void {
    this.phase = 'ended';
    const ranking = this.board().map(({ label, score }) => ({ label, score }));
    this.ctx.endGame({
      gameId: 'reflex',
      ranking,
      summary: ranking[0] ? `🏆 ${ranking[0].label} a les meilleurs réflexes !` : undefined,
    } as GameResults);
  }

  getStateFor(playerId: string): unknown {
    return {
      phase: this.phase,
      round: this.round,
      totalRounds: ROUNDS,
      myFalseStart: this.falseStart.has(playerId),
      winnerName: this.winnerId ? this.names.get(this.winnerId) : null,
      iWon: this.winnerId === playerId,
      lastReactionMs: this.lastReactionMs,
      scores: this.board().map((b) => ({ name: b.label, wins: b.score, isMe: b.id === playerId })),
      actions: this.phase === 'arming' || this.phase === 'go' ? ['tap'] : [],
    };
  }
}
