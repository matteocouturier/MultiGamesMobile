import { GameContext, GameInstance } from '../../core/game';
import { GameResults } from '../../shared/types';

const CATEGORIES = ['Prénom', 'Animal', 'Ville', 'Métier', 'Objet'];
const LETTERS = 'ABCDEFGHILMNOPRST'.split('');
const ROUNDS = 3;
const PLAY_TIME = 120; // seconds
const GRACE = 8; // seconds left for others once someone stops
const REVEAL_TIME = 9;

function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * Petit Bac — free-for-all. A letter is drawn; everyone fills one answer per
 * category starting with that letter before the timer. Scoring is automatic:
 * valid & unique = 2 pts, valid but duplicated = 1 pt, empty/invalid = 0.
 */
export class PetitBacGame implements GameInstance {
  private phase: 'play' | 'reveal' | 'ended' = 'play';
  private round = 0;
  private letter = '';
  private timeLeft = PLAY_TIME;
  private answers = new Map<string, string[]>();
  private submitted = new Set<string>();
  private scores = new Map<string, number>();
  private names = new Map<string, string>();
  private lastRound: { id: string; name: string; cells: { cat: string; value: string; points: number }[]; total: number }[] = [];

  constructor(private ctx: GameContext) {}

  start(): void {
    for (const p of this.ctx.players()) {
      this.scores.set(p.id, 0);
      this.names.set(p.id, p.name);
    }
    this.startRound();
    this.ctx.setInterval(() => this.tick(), 1000);
  }

  dispose(): void {}

  private startRound(): void {
    this.round += 1;
    this.phase = 'play';
    this.letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    this.timeLeft = PLAY_TIME;
    this.answers.clear();
    this.submitted.clear();
    this.ctx.broadcastState();
  }

  private tick(): void {
    if (this.phase === 'play') {
      this.timeLeft -= 1;
      if (this.timeLeft <= 0) this.reveal();
      else this.ctx.broadcastState();
    } else if (this.phase === 'reveal') {
      this.timeLeft -= 1;
      if (this.timeLeft <= 0) {
        if (this.round >= ROUNDS) this.endGame();
        else this.startRound();
      } else {
        this.ctx.broadcastState();
      }
    }
  }

  handleAction(playerId: string, type: string, payload?: unknown): void {
    if (this.phase !== 'play' || type !== 'submit') return;
    if (this.submitted.has(playerId)) return;
    const arr = typeof payload === 'object' && payload && 'answers' in payload ? (payload as any).answers : [];
    const clean: string[] = CATEGORIES.map((_, i) => String(arr?.[i] ?? '').slice(0, 24));
    this.answers.set(playerId, clean);
    this.submitted.add(playerId);
    this.ctx.emitEvent({ type: 'stopped', payload: { name: this.names.get(playerId) } }, undefined);

    // First to finish triggers a short grace for everyone else.
    if (this.submitted.size === 1 && this.timeLeft > GRACE) this.timeLeft = GRACE;
    if (this.submitted.size >= this.scores.size) this.reveal();
    else this.ctx.broadcastState();
  }

  private reveal(): void {
    this.phase = 'reveal';
    this.timeLeft = REVEAL_TIME;
    const ids = [...this.scores.keys()];

    // Per-category occurrence counts of normalized valid answers.
    this.lastRound = ids.map((id) => {
      const ans = this.answers.get(id) ?? [];
      const cells = CATEGORIES.map((cat, i) => {
        const value = (ans[i] ?? '').trim();
        const n = normalize(value);
        const valid = n.length > 0 && n[0] === this.letter.toLowerCase();
        let points = 0;
        if (valid) {
          const dup = ids.some((other) => {
            if (other === id) return false;
            const oa = normalize((this.answers.get(other) ?? [])[i] ?? '');
            return oa.length > 0 && oa === n;
          });
          points = dup ? 1 : 2;
        }
        return { cat, value, points };
      });
      const total = cells.reduce((a, c) => a + c.points, 0);
      this.scores.set(id, (this.scores.get(id) ?? 0) + total);
      return { id, name: this.names.get(id) ?? '?', cells, total };
    });
    this.ctx.broadcastState();
  }

  onPlayerLeave(playerId: string): void {
    if (this.phase === 'play' && this.submitted.size >= this.scores.size - 1) {
      // remaining all submitted -> proceed
    }
    if (this.phase !== 'ended') this.ctx.broadcastState();
  }

  private leaderboard() {
    return [...this.scores.entries()]
      .map(([id, score]) => ({ label: this.names.get(id) ?? '?', score }))
      .sort((a, b) => b.score - a.score);
  }

  private endGame(): void {
    this.phase = 'ended';
    const ranking = this.leaderboard();
    this.ctx.endGame({
      gameId: 'petit-bac',
      ranking,
      summary: ranking[0] ? `🏆 ${ranking[0].label} gagne avec ${ranking[0].score} points !` : undefined,
    } as GameResults);
  }

  getStateFor(playerId: string): unknown {
    return {
      phase: this.phase,
      round: this.round,
      totalRounds: ROUNDS,
      letter: this.letter,
      categories: CATEGORIES,
      timeLeft: this.timeLeft,
      myAnswers: this.answers.get(playerId) ?? CATEGORIES.map(() => ''),
      iSubmitted: this.submitted.has(playerId),
      submittedCount: this.submitted.size,
      totalPlayers: this.scores.size,
      results: this.phase === 'reveal' ? this.lastRound : null,
      leaderboard: this.leaderboard(),
      actions: this.phase === 'play' && !this.submitted.has(playerId) ? ['submit'] : [],
    };
  }
}
