import { GameContext, GameInstance } from '../../core/game';
import { GameResults } from '../../shared/types';
import { pickFresh } from '../shared/freshDeck';
import questionsData from '../../content/popular.json';

interface PQ { q: string; options: string[] }
const QUESTIONS: PQ[] = questionsData as PQ[];
const TIME = 12;
const REVEAL = 6;
const NB = 6;

/** Question Populaire — réponds comme la majorité ! Tu marques 1 point par autre
 *  joueur qui a choisi la même option que toi. */
export class PopularGame implements GameInstance {
  private phase: 'question' | 'reveal' | 'ended' = 'question';
  private deck: PQ[] = [];
  private idx = 0;
  private timeLeft = TIME;
  private votes = new Map<string, number>();
  private scores = new Map<string, number>();
  private names = new Map<string, string>();
  private counts: number[] = [];

  constructor(private ctx: GameContext) {}

  start(): void {
    for (const p of this.ctx.players()) { this.scores.set(p.id, 0); this.names.set(p.id, p.name); }
    this.deck = pickFresh(`popular:${this.ctx.roomCode}`, QUESTIONS, NB, (q) => q.q);
    this.begin();
    this.ctx.setInterval(() => this.tick(), 1000);
  }
  dispose(): void {}

  private begin(): void { this.phase = 'question'; this.timeLeft = TIME; this.votes.clear(); this.ctx.broadcastState(); }
  private tick(): void {
    if (this.phase === 'question') { this.timeLeft -= 1; if (this.timeLeft <= 0 || this.votes.size >= this.scores.size) this.reveal(); else this.ctx.broadcastState(); }
    else if (this.phase === 'reveal') { this.timeLeft -= 1; if (this.timeLeft <= 0) this.next(); else this.ctx.broadcastState(); }
  }
  private reveal(): void {
    this.phase = 'reveal'; this.timeLeft = REVEAL;
    const q = this.deck[this.idx];
    this.counts = q.options.map(() => 0);
    for (const opt of this.votes.values()) if (this.counts[opt] != null) this.counts[opt] += 1;
    for (const [id, opt] of this.votes) this.scores.set(id, (this.scores.get(id) ?? 0) + Math.max(0, this.counts[opt] - 1));
    this.ctx.broadcastState();
  }
  private next(): void { this.idx += 1; if (this.idx >= this.deck.length) this.end(); else this.begin(); }

  handleAction(playerId: string, type: string, payload?: unknown): void {
    if (this.phase !== 'question' || type !== 'vote' || this.votes.has(playerId)) return;
    const opt = Number((payload as any)?.option);
    if (opt < 0 || opt >= this.deck[this.idx].options.length) return;
    this.votes.set(playerId, opt);
    this.ctx.emitEvent({ type: 'answered' }, playerId);
    this.ctx.broadcastState();
  }
  onPlayerLeave(id: string): void { this.votes.delete(id); if (this.phase !== 'ended') this.ctx.broadcastState(); }

  private board() { return [...this.scores.entries()].map(([id, s]) => ({ id, label: this.names.get(id) ?? '?', score: s })).sort((a, b) => b.score - a.score); }
  private end(): void {
    this.phase = 'ended';
    const r = this.board().map(({ label, score }) => ({ label, score }));
    this.ctx.endGame({ gameId: 'popular', ranking: r, summary: r[0] ? `🏆 ${r[0].label} pense comme tout le monde !` : undefined } as GameResults);
  }

  getStateFor(playerId: string): unknown {
    const q = this.deck[this.idx];
    return {
      phase: this.phase,
      index: this.idx + 1, total: this.deck.length,
      question: q?.q ?? '', options: q?.options ?? [],
      timeLeft: this.timeLeft, duration: this.phase === 'reveal' ? REVEAL : TIME,
      myVote: this.votes.get(playerId) ?? null,
      votedCount: this.votes.size, totalPlayers: this.scores.size,
      counts: this.phase === 'reveal' ? this.counts : null,
      leaderboard: this.board().map((b) => ({ name: b.label, score: b.score, isMe: b.id === playerId })),
      actions: this.phase === 'question' && !this.votes.has(playerId) ? ['vote'] : [],
    };
  }
}
