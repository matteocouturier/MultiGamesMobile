import { GameContext, GameInstance } from '../../core/game';
import { GameResults } from '../../shared/types';
import { pickFresh } from '../shared/freshDeck';

const WORDS = [
  'maison', 'jardin', 'orange', 'cheval', 'fenetre', 'voiture', 'montagne', 'banane',
  'lumiere', 'fromage', 'bouteille', 'ordinateur', 'telephone', 'chocolat', 'musique',
  'fleur', 'soleil', 'nuage', 'tortue', 'guitare', 'paysage', 'cuisine', 'voyage',
  'crayon', 'tableau', 'bonjour', 'famille', 'animal', 'plante', 'riviere',
  'fenetre', 'ballon', 'bateau', 'avion', 'ecole', 'cahier', 'lecture', 'peinture',
  'dauphin', 'requin', 'abeille', 'papillon', 'caillou', 'parapluie', 'horloge',
  'fontaine', 'bibliotheque', 'aventure', 'dragon', 'sorciere', 'chateau', 'tresor',
  'planete', 'galaxie', 'comete', 'desert', 'foret', 'cascade', 'volcan', 'sentier',
  'casquette', 'echarpe', 'manteau', 'sandales', 'pantalon', 'chaussure',
];
const ROUNDS = 6;
const TIME = 30;
const REVEAL = 4;

function norm(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
}
function scramble(word: string): string {
  const letters = word.split('');
  for (let attempt = 0; attempt < 10; attempt++) {
    for (let i = letters.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [letters[i], letters[j]] = [letters[j], letters[i]]; }
    if (letters.join('') !== word) break;
  }
  return letters.join('');
}

/** Anagrammes — remets les lettres dans l'ordre, le plus rapide gagne la manche. */
export class AnagramGame implements GameInstance {
  private phase: 'round' | 'reveal' | 'ended' = 'round';
  private deck: string[] = [];
  private idx = 0;
  private scrambled = '';
  private timeLeft = TIME;
  private wins = new Map<string, number>();
  private names = new Map<string, string>();
  private winnerId: string | null = null;

  constructor(private ctx: GameContext) {}

  start(): void {
    for (const p of this.ctx.players()) { this.wins.set(p.id, 0); this.names.set(p.id, p.name); }
    this.deck = pickFresh(`anagram:${this.ctx.roomCode}`, WORDS, ROUNDS, (w) => w);
    this.begin();
    this.ctx.setInterval(() => this.tick(), 1000);
  }
  dispose(): void {}

  private begin(): void {
    this.phase = 'round'; this.timeLeft = TIME; this.winnerId = null;
    this.scrambled = scramble(norm(this.deck[this.idx])).toUpperCase();
    this.ctx.broadcastState();
  }
  private tick(): void {
    if (this.phase === 'round') { this.timeLeft -= 1; if (this.timeLeft <= 0) this.reveal(); else this.ctx.broadcastState(); }
    else if (this.phase === 'reveal') { this.timeLeft -= 1; if (this.timeLeft <= 0) this.next(); else this.ctx.broadcastState(); }
  }
  private reveal(): void { this.phase = 'reveal'; this.timeLeft = REVEAL; this.ctx.broadcastState(); }
  private next(): void { this.idx += 1; if (this.idx >= this.deck.length) this.end(); else this.begin(); }

  handleAction(playerId: string, type: string, payload?: unknown): void {
    if (this.phase !== 'round' || type !== 'submit') return;
    const guess = norm(String((payload as any)?.word ?? ''));
    if (!guess) return;
    if (guess === norm(this.deck[this.idx])) {
      this.winnerId = playerId;
      this.wins.set(playerId, (this.wins.get(playerId) ?? 0) + 1);
      this.ctx.emitEvent({ type: 'ok', payload: { name: this.names.get(playerId), word: this.deck[this.idx] } });
      this.reveal();
    } else {
      this.ctx.emitEvent({ type: 'invalid', payload: { reason: 'mauvais mot' } }, playerId);
    }
  }
  onPlayerLeave(id: string): void { this.wins.delete(id); this.names.delete(id); if (this.phase !== 'ended') this.ctx.broadcastState(); }

  private board() { return [...this.wins.entries()].map(([id, w]) => ({ id, label: this.names.get(id) ?? '?', score: w })).sort((a, b) => b.score - a.score); }
  private end(): void {
    this.phase = 'ended';
    const r = this.board().map(({ label, score }) => ({ label, score }));
    this.ctx.endGame({ gameId: 'anagram', ranking: r, summary: r[0] ? `🏆 ${r[0].label} gagne !` : undefined } as GameResults);
  }

  getStateFor(playerId: string): unknown {
    return {
      phase: this.phase,
      round: this.idx + 1, totalRounds: this.deck.length,
      scrambled: this.scrambled,
      timeLeft: this.timeLeft, duration: this.phase === 'reveal' ? REVEAL : TIME,
      solution: this.phase === 'reveal' ? this.deck[this.idx] : null,
      winnerName: this.winnerId ? this.names.get(this.winnerId) : null,
      iWon: this.winnerId === playerId,
      scores: this.board().map((b) => ({ name: b.label, wins: b.score, isMe: b.id === playerId })),
      actions: this.phase === 'round' ? ['submit'] : [],
    };
  }
}
