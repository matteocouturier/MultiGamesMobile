import { GameContext, GameInstance } from '../../core/game';
import { GameResults } from '../../shared/types';
import { pickFresh } from '../shared/freshDeck';
import { getTeams } from '../shared/teams';

const PROMPTS = [
  'Un fruit', 'Un animal', 'Une couleur', 'Un pays', 'Un métier', 'Un sport',
  'Quelque chose de froid', 'Quelque chose de rouge', 'Un moyen de transport',
  'Un objet dans la cuisine', 'Une boisson', 'Un dessert', 'Un prénom de fille',
  'Un super-héros', 'Une partie du corps', 'Un instrument de musique', 'Une saison',
  'Un jour de la semaine', 'Quelque chose de rond', 'Un animal de la ferme',
];
const ROUNDS = 6;
const TIME = 25;
const REVEAL = 7;

function norm(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

/** Accord Parfait — par équipes de 2. Les deux coéquipiers écrivent un mot pour le
 *  thème ; s'ils écrivent le MÊME mot, l'équipe marque. Pensez pareil ! */
export class AccordGame implements GameInstance {
  private phase: 'play' | 'reveal' | 'ended' = 'play';
  private deck: string[] = [];
  private idx = 0;
  private timeLeft = TIME;
  private answers = new Map<string, string>();
  private scores = new Map<string, number>();
  private names = new Map<string, string>();
  private lastReveal: any[] = [];

  constructor(private ctx: GameContext) {}

  start(): void {
    for (const p of this.ctx.players()) this.names.set(p.id, p.name);
    for (const t of getTeams(this.ctx.players())) this.scores.set(t.id, 0);
    this.deck = pickFresh(`accord:${this.ctx.roomCode}`, PROMPTS, ROUNDS, (p) => p);
    this.begin();
    this.ctx.setInterval(() => this.tick(), 1000);
  }
  dispose(): void {}

  private begin(): void { this.phase = 'play'; this.timeLeft = TIME; this.answers.clear(); this.ctx.broadcastState(); }
  private tick(): void {
    if (this.phase === 'play') { this.timeLeft -= 1; if (this.timeLeft <= 0 || this.answers.size >= this.ctx.players().length) this.reveal(); else this.ctx.broadcastState(); }
    else if (this.phase === 'reveal') { this.timeLeft -= 1; if (this.timeLeft <= 0) this.next(); else this.ctx.broadcastState(); }
  }

  private reveal(): void {
    this.phase = 'reveal'; this.timeLeft = REVEAL;
    const teams = getTeams(this.ctx.players());
    this.lastReveal = teams.map((t) => {
      const answers = t.members.map((m) => ({ name: m.name, word: this.answers.get(m.id) ?? '' }));
      const norms = answers.map((a) => norm(a.word)).filter((w) => w.length > 0);
      const matched = norms.length >= 2 && norms.every((w) => w === norms[0]);
      const points = matched ? 2 : 0;
      this.scores.set(t.id, (this.scores.get(t.id) ?? 0) + points);
      return { id: t.id, name: t.name, color: t.color, answers, matched, points };
    });
    this.ctx.broadcastState();
  }
  private next(): void { this.idx += 1; if (this.idx >= this.deck.length) this.end(); else this.begin(); }

  handleAction(playerId: string, type: string, payload?: unknown): void {
    if (this.phase !== 'play' || type !== 'submit' || this.answers.has(playerId)) return;
    const word = String((payload as any)?.word ?? '').trim().slice(0, 24);
    if (!word) return;
    this.answers.set(playerId, word);
    this.ctx.emitEvent({ type: 'answered' }, playerId);
    this.ctx.broadcastState();
  }
  onPlayerLeave(id: string): void { this.answers.delete(id); if (this.phase !== 'ended') this.ctx.broadcastState(); }

  private board() {
    return getTeams(this.ctx.players())
      .map((t) => ({ name: t.name, color: t.color, score: this.scores.get(t.id) ?? 0 }))
      .sort((a, b) => b.score - a.score);
  }
  private end(): void {
    this.phase = 'ended';
    const ranking = this.board().map((t) => ({ label: `Équipe ${t.name}`, score: t.score, color: t.color }));
    this.ctx.endGame({ gameId: 'accord', ranking, summary: ranking[0] ? `🏆 L'équipe ${this.board()[0].name} est sur la même longueur d'onde !` : undefined } as GameResults);
  }

  getStateFor(playerId: string): unknown {
    const teams = getTeams(this.ctx.players());
    const myTeam = teams.find((t) => t.members.some((m) => m.id === playerId));
    const mate = myTeam?.members.find((m) => m.id !== playerId);
    return {
      phase: this.phase,
      round: this.idx + 1, totalRounds: this.deck.length,
      prompt: this.deck[this.idx] ?? '',
      timeLeft: this.timeLeft,
      myAnswer: this.answers.get(playerId) ?? null,
      iSubmitted: this.answers.has(playerId),
      submittedCount: this.answers.size, totalPlayers: this.ctx.players().length,
      myTeamName: myTeam?.name ?? '', teammateName: mate?.name ?? '—',
      reveal: this.phase === 'reveal' ? this.lastReveal : null,
      leaderboard: this.board(),
      actions: this.phase === 'play' && !this.answers.has(playerId) ? ['submit'] : [],
    };
  }
}
