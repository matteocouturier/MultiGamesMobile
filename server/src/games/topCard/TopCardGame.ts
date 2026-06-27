import { GameContext, GameInstance } from '../../core/game';
import { GameResults } from '../../shared/types';

const ROUNDS = 6;
const PICK_TIME = 15;
const REVEAL = 5;

/** Plus Haute Carte — chacun a une main de cartes 1..6 et en joue une par manche.
 *  La plus haute remporte la manche. Pur bluff/stratégie : quand jouer ses grosses cartes ? */
export class TopCardGame implements GameInstance {
  private phase: 'pick' | 'reveal' | 'ended' = 'pick';
  private round = 0;
  private timeLeft = PICK_TIME;
  private hands = new Map<string, number[]>();
  private picks = new Map<string, number>();
  private wins = new Map<string, number>();
  private names = new Map<string, string>();
  private order: string[] = [];
  private lastReveal: { name: string; value: number; won: boolean }[] = [];

  constructor(private ctx: GameContext) {}

  start(): void {
    for (const p of this.ctx.players()) {
      this.order.push(p.id);
      this.names.set(p.id, p.name);
      this.wins.set(p.id, 0);
      this.hands.set(p.id, Array.from({ length: ROUNDS }, (_, i) => i + 1));
    }
    this.begin();
    this.ctx.setInterval(() => this.tick(), 1000);
  }
  dispose(): void {}

  private begin(): void { this.phase = 'pick'; this.round += 1; this.timeLeft = PICK_TIME; this.picks.clear(); this.ctx.broadcastState(); }
  private tick(): void {
    if (this.phase === 'pick') {
      this.timeLeft -= 1;
      if (this.timeLeft <= 0) { this.autoPlay(); this.reveal(); }
      else if (this.picks.size >= this.order.length) this.reveal();
      else this.ctx.broadcastState();
    } else if (this.phase === 'reveal') {
      this.timeLeft -= 1;
      if (this.timeLeft <= 0) this.next();
      else this.ctx.broadcastState();
    }
  }

  private autoPlay(): void {
    for (const id of this.order) {
      if (!this.picks.has(id)) {
        const hand = this.hands.get(id) ?? [];
        if (hand.length) this.picks.set(id, hand[0]);
      }
    }
  }

  private reveal(): void {
    this.phase = 'reveal'; this.timeLeft = REVEAL;
    let best = -1;
    for (const v of this.picks.values()) best = Math.max(best, v);
    const winners = this.order.filter((id) => this.picks.get(id) === best);
    for (const id of winners) this.wins.set(id, (this.wins.get(id) ?? 0) + 1);
    for (const id of this.order) {
      const v = this.picks.get(id);
      if (v != null) this.hands.set(id, (this.hands.get(id) ?? []).filter((x) => x !== v));
    }
    this.lastReveal = this.order.map((id) => ({ name: this.names.get(id) ?? '?', value: this.picks.get(id) ?? 0, won: winners.includes(id) }));
    this.ctx.broadcastState();
  }
  private next(): void { if (this.round >= ROUNDS) this.end(); else this.begin(); }

  handleAction(playerId: string, type: string, payload?: unknown): void {
    if (this.phase !== 'pick' || type !== 'play' || this.picks.has(playerId)) return;
    const v = Number((payload as any)?.value);
    if (!(this.hands.get(playerId) ?? []).includes(v)) return;
    this.picks.set(playerId, v);
    this.ctx.emitEvent({ type: 'answered' }, playerId);
    if (this.picks.size >= this.order.length) this.reveal();
    else this.ctx.broadcastState();
  }
  onPlayerLeave(id: string): void { this.picks.delete(id); if (this.phase !== 'ended') this.ctx.broadcastState(); }

  private board() { return this.order.map((id) => ({ id, label: this.names.get(id) ?? '?', score: this.wins.get(id) ?? 0 })).sort((a, b) => b.score - a.score); }
  private end(): void {
    this.phase = 'ended';
    const r = this.board().map(({ label, score }) => ({ label, score }));
    this.ctx.endGame({ gameId: 'top-card', ranking: r, summary: r[0] ? `🏆 ${r[0].label} remporte le plus de manches !` : undefined } as GameResults);
  }

  getStateFor(playerId: string): unknown {
    return {
      phase: this.phase,
      round: this.round, totalRounds: ROUNDS,
      timeLeft: this.timeLeft,
      myHand: this.hands.get(playerId) ?? [],
      myPick: this.picks.get(playerId) ?? null,
      pickedCount: this.picks.size, totalPlayers: this.order.length,
      reveal: this.phase === 'reveal' ? this.lastReveal : null,
      leaderboard: this.board().map((b) => ({ name: b.label, score: b.score, isMe: b.id === playerId })),
      actions: this.phase === 'pick' && !this.picks.has(playerId) ? ['play'] : [],
    };
  }
}
