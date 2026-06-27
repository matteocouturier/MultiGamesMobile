import { GameContext, GameInstance } from '../../core/game';
import { GameResults } from '../../shared/types';

const ROUNDS = 3;
const MAX = 100;
const RESULT_MS = 3500;

/**
 * Plus ou Moins — free-for-all. A secret number 1..100; anyone can guess at any
 * time. After each guess everyone is told "plus grand / plus petit" and the
 * known range narrows. First to hit the exact number wins the round.
 */
export class HigherLowerGame implements GameInstance {
  private phase: 'playing' | 'result' | 'ended' = 'playing';
  private round = 0;
  private secret = 0;
  private low = 0;
  private high = MAX + 1;
  private wins = new Map<string, number>();
  private names = new Map<string, string>();
  private lastGuess: { name: string; value: number; hint: 'higher' | 'lower' } | null = null;
  private winnerId: string | null = null;
  private phaseToken = 0;

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
    this.phase = 'playing';
    this.secret = 1 + Math.floor(Math.random() * MAX);
    this.low = 0;
    this.high = MAX + 1;
    this.lastGuess = null;
    this.winnerId = null;
    this.ctx.broadcastState();
  }

  handleAction(playerId: string, type: string, payload?: unknown): void {
    if (this.phase !== 'playing' || type !== 'guess') return;
    const value = typeof payload === 'object' && payload && 'value' in payload ? Math.round(Number((payload as any).value)) : NaN;
    if (!Number.isFinite(value) || value < 1 || value > MAX) return;
    const name = this.names.get(playerId) ?? '?';

    if (value === this.secret) {
      this.winnerId = playerId;
      this.wins.set(playerId, (this.wins.get(playerId) ?? 0) + 1);
      this.ctx.emitEvent({ type: 'win', payload: { name, value } });
      this.endRound();
      return;
    }
    if (value < this.secret) {
      if (value > this.low) this.low = value;
      this.lastGuess = { name, value, hint: 'higher' };
    } else {
      if (value < this.high) this.high = value;
      this.lastGuess = { name, value, hint: 'lower' };
    }
    this.ctx.emitEvent({ type: 'hint', payload: { name, value, hint: this.lastGuess.hint } });
    this.ctx.broadcastState();
  }

  private endRound(): void {
    this.phase = 'result';
    this.ctx.broadcastState();
    const token = ++this.phaseToken;
    this.ctx.setTimeout(() => {
      if (token !== this.phaseToken) return;
      if (this.round >= ROUNDS) this.endGame();
      else this.startRound();
    }, RESULT_MS);
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
      gameId: 'higher-lower',
      ranking,
      summary: ranking[0] ? `🏆 ${ranking[0].label} remporte la partie !` : undefined,
    } as GameResults);
  }

  getStateFor(playerId: string): unknown {
    const reveal = this.phase !== 'playing';
    return {
      phase: this.phase,
      round: this.round,
      totalRounds: ROUNDS,
      low: this.low,
      high: this.high,
      max: MAX,
      lastGuess: this.lastGuess,
      secret: reveal ? this.secret : null,
      winnerName: this.winnerId ? this.names.get(this.winnerId) : null,
      iWon: this.winnerId === playerId,
      scores: this.board().map((b) => ({ name: b.label, wins: b.score, isMe: b.id === playerId })),
      actions: this.phase === 'playing' ? ['guess'] : [],
    };
  }
}
