import { GameContext, GameInstance } from '../../core/game';
import { GameResults } from '../../shared/types';

const COLORS = [
  { key: 'red', label: 'ROUGE', hex: '#FF5A5F' },
  { key: 'green', label: 'VERT', hex: '#34C759' },
  { key: 'blue', label: 'BLEU', hex: '#4C8DFF' },
  { key: 'yellow', label: 'JAUNE', hex: '#FFC53D' },
  { key: 'purple', label: 'VIOLET', hex: '#9B7BFF' },
];
const ROUNDS = 8;
const TIME = 7;
const REVEAL = 2;

function pick<T>(a: T[]): T { return a[Math.floor(Math.random() * a.length)]; }

/** Couleur-Mot (Stroop) — tape la COULEUR de l'encre, pas le mot écrit ! */
export class StroopGame implements GameInstance {
  private phase: 'round' | 'reveal' | 'ended' = 'round';
  private round = 0;
  private timeLeft = TIME;
  private wordLabel = '';
  private inkKey = '';
  private inkHex = '';
  private options: typeof COLORS = [];
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

  private begin(): void {
    this.phase = 'round'; this.round += 1; this.timeLeft = TIME; this.winnerId = null;
    const word = pick(COLORS);
    let ink = pick(COLORS);
    while (ink.key === word.key) ink = pick(COLORS); // ink differs from the written word
    this.wordLabel = word.label; this.inkKey = ink.key; this.inkHex = ink.hex;
    // 4 options including the correct ink, shuffled.
    const opts = new Set<string>([ink.key]);
    while (opts.size < 4) opts.add(pick(COLORS).key);
    this.options = [...opts].map((k) => COLORS.find((c) => c.key === k)!).sort(() => Math.random() - 0.5);
    this.ctx.broadcastState();
  }
  private tick(): void {
    if (this.phase === 'round') { this.timeLeft -= 1; if (this.timeLeft <= 0) this.reveal(); else this.ctx.broadcastState(); }
    else if (this.phase === 'reveal') { this.timeLeft -= 1; if (this.timeLeft <= 0) this.next(); else this.ctx.broadcastState(); }
  }
  private reveal(): void { this.phase = 'reveal'; this.timeLeft = REVEAL; this.ctx.broadcastState(); }
  private next(): void { if (this.round >= ROUNDS) this.end(); else this.begin(); }

  handleAction(playerId: string, type: string, payload?: unknown): void {
    if (this.phase !== 'round' || type !== 'answer') return;
    const key = String((payload as any)?.color ?? '');
    if (key === this.inkKey) {
      this.winnerId = playerId;
      this.wins.set(playerId, (this.wins.get(playerId) ?? 0) + 1);
      this.ctx.emitEvent({ type: 'ok', payload: { name: this.names.get(playerId) } });
      this.reveal();
    } else {
      this.ctx.emitEvent({ type: 'invalid', payload: { reason: 'mauvaise couleur' } }, playerId);
    }
  }
  onPlayerLeave(id: string): void { this.wins.delete(id); this.names.delete(id); if (this.phase !== 'ended') this.ctx.broadcastState(); }

  private board() { return [...this.wins.entries()].map(([id, w]) => ({ id, label: this.names.get(id) ?? '?', score: w })).sort((a, b) => b.score - a.score); }
  private end(): void {
    this.phase = 'ended';
    const r = this.board().map(({ label, score }) => ({ label, score }));
    this.ctx.endGame({ gameId: 'stroop', ranking: r, summary: r[0] ? `🏆 ${r[0].label} a l’œil le plus vif !` : undefined } as GameResults);
  }

  getStateFor(playerId: string): unknown {
    return {
      phase: this.phase,
      round: this.round, totalRounds: ROUNDS,
      wordLabel: this.wordLabel, inkHex: this.inkHex,
      options: this.options.map((o) => ({ key: o.key, label: o.label, hex: o.hex })),
      timeLeft: this.timeLeft, duration: this.phase === 'reveal' ? REVEAL : TIME,
      winnerName: this.winnerId ? this.names.get(this.winnerId) : null,
      iWon: this.winnerId === playerId,
      scores: this.board().map((b) => ({ name: b.label, wins: b.score, isMe: b.id === playerId })),
      actions: this.phase === 'round' ? ['answer'] : [],
    };
  }
}
