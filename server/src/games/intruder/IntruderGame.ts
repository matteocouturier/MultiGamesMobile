import { GameContext, GameInstance } from '../../core/game';
import { GameResults } from '../../shared/types';
import { pickFresh } from '../shared/freshDeck';

interface IQ { items: [string, string, string, string]; intruder: 0 | 1 | 2 | 3; hint: string }
const PUZZLES: IQ[] = [
  { items: ['🍎 Pomme', '🍌 Banane', '🥕 Carotte', '🍒 Cerise'], intruder: 2, hint: 'fruits' },
  { items: ['🐶 Chien', '🐱 Chat', '🐟 Poisson', '🚗 Voiture'], intruder: 3, hint: 'animaux' },
  { items: ['⚽ Foot', '🎾 Tennis', '🏀 Basket', '🎹 Piano'], intruder: 3, hint: 'sports' },
  { items: ['🔴 Rouge', '🔵 Bleu', '🟢 Vert', '🐘 Éléphant'], intruder: 3, hint: 'couleurs' },
  { items: ['Paris', 'Lyon', 'Berlin', 'Marseille'], intruder: 2, hint: 'villes françaises' },
  { items: ['Lundi', 'Mardi', 'Juillet', 'Vendredi'], intruder: 2, hint: 'jours' },
  { items: ['Lion', 'Tigre', 'Panthère', 'Mouton'], intruder: 3, hint: 'félins' },
  { items: ['🍕 Pizza', '🍔 Burger', '🌮 Tacos', '👟 Basket'], intruder: 3, hint: 'plats' },
  { items: ['Rose', 'Tulipe', 'Chêne', 'Marguerite'], intruder: 2, hint: 'fleurs' },
  { items: ['Guitare', 'Violon', 'Trompette', 'Marteau'], intruder: 3, hint: 'instruments' },
  { items: ['Mars', 'Vénus', 'Lune', 'Jupiter'], intruder: 2, hint: 'planètes' },
  { items: ['Pouce', 'Index', 'Genou', 'Majeur'], intruder: 2, hint: 'doigts' },
  { items: ['Bleu', 'Carré', 'Triangle', 'Cercle'], intruder: 0, hint: 'formes' },
  { items: ['Requin', 'Dauphin', 'Thon', 'Aigle'], intruder: 3, hint: 'animaux marins' },
  { items: ['Janvier', 'Avril', 'Lundi', 'Août'], intruder: 2, hint: 'mois' },
  { items: ['Carotte', 'Patate', 'Poireau', 'Fraise'], intruder: 3, hint: 'légumes' },
];
const TIME = 12, REVEAL = 4, NB = 8;

/** Devine l'intrus — trouve l'élément qui n'appartient pas à la catégorie. QCM rapide. */
export class IntruderGame implements GameInstance {
  private phase: 'question' | 'reveal' | 'ended' = 'question';
  private deck: IQ[] = [];
  private idx = 0;
  private timeLeft = TIME;
  private scores = new Map<string, number>();
  private names = new Map<string, string>();
  private answers = new Map<string, { c: number; t: number }>();

  constructor(private ctx: GameContext) {}
  start(): void {
    for (const p of this.ctx.players()) { this.scores.set(p.id, 0); this.names.set(p.id, p.name); }
    this.deck = pickFresh(`intruder:${this.ctx.roomCode}`, PUZZLES, NB, (p) => p.items.join('|'));
    this.begin();
    this.ctx.setInterval(() => this.tick(), 1000);
  }
  dispose(): void {}
  private begin(): void { this.phase = 'question'; this.timeLeft = TIME; this.answers.clear(); this.ctx.broadcastState(); }
  private tick(): void {
    if (this.phase === 'question') { this.timeLeft -= 1; if (this.timeLeft <= 0 || this.answers.size >= this.scores.size) this.reveal(); else this.ctx.broadcastState(); }
    else if (this.phase === 'reveal') { this.timeLeft -= 1; if (this.timeLeft <= 0) this.next(); else this.ctx.broadcastState(); }
  }
  private reveal(): void {
    this.phase = 'reveal'; this.timeLeft = REVEAL;
    const c = this.deck[this.idx].intruder;
    for (const [id, a] of this.answers) if (a.c === c) this.scores.set(id, (this.scores.get(id) ?? 0) + 500 + Math.round(500 * a.t / TIME));
    this.ctx.broadcastState();
  }
  private next(): void { this.idx += 1; if (this.idx >= this.deck.length) this.end(); else this.begin(); }
  handleAction(playerId: string, type: string, payload?: unknown): void {
    if (this.phase !== 'question' || type !== 'answer' || this.answers.has(playerId)) return;
    const c = Number((payload as any)?.index);
    if (c < 0 || c > 3) return;
    this.answers.set(playerId, { c, t: this.timeLeft });
    this.ctx.emitEvent({ type: 'answered' }, playerId);
    this.ctx.broadcastState();
  }
  onPlayerLeave(id: string): void { this.answers.delete(id); if (this.phase !== 'ended') this.ctx.broadcastState(); }
  private board() { return [...this.scores.entries()].map(([id, s]) => ({ label: this.names.get(id) ?? '?', score: s })).sort((a, b) => b.score - a.score); }
  private end(): void {
    this.phase = 'ended';
    const r = this.board();
    this.ctx.endGame({ gameId: 'intruder', ranking: r, summary: r[0] ? `🏆 ${r[0].label} gagne !` : undefined } as GameResults);
  }
  getStateFor(playerId: string): unknown {
    const q = this.deck[this.idx];
    const reveal = this.phase === 'reveal';
    const mine = this.answers.get(playerId);
    return {
      phase: this.phase,
      index: this.idx + 1, total: this.deck.length,
      items: q?.items ?? [], hint: q?.hint ?? '',
      timeLeft: this.timeLeft, duration: reveal ? REVEAL : TIME,
      myAnswer: mine?.c ?? null,
      correctIndex: reveal ? q?.intruder ?? null : null,
      iWasRight: reveal ? mine?.c === q?.intruder : null,
      answeredCount: this.answers.size, totalPlayers: this.scores.size,
      leaderboard: this.board(),
      actions: this.phase === 'question' && !mine ? ['answer'] : [],
    };
  }
}
