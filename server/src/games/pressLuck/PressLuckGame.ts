import { GameContext, GameInstance } from '../../core/game';
import { GameResults } from '../../shared/types';

const ROUNDS = 4;
const ROUND_TIME = 25;
const RESULT_MS = 3500;
const BUST_CHANCE = 0.22;

type Status = 'active' | 'banked' | 'busted';

/** Stop ou Encore — tente le diable : à chaque "Encore" tu gagnes des points mais
 *  risques de tout perdre. "Stop" sécurise ton butin. Le plus gros total gagne. */
export class PressLuckGame implements GameInstance {
  private phase: 'play' | 'result' | 'ended' = 'play';
  private round = 0;
  private timeLeft = ROUND_TIME;
  private ids: string[] = [];
  private names = new Map<string, string>();
  private total = new Map<string, number>();
  private pot = new Map<string, number>();
  private status = new Map<string, Status>();
  private lastGain = new Map<string, number>();
  private token = 0;

  constructor(private ctx: GameContext) {}

  start(): void {
    this.ids = this.ctx.players().map((p) => p.id);
    for (const p of this.ctx.players()) { this.names.set(p.id, p.name); this.total.set(p.id, 0); }
    this.begin();
    this.ctx.setInterval(() => this.tick(), 1000);
  }
  dispose(): void {}

  private begin(): void {
    this.round += 1;
    this.phase = 'play';
    this.timeLeft = ROUND_TIME;
    for (const id of this.ids) { this.pot.set(id, 0); this.status.set(id, 'active'); this.lastGain.set(id, 0); }
    this.ctx.broadcastState();
  }

  private tick(): void {
    if (this.phase === 'play') {
      this.timeLeft -= 1;
      if (this.timeLeft <= 0) { this.autoBank(); this.resolve(); }
      else this.ctx.broadcastState();
    } else if (this.phase === 'result') {
      this.timeLeft -= 1;
      if (this.timeLeft <= 0) { if (this.round >= ROUNDS) this.end(); else this.begin(); }
      else this.ctx.broadcastState();
    }
  }

  private autoBank(): void {
    for (const id of this.ids) if (this.status.get(id) === 'active') {
      this.total.set(id, (this.total.get(id) ?? 0) + (this.pot.get(id) ?? 0));
      this.status.set(id, 'banked');
    }
  }

  private allDone(): boolean { return this.ids.every((id) => this.status.get(id) !== 'active'); }

  private resolve(): void {
    this.phase = 'result';
    this.timeLeft = Math.ceil(RESULT_MS / 1000);
    this.ctx.broadcastState();
    const tk = ++this.token;
    this.ctx.setTimeout(() => {
      if (tk !== this.token) return;
      if (this.round >= ROUNDS) this.end();
      else this.begin();
    }, RESULT_MS);
  }

  handleAction(playerId: string, type: string): void {
    if (this.phase !== 'play' || this.status.get(playerId) !== 'active') return;
    if (type === 'roll') {
      if (Math.random() < BUST_CHANCE) {
        this.pot.set(playerId, 0);
        this.status.set(playerId, 'busted');
        this.lastGain.set(playerId, -1);
        this.ctx.emitEvent({ type: 'boom', payload: { name: this.names.get(playerId) } });
      } else {
        const gain = 1 + Math.floor(Math.random() * 6);
        this.pot.set(playerId, (this.pot.get(playerId) ?? 0) + gain);
        this.lastGain.set(playerId, gain);
      }
      if (this.allDone()) this.resolve(); else this.ctx.broadcastState();
    } else if (type === 'bank') {
      this.total.set(playerId, (this.total.get(playerId) ?? 0) + (this.pot.get(playerId) ?? 0));
      this.status.set(playerId, 'banked');
      if (this.allDone()) this.resolve(); else this.ctx.broadcastState();
    }
  }

  onPlayerLeave(id: string): void {
    const i = this.ids.indexOf(id);
    if (i >= 0) this.ids.splice(i, 1);
    if (this.phase === 'play' && this.allDone()) this.resolve();
    else if (this.phase !== 'ended') this.ctx.broadcastState();
  }

  private board() { return this.ids.map((id) => ({ id, label: this.names.get(id) ?? '?', score: this.total.get(id) ?? 0 })).sort((a, b) => b.score - a.score); }
  private end(): void {
    this.phase = 'ended';
    const r = this.board().map(({ label, score }) => ({ label, score }));
    this.ctx.endGame({ gameId: 'press-luck', ranking: r, summary: r[0] ? `🏆 ${r[0].label} a tenté le diable et gagné !` : undefined } as GameResults);
  }

  getStateFor(playerId: string): unknown {
    return {
      phase: this.phase,
      round: this.round, totalRounds: ROUNDS,
      timeLeft: this.timeLeft,
      myPot: this.pot.get(playerId) ?? 0,
      myStatus: this.status.get(playerId) ?? 'active',
      myTotal: this.total.get(playerId) ?? 0,
      players: this.board().map((b) => ({ name: b.label, total: b.score, status: this.status.get(b.id) ?? 'active', pot: this.pot.get(b.id) ?? 0, isMe: b.id === playerId })),
      actions: this.phase === 'play' && this.status.get(playerId) === 'active' ? ['roll', 'bank'] : [],
    };
  }
}
