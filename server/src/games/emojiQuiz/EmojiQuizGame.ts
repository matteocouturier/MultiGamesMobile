import { GameContext, GameInstance } from '../../core/game';
import { GameResults } from '../../shared/types';
import { pickFresh } from '../shared/freshDeck';

interface EQ { emojis: string; options: [string, string, string, string]; correct: 0 | 1 | 2 | 3 }
const PUZZLES: EQ[] = [
  { emojis: '🦁👑', options: ['Le Roi Lion', 'Madagascar', 'Tarzan', 'Jumanji'], correct: 0 },
  { emojis: '🕷️🧑', options: ['Batman', 'Spider-Man', 'Ant-Man', 'Hulk'], correct: 1 },
  { emojis: '❄️⛄👸', options: ['Raiponce', 'Cendrillon', 'La Reine des Neiges', 'Vaiana'], correct: 2 },
  { emojis: '🐠🔍', options: ['Le Monde de Nemo', 'Shark Tale', 'La Petite Sirène', 'Ponyo'], correct: 0 },
  { emojis: '🤖❤️', options: ['Terminator', 'Wall-E', 'Transformers', 'Big Hero 6'], correct: 1 },
  { emojis: '🧙⚡🦉', options: ['Le Seigneur des Anneaux', 'Narnia', 'Harry Potter', 'Merlin'], correct: 2 },
  { emojis: '🦖🏝️', options: ['King Kong', 'Godzilla', 'Avatar', 'Jurassic Park'], correct: 3 },
  { emojis: '🚢🧊💔', options: ['Titanic', 'Poseidon', 'Pirates des Caraïbes', 'Le Jour d’après'], correct: 0 },
  { emojis: '👻🚫', options: ['Casper', 'Ghostbusters', 'Beetlejuice', 'Scream'], correct: 1 },
  { emojis: '🐭🏰', options: ['Ratatouille', 'Stuart Little', 'Disneyland', 'Cendrillon'], correct: 2 },
  { emojis: '🟦👨‍🦱🌍', options: ['Shrek', 'Hulk', 'Les Schtroumpfs', 'Avatar'], correct: 3 },
  { emojis: '🍫🏭', options: ['Charlie et la Chocolaterie', 'Wonka', 'Matilda', 'Hansel et Gretel'], correct: 0 },
  { emojis: '🦇🌃', options: ['Dracula', 'Batman', 'Gotham', 'Twilight'], correct: 1 },
  { emojis: '🐝🎬', options: ['Antz', 'Bee Movie', 'Maya l’abeille', 'A Bug’s Life'], correct: 1 },
  { emojis: '🤡🎈', options: ['Ça', 'Joker', 'Saw', 'Halloween'], correct: 0 },
  { emojis: '🦇🚗', options: ['Batman', 'Cars', 'Fast & Furious', 'Gotham'], correct: 0 },
  { emojis: '👽📞🏠', options: ['Men in Black', 'E.T.', 'Signs', 'Arrival'], correct: 1 },
  { emojis: '🧸👮', options: ['Ted', 'Paddington', 'Winnie l’ourson', 'Toy Story'], correct: 0 },
  { emojis: '🐷🕷️🕸️', options: ['Babe', 'Charlotte’s Web', 'Trois petits cochons', 'Shrek'], correct: 1 },
  { emojis: '🏎️⚡', options: ['Cars', 'Speed', 'Le Mans', 'Need for Speed'], correct: 0 },
  { emojis: '👸🐸', options: ['Shrek', 'La Princesse et la Grenouille', 'Raiponce', 'Mulan'], correct: 1 },
  { emojis: '🌽👶👨‍🌾', options: ['Les Enfants du maïs', 'Interstellar', 'La Ferme', 'Signs'], correct: 0 },
  { emojis: '🦈🌊', options: ['Le Monde de Nemo', 'Les Dents de la mer', 'Aquaman', 'Pirates'], correct: 1 },
  { emojis: '🤠🚀', options: ['Buzz l’Éclair', 'Toy Story', 'Cowboys & Aliens', 'Wall-E'], correct: 1 },
  { emojis: '🐉🏹', options: ['Mulan', 'Dragons', 'Brave', 'Raya'], correct: 1 },
  { emojis: '🧛🌙🐺', options: ['Twilight', 'Hôtel Transylvanie', 'Dracula', 'Underworld'], correct: 0 },
  { emojis: '👨‍🚀🌌🥔', options: ['Gravity', 'Interstellar', 'Seul sur Mars', 'Apollo 13'], correct: 2 },
  { emojis: '🦸‍♂️🛡️🇺🇸', options: ['Iron Man', 'Captain America', 'Thor', 'Hulk'], correct: 1 },
];
const TIME = 15, REVEAL = 4, NB = 8;

/** Quiz Emoji — devine ce que représentent les emojis (QCM, points à la rapidité). */
export class EmojiQuizGame implements GameInstance {
  private phase: 'question' | 'reveal' | 'ended' = 'question';
  private deck: EQ[] = [];
  private idx = 0;
  private timeLeft = TIME;
  private scores = new Map<string, number>();
  private names = new Map<string, string>();
  private answers = new Map<string, { c: number; t: number }>();

  constructor(private ctx: GameContext) {}
  start(): void {
    for (const p of this.ctx.players()) { this.scores.set(p.id, 0); this.names.set(p.id, p.name); }
    this.deck = pickFresh(`emoji-quiz:${this.ctx.roomCode}`, PUZZLES, NB, (p) => p.emojis);
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
    const c = this.deck[this.idx].correct;
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
    this.ctx.endGame({ gameId: 'emoji-quiz', ranking: r, summary: r[0] ? `🏆 ${r[0].label} gagne !` : undefined } as GameResults);
  }
  getStateFor(playerId: string): unknown {
    const q = this.deck[this.idx];
    const reveal = this.phase === 'reveal';
    const mine = this.answers.get(playerId);
    return {
      phase: this.phase,
      index: this.idx + 1, total: this.deck.length,
      emojis: q?.emojis ?? '', options: q?.options ?? [],
      timeLeft: this.timeLeft, duration: reveal ? REVEAL : TIME,
      myAnswer: mine?.c ?? null,
      correctIndex: reveal ? q?.correct ?? null : null,
      iWasRight: reveal ? mine?.c === q?.correct : null,
      answeredCount: this.answers.size, totalPlayers: this.scores.size,
      leaderboard: this.board(),
      actions: this.phase === 'question' && !mine ? ['answer'] : [],
    };
  }
}
