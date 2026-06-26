import { GameContext, GameInstance } from '../../core/game';
import { GameResults } from '../../shared/types';

interface Statement { text: string; answer: boolean }
const STATEMENTS: Statement[] = [
  { text: 'La Grande Muraille de Chine est visible depuis la Lune à l’œil nu.', answer: false },
  { text: 'Le miel ne périme jamais.', answer: true },
  { text: 'Les poissons rouges n’ont que 3 secondes de mémoire.', answer: false },
  { text: 'Un éclair est plus chaud que la surface du Soleil.', answer: true },
  { text: 'Les humains n’utilisent que 10% de leur cerveau.', answer: false },
  { text: 'La tomate est techniquement un fruit.', answer: true },
  { text: 'Le sang humain est bleu dans les veines.', answer: false },
  { text: 'Les pieuvres ont trois cœurs.', answer: true },
  { text: 'On avale 8 araignées par an en dormant.', answer: false },
  { text: 'La tour Eiffel grandit en été.', answer: true },
  { text: 'Les bananes poussent sur des arbres.', answer: false },
  { text: 'Le requin existait avant les arbres.', answer: true },
  { text: 'Les chauves-souris sont aveugles.', answer: false },
  { text: 'Il est impossible d’éternuer les yeux ouverts.', answer: true },
  { text: 'Vénus est la planète la plus chaude du système solaire.', answer: true },
  { text: 'Les autruches cachent leur tête dans le sable quand elles ont peur.', answer: false },
];

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

const TIME = 10;
const REVEAL = 4;
const NB = 8;

/** Vrai ou Faux — répondez vite, points à la rapidité. */
export class TrueFalseGame implements GameInstance {
  private phase: 'question' | 'reveal' | 'ended' = 'question';
  private deck: Statement[] = [];
  private idx = 0;
  private timeLeft = TIME;
  private scores = new Map<string, number>();
  private names = new Map<string, string>();
  private answers = new Map<string, { val: boolean; t: number }>();

  constructor(private ctx: GameContext) {}

  start(): void {
    for (const p of this.ctx.players()) { this.scores.set(p.id, 0); this.names.set(p.id, p.name); }
    this.deck = shuffle(STATEMENTS).slice(0, NB);
    this.begin();
    this.ctx.setInterval(() => this.tick(), 1000);
  }
  dispose(): void {}

  private begin(): void { this.phase = 'question'; this.timeLeft = TIME; this.answers.clear(); this.ctx.broadcastState(); }

  private tick(): void {
    if (this.phase === 'question') {
      this.timeLeft -= 1;
      if (this.timeLeft <= 0 || this.answers.size >= this.scores.size) this.reveal();
      else this.ctx.broadcastState();
    } else if (this.phase === 'reveal') {
      this.timeLeft -= 1;
      if (this.timeLeft <= 0) this.next();
      else this.ctx.broadcastState();
    }
  }

  private reveal(): void {
    this.phase = 'reveal'; this.timeLeft = REVEAL;
    const correct = this.deck[this.idx].answer;
    for (const [id, a] of this.answers) if (a.val === correct) this.scores.set(id, (this.scores.get(id) ?? 0) + 500 + Math.round(500 * a.t / TIME));
    this.ctx.broadcastState();
  }
  private next(): void { this.idx += 1; if (this.idx >= this.deck.length) this.end(); else this.begin(); }

  handleAction(playerId: string, type: string, payload?: unknown): void {
    if (this.phase !== 'question' || type !== 'answer' || this.answers.has(playerId)) return;
    const val = !!(payload as any)?.value;
    this.answers.set(playerId, { val, t: this.timeLeft });
    this.ctx.emitEvent({ type: 'answered' }, playerId);
    this.ctx.broadcastState();
  }
  onPlayerLeave(id: string): void { this.answers.delete(id); if (this.phase !== 'ended') this.ctx.broadcastState(); }

  private board() { return [...this.scores.entries()].map(([id, s]) => ({ label: this.names.get(id) ?? '?', score: s })).sort((a, b) => b.score - a.score); }
  private end(): void {
    this.phase = 'ended';
    const r = this.board();
    this.ctx.endGame({ gameId: 'true-false', ranking: r, summary: r[0] ? `🏆 ${r[0].label} gagne !` : undefined } as GameResults);
  }

  getStateFor(playerId: string): unknown {
    const reveal = this.phase === 'reveal';
    const mine = this.answers.get(playerId);
    return {
      phase: this.phase,
      index: this.idx + 1, total: this.deck.length,
      statement: this.deck[this.idx]?.text ?? '',
      timeLeft: this.timeLeft, duration: reveal ? REVEAL : TIME,
      myAnswer: mine ? mine.val : null,
      correct: reveal ? this.deck[this.idx]?.answer : null,
      iWasRight: reveal ? mine?.val === this.deck[this.idx]?.answer : null,
      answeredCount: this.answers.size, totalPlayers: this.scores.size,
      leaderboard: this.board(),
      actions: this.phase === 'question' && !mine ? ['answer'] : [],
    };
  }
}
