import { GameContext, GameInstance } from '../../core/game';
import { GameResults } from '../../shared/types';

const ROUNDS = 8;
const TIME = 15;
const REVEAL = 3;

function makeProblem(): { text: string; answer: number } {
  const ops = ['+', '-', '×'] as const;
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a: number, b: number, answer: number;
  if (op === '×') { a = 2 + Math.floor(Math.random() * 11); b = 2 + Math.floor(Math.random() * 11); answer = a * b; }
  else if (op === '+') { a = 5 + Math.floor(Math.random() * 90); b = 5 + Math.floor(Math.random() * 90); answer = a + b; }
  else { a = 20 + Math.floor(Math.random() * 80); b = 1 + Math.floor(Math.random() * a); answer = a - b; }
  return { text: `${a} ${op} ${b}`, answer };
}

/** Calcul Mental — le plus rapide à donner le bon résultat marque la manche. */
export class MathDuelGame implements GameInstance {
  private phase: 'round' | 'reveal' | 'ended' = 'round';
  private round = 0;
  private timeLeft = TIME;
  private problem = makeProblem();
  private wins = new Map<string, number>();
  private names = new Map<string, string>();
  private winnerId: string | null = null;

  constructor(private ctx: GameContext) {}

  start(): void {
    for (const p of this.ctx.players()) { this.wins.set(p.id, 0); this.names.set(p.id, p.name); }
    this.begin();
    this.ctx.setInterval(() => this.tick(), 1000);
  }
  dispose(): void {}

  private begin(): void { this.phase = 'round'; this.round += 1; this.timeLeft = TIME; this.winnerId = null; this.problem = makeProblem(); this.ctx.broadcastState(); }
  private tick(): void {
    if (this.phase === 'round') { this.timeLeft -= 1; if (this.timeLeft <= 0) this.reveal(); else this.ctx.broadcastState(); }
    else if (this.phase === 'reveal') { this.timeLeft -= 1; if (this.timeLeft <= 0) this.next(); else this.ctx.broadcastState(); }
  }
  private reveal(): void { this.phase = 'reveal'; this.timeLeft = REVEAL; this.ctx.broadcastState(); }
  private next(): void { if (this.round >= ROUNDS) this.end(); else this.begin(); }

  handleAction(playerId: string, type: string, payload?: unknown): void {
    if (this.phase !== 'round' || type !== 'answer') return;
    const v = Math.round(Number((payload as any)?.value));
    if (v === this.problem.answer) {
      this.winnerId = playerId;
      this.wins.set(playerId, (this.wins.get(playerId) ?? 0) + 1);
      this.ctx.emitEvent({ type: 'ok', payload: { name: this.names.get(playerId) } });
      this.reveal();
    } else {
      this.ctx.emitEvent({ type: 'invalid', payload: { reason: 'faux' } }, playerId);
    }
  }
  onPlayerLeave(id: string): void { this.wins.delete(id); this.names.delete(id); if (this.phase !== 'ended') this.ctx.broadcastState(); }

  private board() { return [...this.wins.entries()].map(([id, w]) => ({ id, label: this.names.get(id) ?? '?', score: w })).sort((a, b) => b.score - a.score); }
  private end(): void {
    this.phase = 'ended';
    const r = this.board().map(({ label, score }) => ({ label, score }));
    this.ctx.endGame({ gameId: 'math-duel', ranking: r, summary: r[0] ? `🏆 ${r[0].label} est le plus rapide !` : undefined } as GameResults);
  }

  getStateFor(playerId: string): unknown {
    return {
      phase: this.phase,
      round: this.round, totalRounds: ROUNDS,
      problem: this.problem.text,
      timeLeft: this.timeLeft, duration: this.phase === 'reveal' ? REVEAL : TIME,
      answer: this.phase === 'reveal' ? this.problem.answer : null,
      winnerName: this.winnerId ? this.names.get(this.winnerId) : null,
      iWon: this.winnerId === playerId,
      scores: this.board().map((b) => ({ name: b.label, wins: b.score, isMe: b.id === playerId })),
      actions: this.phase === 'round' ? ['answer'] : [],
    };
  }
}
