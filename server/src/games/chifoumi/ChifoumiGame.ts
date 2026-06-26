import { GameContext, GameInstance } from '../../core/game';
import { GameResults } from '../../shared/types';

type Choice = 'rock' | 'paper' | 'scissors';
const BEATS: Record<Choice, Choice> = { rock: 'scissors', scissors: 'paper', paper: 'rock' };
const ROUNDS = 5;
const PICK_TIME = 10;
const REVEAL = 5;

/** Chifoumi tournoi — pierre/feuille/ciseaux à plusieurs. Chaque manche tu marques
 *  un point par adversaire battu. Le meilleur total après 5 manches gagne. */
export class ChifoumiGame implements GameInstance {
  private phase: 'pick' | 'reveal' | 'ended' = 'pick';
  private round = 0;
  private timeLeft = PICK_TIME;
  private scores = new Map<string, number>();
  private names = new Map<string, string>();
  private picks = new Map<string, Choice>();
  private roundPts = new Map<string, number>();

  constructor(private ctx: GameContext) {}

  start(): void {
    for (const p of this.ctx.players()) { this.scores.set(p.id, 0); this.names.set(p.id, p.name); }
    this.begin();
    this.ctx.setInterval(() => this.tick(), 1000);
  }
  dispose(): void {}

  private begin(): void { this.phase = 'pick'; this.round += 1; this.timeLeft = PICK_TIME; this.picks.clear(); this.roundPts.clear(); this.ctx.broadcastState(); }
  private tick(): void {
    if (this.phase === 'pick') { this.timeLeft -= 1; if (this.timeLeft <= 0 || this.picks.size >= this.scores.size) this.reveal(); else this.ctx.broadcastState(); }
    else if (this.phase === 'reveal') { this.timeLeft -= 1; if (this.timeLeft <= 0) this.next(); else this.ctx.broadcastState(); }
  }
  private reveal(): void {
    this.phase = 'reveal'; this.timeLeft = REVEAL;
    const ids = [...this.scores.keys()];
    for (const a of ids) {
      const ca = this.picks.get(a);
      if (!ca) { this.roundPts.set(a, 0); continue; }
      let pts = 0;
      for (const b of ids) {
        if (a === b) continue;
        const cb = this.picks.get(b);
        if (cb && BEATS[ca] === cb) pts += 1;
      }
      this.roundPts.set(a, pts);
      this.scores.set(a, (this.scores.get(a) ?? 0) + pts);
    }
    this.ctx.broadcastState();
  }
  private next(): void { if (this.round >= ROUNDS) this.end(); else this.begin(); }

  handleAction(playerId: string, type: string, payload?: unknown): void {
    if (this.phase !== 'pick' || type !== 'pick' || this.picks.has(playerId)) return;
    const c = (payload as any)?.choice as Choice;
    if (c !== 'rock' && c !== 'paper' && c !== 'scissors') return;
    this.picks.set(playerId, c);
    this.ctx.emitEvent({ type: 'answered' }, playerId);
    if (this.picks.size >= this.scores.size) this.reveal();
    else this.ctx.broadcastState();
  }
  onPlayerLeave(id: string): void { this.picks.delete(id); if (this.phase !== 'ended') this.ctx.broadcastState(); }

  private board() { return [...this.scores.entries()].map(([id, s]) => ({ id, label: this.names.get(id) ?? '?', score: s })).sort((a, b) => b.score - a.score); }
  private end(): void {
    this.phase = 'ended';
    const r = this.board().map(({ label, score }) => ({ label, score }));
    this.ctx.endGame({ gameId: 'chifoumi', ranking: r, summary: r[0] ? `🏆 ${r[0].label} domine le tournoi !` : undefined } as GameResults);
  }

  getStateFor(playerId: string): unknown {
    const reveal = this.phase === 'reveal';
    return {
      phase: this.phase,
      round: this.round, totalRounds: ROUNDS,
      timeLeft: this.timeLeft, duration: reveal ? REVEAL : PICK_TIME,
      myChoice: this.picks.get(playerId) ?? null,
      pickedCount: this.picks.size, totalPlayers: this.scores.size,
      reveal: reveal
        ? [...this.scores.keys()].map((id) => ({ name: this.names.get(id), choice: this.picks.get(id) ?? null, roundPts: this.roundPts.get(id) ?? 0 }))
        : null,
      leaderboard: this.board().map((b) => ({ name: b.label, score: b.score, isMe: b.id === playerId })),
      actions: this.phase === 'pick' && !this.picks.has(playerId) ? ['pick'] : [],
    };
  }
}
