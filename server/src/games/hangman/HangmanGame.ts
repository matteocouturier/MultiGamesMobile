import { GameContext, GameInstance } from '../../core/game';
import { GameResults } from '../../shared/types';
import { pickFresh } from '../shared/freshDeck';
import wordsData from '../../content/hangman.json';

const WORDS: string[] = wordsData as string[];
const ROUNDS = 4;
const MAX_ERRORS = 8;
const REVEAL_MS = 4500;

/** Le Pendu — chacun propose des lettres pour révéler le mot. Lettre trouvée = points.
 *  Trop d'erreurs = manche perdue. */
export class HangmanGame implements GameInstance {
  private phase: 'play' | 'reveal' | 'ended' = 'play';
  private round = 0;
  private word = '';
  private revealed: boolean[] = [];
  private guessed = new Set<string>();
  private errors = 0;
  private scores = new Map<string, number>();
  private names = new Map<string, string>();
  private token = 0;

  constructor(private ctx: GameContext) {}

  start(): void {
    for (const p of this.ctx.players()) { this.scores.set(p.id, 0); this.names.set(p.id, p.name); }
    this.begin();
  }
  dispose(): void {}

  private begin(): void {
    this.round += 1;
    this.word = pickFresh(`hangman:${this.ctx.roomCode}`, WORDS, 1, (w) => w)[0];
    this.revealed = this.word.split('').map(() => false);
    this.guessed.clear();
    this.errors = 0;
    this.phase = 'play';
    this.ctx.broadcastState();
  }

  private allRevealed(): boolean { return this.revealed.every(Boolean); }

  handleAction(playerId: string, type: string, payload?: unknown): void {
    if (this.phase !== 'play') return;
    if (type === 'letter') {
      const ch = String((payload as any)?.char ?? '').toLowerCase().replace(/[^a-z]/g, '').slice(0, 1);
      if (!ch || this.guessed.has(ch)) return;
      this.guessed.add(ch);
      let hits = 0;
      this.word.split('').forEach((c, i) => { if (c === ch) { this.revealed[i] = true; hits += 1; } });
      if (hits > 0) {
        this.scores.set(playerId, (this.scores.get(playerId) ?? 0) + hits);
        this.ctx.emitEvent({ type: 'ok', payload: { word: ch.toUpperCase() } });
        if (this.allRevealed()) return this.endRound(true);
      } else {
        this.errors += 1;
        this.ctx.emitEvent({ type: 'invalid', payload: { reason: `pas de ${ch.toUpperCase()}` } }, playerId);
        if (this.errors >= MAX_ERRORS) return this.endRound(false);
      }
      this.ctx.broadcastState();
    } else if (type === 'word') {
      const guess = String((payload as any)?.word ?? '').toLowerCase().replace(/[^a-z]/g, '');
      if (!guess) return;
      if (guess === this.word) {
        this.revealed = this.revealed.map(() => true);
        this.scores.set(playerId, (this.scores.get(playerId) ?? 0) + 5);
        this.ctx.emitEvent({ type: 'ok', payload: { word: this.word.toUpperCase() } });
        this.endRound(true);
      } else {
        this.errors += 1;
        this.ctx.emitEvent({ type: 'invalid', payload: { reason: 'mauvais mot' } }, playerId);
        if (this.errors >= MAX_ERRORS) this.endRound(false);
        else this.ctx.broadcastState();
      }
    }
  }

  private endRound(_won: boolean): void {
    this.revealed = this.revealed.map(() => true);
    this.phase = 'reveal';
    this.ctx.broadcastState();
    const tk = ++this.token;
    this.ctx.setTimeout(() => {
      if (tk !== this.token) return;
      if (this.round >= ROUNDS) this.end();
      else this.begin();
    }, REVEAL_MS);
  }

  onPlayerLeave(id: string): void { if (this.phase !== 'ended') this.ctx.broadcastState(); void id; }

  private board() { return [...this.scores.entries()].map(([id, s]) => ({ id, label: this.names.get(id) ?? '?', score: s })).sort((a, b) => b.score - a.score); }
  private end(): void {
    this.phase = 'ended';
    const r = this.board().map(({ label, score }) => ({ label, score }));
    this.ctx.endGame({ gameId: 'hangman', ranking: r, summary: r[0] ? `🏆 ${r[0].label} gagne !` : undefined } as GameResults);
  }

  getStateFor(playerId: string): unknown {
    const reveal = this.phase !== 'play';
    return {
      phase: this.phase,
      round: this.round, totalRounds: ROUNDS,
      masked: this.word.split('').map((c, i) => (this.revealed[i] ? c.toUpperCase() : '_')),
      guessed: [...this.guessed].map((c) => c.toUpperCase()).sort(),
      errors: this.errors, maxErrors: MAX_ERRORS,
      word: reveal ? this.word.toUpperCase() : null,
      leaderboard: this.board().map((b) => ({ name: b.label, score: b.score, isMe: b.id === playerId })),
      actions: this.phase === 'play' ? ['letter', 'word'] : [],
    };
  }
}
