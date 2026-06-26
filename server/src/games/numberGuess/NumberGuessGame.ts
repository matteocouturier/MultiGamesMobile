import { GameContext, GameInstance } from '../../core/game';
import { GameResults } from '../../shared/types';
import { pickFresh } from '../shared/freshDeck';

interface NQ { q: string; answer: number; unit?: string }
const QUESTIONS: NQ[] = [
  { q: 'Combien d’os y a-t-il dans le corps humain adulte ?', answer: 206 },
  { q: 'Combien de pays font partie de l’ONU ?', answer: 193 },
  { q: 'En quelle année l’Homme a-t-il marché sur la Lune ?', answer: 1969 },
  { q: 'Combien de touches sur un piano standard ?', answer: 88 },
  { q: 'Combien de jours dure une grossesse humaine (environ) ?', answer: 280, unit: 'jours' },
  { q: 'Quelle est la hauteur de la Tour Eiffel ?', answer: 330, unit: 'm' },
  { q: 'Combien de cartes dans un jeu de 52 (sans jokers) ?', answer: 52 },
  { q: 'Combien de muscles environ dans le corps humain ?', answer: 600 },
  { q: 'À quelle température bout l’eau (au niveau de la mer) ?', answer: 100, unit: '°C' },
  { q: 'Combien de minutes dans une journée ?', answer: 1440 },
  { q: 'Combien de dents a un adulte (avec les dents de sagesse) ?', answer: 32 },
  { q: 'Quelle est la vitesse max d’un guépard ?', answer: 110, unit: 'km/h' },
  { q: 'Combien de pattes a une fourmi ?', answer: 6 },
  { q: 'Combien d’années dure le mandat d’un président français ?', answer: 5, unit: 'ans' },
  { q: 'Combien de continents sur Terre ?', answer: 7 },
  { q: 'Combien de cases sur un échiquier ?', answer: 64 },
  { q: 'En quelle année a coulé le Titanic ?', answer: 1912 },
  { q: 'Combien de planètes dans le système solaire ?', answer: 8 },
  { q: 'Combien de litres de sang dans le corps humain (environ) ?', answer: 5, unit: 'L' },
  { q: 'Quelle est la longueur d’un marathon ?', answer: 42, unit: 'km' },
  { q: 'Combien de cordes sur un violon ?', answer: 4 },
  { q: 'À combien de km/h roule un TGV en moyenne ?', answer: 300, unit: 'km/h' },
  { q: 'Combien de joueurs sur un terrain de rugby (par équipe) ?', answer: 15 },
  { q: 'Combien d’années dans un siècle ?', answer: 100, unit: 'ans' },
  { q: 'Combien d’étoiles sur le drapeau européen ?', answer: 12 },
  { q: 'Combien de degrés dans un cercle ?', answer: 360, unit: '°' },
  { q: 'Combien de chromosomes possède l’humain ?', answer: 46 },
];
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
