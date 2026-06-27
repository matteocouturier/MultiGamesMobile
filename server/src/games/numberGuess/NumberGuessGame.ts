import { GameContext, GameInstance } from '../../core/game';
import { GameResults } from '../../shared/types';
import { pickFresh } from '../shared/freshDeck';
import questionsData from '../../content/number-guess.json';

interface NQ { q: string; answer: number; unit?: string }
const QUESTIONS: NQ[] = questionsData as NQ[];
const ROUNDS = 5;
const TIME = 20;
const REVEAL = 6;

/** La Question — devine la valeur numérique. Le plus proche marque le plus de points. */
export class NumberGuessGame implements GameInstance {
  private phase: 'question' | 'reveal' | 'ended' = 'question';
  private deck: NQ[] = [];
  private idx = 0;
  private timeLeft = TIME;
  private scores = new Map<string, number>();
  private names = new Map<string, string>();
  private guesses = new Map<string, number>();

  constructor(private ctx: GameContext) {}

  start(): void {
    for (const p of this.ctx.players()) { this.scores.set(p.id, 0); this.names.set(p.id, p.name); }
    this.deck = pickFresh(`number-guess:${this.ctx.roomCode}`, QUESTIONS, ROUNDS, (q) => q.q);
    this.begin();
    this.ctx.setInterval(() => this.tick(), 1000);
  }
  dispose(): void {}

  private begin(): void { this.phase = 'question'; this.timeLeft = TIME; this.guesses.clear(); this.ctx.broadcastState(); }
  private tick(): void {
    if (this.phase === 'question') { this.timeLeft -= 1; if (this.timeLeft <= 0 || this.guesses.size >= this.scores.size) this.reveal(); else this.ctx.broadcastState(); }
    else if (this.phase === 'reveal') { this.timeLeft -= 1; if (this.timeLeft <= 0) this.next(); else this.ctx.broadcastState(); }
  }
  private reveal(): void {
    this.phase = 'reveal'; this.timeLeft = REVEAL;
    const ans = this.deck[this.idx].answer;
    // Rank by absolute distance; award 3/2/1 to the 3 closest who guessed.
    const ranked = [...this.guesses.entries()].map(([id, g]) => ({ id, dist: Math.abs(g - ans) })).sort((a, b) => a.dist - b.dist);
    const award = [3, 2, 1];
    ranked.forEach((r, i) => { if (i < award.length) this.scores.set(r.id, (this.scores.get(r.id) ?? 0) + award[i]); });
    this.ctx.broadcastState();
  }
  private next(): void { this.idx += 1; if (this.idx >= this.deck.length) this.end(); else this.begin(); }

  handleAction(playerId: string, type: string, payload?: unknown): void {
    if (this.phase !== 'question' || type !== 'guess' || this.guesses.has(playerId)) return;
    const v = Math.round(Number((payload as any)?.value));
    if (!Number.isFinite(v)) return;
    this.guesses.set(playerId, v);
    this.ctx.emitEvent({ type: 'answered' }, playerId);
    this.ctx.broadcastState();
  }
  onPlayerLeave(id: string): void { this.guesses.delete(id); if (this.phase !== 'ended') this.ctx.broadcastState(); }

  private board() { return [...this.scores.entries()].map(([id, s]) => ({ id, label: this.names.get(id) ?? '?', score: s })).sort((a, b) => b.score - a.score); }
  private end(): void {
    this.phase = 'ended';
    const r = this.board().map(({ label, score }) => ({ label, score }));
    this.ctx.endGame({ gameId: 'number-guess', ranking: r, summary: r[0] ? `🏆 ${r[0].label} gagne !` : undefined } as GameResults);
  }

  getStateFor(playerId: string): unknown {
    const q = this.deck[this.idx];
    const reveal = this.phase === 'reveal';
    return {
      phase: this.phase,
      round: this.idx + 1, totalRounds: this.deck.length,
      question: q?.q ?? '', unit: q?.unit ?? '',
      timeLeft: this.timeLeft, duration: reveal ? REVEAL : TIME,
      myGuess: this.guesses.get(playerId) ?? null,
      answeredCount: this.guesses.size, totalPlayers: this.scores.size,
      answer: reveal ? q?.answer ?? null : null,
      guesses: reveal ? [...this.guesses.entries()].map(([id, g]) => ({ name: this.names.get(id), value: g, dist: Math.abs(g - (q?.answer ?? 0)) })).sort((a, b) => a.dist - b.dist) : null,
      leaderboard: this.board().map((b) => ({ name: b.label, score: b.score, isMe: b.id === playerId })),
      actions: this.phase === 'question' && !this.guesses.has(playerId) ? ['guess'] : [],
    };
  }
}
