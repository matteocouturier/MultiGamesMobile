import { GameContext, GameInstance } from '../../core/game';
import { GameResults } from '../../shared/types';

const SYMBOLS = ['🍎', '🍌', '🐶', '🚗', '⚽', '🌟', '🎵', '🍕'];
const HIDE_MS = 1300;

function shuffle<T>(a: T[]): T[] { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; }

/** Memory — retourne 2 cartes pour trouver des paires. Une paire trouvée = tu rejoues.
 *  Tour par tour, le joueur avec le plus de paires gagne. */
export class MemoryGame implements GameInstance {
  private phase: 'playing' | 'ended' = 'playing';
  private cards: string[] = [];
  private matched: boolean[] = [];
  private flipped: number[] = [];
  private locked = false;
  private ids: string[] = [];
  private names = new Map<string, string>();
  private pairs = new Map<string, number>();
  private currentIdx = 0;
  private token = 0;

  constructor(private ctx: GameContext) {}

  start(): void {
    this.ids = this.ctx.players().map((p) => p.id);
    for (const p of this.ctx.players()) { this.names.set(p.id, p.name); this.pairs.set(p.id, 0); }
    this.cards = shuffle([...SYMBOLS, ...SYMBOLS]);
    this.matched = this.cards.map(() => false);
    this.ctx.broadcastState();
  }
  dispose(): void {}

  handleAction(playerId: string, type: string, payload?: unknown): void {
    if (this.phase !== 'playing' || type !== 'flip' || this.locked) return;
    if (this.ids[this.currentIdx] !== playerId) return;
    const i = Number((payload as any)?.index);
    if (!(i >= 0 && i < this.cards.length)) return;
    if (this.matched[i] || this.flipped.includes(i)) return;

    this.flipped.push(i);
    if (this.flipped.length < 2) { this.ctx.broadcastState(); return; }

    const [a, b] = this.flipped;
    if (this.cards[a] === this.cards[b]) {
      this.matched[a] = true; this.matched[b] = true;
      this.pairs.set(playerId, (this.pairs.get(playerId) ?? 0) + 1);
      this.flipped = [];
      this.ctx.emitEvent({ type: 'ok', payload: { word: this.cards[a] } });
      this.ctx.broadcastState();
      if (this.matched.every(Boolean)) this.end();
    } else {
      this.locked = true;
      this.ctx.broadcastState();
      const tk = ++this.token;
      this.ctx.setTimeout(() => {
        if (tk !== this.token) return;
        this.flipped = [];
        this.locked = false;
        this.currentIdx = (this.currentIdx + 1) % this.ids.length;
        this.ctx.broadcastState();
      }, HIDE_MS);
    }
  }

  onPlayerLeave(playerId: string): void {
    const i = this.ids.indexOf(playerId);
    if (i >= 0) {
      this.ids.splice(i, 1);
      if (this.ids.length === 0) return;
      if (this.currentIdx >= this.ids.length) this.currentIdx = 0;
    }
    if (this.phase !== 'ended') this.ctx.broadcastState();
  }

  private board() { return this.ids.map((id) => ({ id, label: this.names.get(id) ?? '?', score: this.pairs.get(id) ?? 0 })).sort((a, b) => b.score - a.score); }
  private end(): void {
    this.phase = 'ended';
    const r = this.board().map(({ label, score }) => ({ label, score }));
    this.ctx.endGame({ gameId: 'memory', ranking: r, summary: r[0] ? `🏆 ${r[0].label} a trouvé le plus de paires !` : undefined } as GameResults);
  }

  getStateFor(playerId: string): unknown {
    const currentId = this.ids[this.currentIdx];
    return {
      phase: this.phase,
      cards: this.cards.map((v, i) => ({ value: this.matched[i] || this.flipped.includes(i) ? v : null, matched: this.matched[i] })),
      currentName: this.names.get(currentId) ?? '',
      myTurn: currentId === playerId && !this.locked,
      scores: this.board().map((b) => ({ name: b.label, pairs: b.score, isMe: b.id === playerId })),
      actions: currentId === playerId && !this.locked && this.phase === 'playing' ? ['flip'] : [],
    };
  }
}
