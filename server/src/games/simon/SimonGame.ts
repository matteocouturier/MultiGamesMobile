import { GameContext, GameInstance } from '../../core/game';
import { GameResults } from '../../shared/types';

const COLORS = 4;
const RESULT_MS = 2500;
const MAX_LEN = 15;

interface P { id: string; name: string; alive: boolean; progress: number; done: boolean; roundsCleared: number }

/**
 * Simon — mémoire. Une séquence de couleurs s'allonge à chaque manche ; reproduis-la
 * dans le bon ordre. Une erreur = éliminé. Dernier survivant gagne.
 */
export class SimonGame implements GameInstance {
  private phase: 'show' | 'input' | 'result' | 'ended' = 'show';
  private sequence: number[] = [];
  private players = new Map<string, P>();
  private order: string[] = [];
  private token = 0;

  constructor(private ctx: GameContext) {}

  start(): void {
    for (const p of this.ctx.players()) {
      this.players.set(p.id, { id: p.id, name: p.name, alive: true, progress: 0, done: false, roundsCleared: 0 });
      this.order.push(p.id);
    }
    this.nextRound();
  }
  dispose(): void {}

  private alive(): P[] { return [...this.players.values()].filter((p) => p.alive); }

  private nextRound(): void {
    this.sequence.push(Math.floor(Math.random() * COLORS));
    for (const p of this.players.values()) { p.progress = 0; p.done = false; }
    this.phase = 'show';
    this.ctx.broadcastState();
    const showMs = this.sequence.length * 700 + 700;
    const tk = ++this.token;
    this.ctx.setTimeout(() => { if (tk === this.token) this.beginInput(); }, showMs);
  }

  private beginInput(): void {
    this.phase = 'input';
    this.ctx.broadcastState();
    const inputMs = this.sequence.length * 2500 + 3000;
    const tk = ++this.token;
    this.ctx.setTimeout(() => { if (tk === this.token) this.resolve(); }, inputMs);
  }

  handleAction(playerId: string, type: string, payload?: unknown): void {
    if (this.phase !== 'input' || type !== 'tap') return;
    const p = this.players.get(playerId);
    if (!p || !p.alive || p.done) return;
    const color = Number((payload as any)?.color);
    if (this.sequence[p.progress] === color) {
      p.progress += 1;
      if (p.progress >= this.sequence.length) { p.done = true; p.roundsCleared += 1; }
    } else {
      p.alive = false; // wrong color -> eliminated
      this.ctx.emitEvent({ type: 'boom', payload: { name: p.name } });
    }
    if (this.alive().every((q) => q.done || !q.alive)) this.resolve();
    else this.ctx.broadcastState();
  }

  private resolve(): void {
    this.token++; // cancel pending timers
    const survivors = this.alive().filter((p) => p.done);
    // Mark non-finishers (ran out of time) as eliminated.
    for (const p of this.alive()) if (!p.done) p.alive = false;
    this.phase = 'result';
    this.ctx.broadcastState();
    const tk = ++this.token;
    this.ctx.setTimeout(() => {
      if (tk !== this.token) return;
      if (survivors.length <= 1 || this.sequence.length >= MAX_LEN) this.end();
      else this.nextRound();
    }, RESULT_MS);
  }

  onPlayerLeave(playerId: string): void {
    const p = this.players.get(playerId);
    if (p) p.alive = false;
    if (this.phase !== 'ended' && this.alive().length <= 1) this.resolve();
    else if (this.phase !== 'ended') this.ctx.broadcastState();
  }

  private end(): void {
    this.phase = 'ended';
    const ranking = this.order
      .map((id) => this.players.get(id)!)
      .map((p) => ({ label: p.name, score: p.roundsCleared, alive: p.alive }))
      .sort((a, b) => (b.alive ? 1 : 0) - (a.alive ? 1 : 0) || b.score - a.score)
      .map(({ label, score }) => ({ label, score }));
    this.ctx.endGame({ gameId: 'simon', ranking, summary: ranking[0] ? `🏆 ${ranking[0].label} a la meilleure mémoire !` : undefined } as GameResults);
  }

  getStateFor(playerId: string): unknown {
    const me = this.players.get(playerId);
    return {
      phase: this.phase,
      length: this.sequence.length,
      // The sequence is only revealed during the "show" phase.
      sequence: this.phase === 'show' ? this.sequence : null,
      myProgress: me?.progress ?? 0,
      amIAlive: me?.alive ?? false,
      amIDone: me?.done ?? false,
      players: this.order.map((id) => { const p = this.players.get(id)!; return { name: p.name, alive: p.alive, done: p.done, isMe: id === playerId }; }),
      actions: this.phase === 'input' && me?.alive && !me?.done ? ['tap'] : [],
    };
  }
}
