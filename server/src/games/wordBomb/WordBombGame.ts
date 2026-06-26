import { GameContext, GameInstance } from '../../core/game';
import { GameResults } from '../../shared/types';
import { normalize, randomFragment } from './words';

const START_LIVES = 2;
const BASE_TIME = 20; // seconds per turn
const MIN_TIME = 8;

interface P {
  id: string;
  name: string;
  lives: number;
  alive: boolean;
  wordsSaid: number;
}

/**
 * "La Bombe à mots" — free-for-all. A syllable fragment is shown to the current
 * player who must type a word containing it before the timer runs out, or lose
 * a life. Last player standing wins. No teams: shows the engine handles solo
 * turn-based games too.
 */
export class WordBombGame implements GameInstance {
  private phase: 'playing' | 'ended' = 'playing';
  private order: string[] = [];
  private players = new Map<string, P>();
  private currentIdx = 0;
  private fragment = '';
  private timeLeft = BASE_TIME;
  private turnDuration = BASE_TIME;
  private used = new Set<string>();
  private eliminated: string[] = [];
  private tickStarted = false;

  constructor(private ctx: GameContext) {}

  start(): void {
    for (const p of this.ctx.players()) {
      this.players.set(p.id, { id: p.id, name: p.name, lives: START_LIVES, alive: true, wordsSaid: 0 });
      this.order.push(p.id);
    }
    this.newTurn(0);
    this.ctx.setInterval(() => this.tick(), 1000);
    this.tickStarted = true;
    this.ctx.broadcastState();
  }

  dispose(): void {}

  private current(): P | undefined {
    return this.players.get(this.order[this.currentIdx]);
  }

  private newTurn(startIdx: number): void {
    this.fragment = randomFragment();
    this.turnDuration = Math.max(MIN_TIME, BASE_TIME - Math.floor(this.used.size / 3));
    this.timeLeft = this.turnDuration;
    // Land on an alive player starting from startIdx.
    this.currentIdx = startIdx % this.order.length;
    let guard = 0;
    while (!this.current()?.alive && guard++ < this.order.length) {
      this.currentIdx = (this.currentIdx + 1) % this.order.length;
    }
  }

  private advance(): void {
    this.newTurn((this.currentIdx + 1) % this.order.length);
    this.ctx.broadcastState();
  }

  private aliveCount(): number {
    return [...this.players.values()].filter((p) => p.alive).length;
  }

  private tick(): void {
    if (this.phase !== 'playing') return;
    this.timeLeft -= 1;
    if (this.timeLeft > 0) {
      this.ctx.broadcastState();
      return;
    }
    // Boom: current player loses a life.
    const p = this.current();
    if (p) {
      p.lives -= 1;
      this.ctx.emitEvent({ type: 'boom', payload: { name: p.name } });
      if (p.lives <= 0) {
        p.alive = false;
        this.eliminated.push(p.id);
      }
    }
    if (this.aliveCount() <= 1) return this.endGame();
    this.advance();
  }

  handleAction(playerId: string, type: string, payload?: unknown): void {
    if (this.phase !== 'playing' || type !== 'submit') return;
    if (this.order[this.currentIdx] !== playerId) return; // not your turn

    const raw = typeof payload === 'object' && payload && 'word' in payload ? String((payload as any).word) : '';
    const word = normalize(raw);
    const frag = normalize(this.fragment);

    // Lenient validation (party game, players self-police real words):
    if (word.length < 3 || word.length <= frag.length) {
      return this.ctx.emitEvent({ type: 'invalid', payload: { reason: 'trop court' } }, playerId);
    }
    if (!word.includes(frag)) {
      return this.ctx.emitEvent({ type: 'invalid', payload: { reason: 'ne contient pas le fragment' } }, playerId);
    }
    if (this.used.has(word)) {
      return this.ctx.emitEvent({ type: 'invalid', payload: { reason: 'déjà utilisé' } }, playerId);
    }

    this.used.add(word);
    const p = this.players.get(playerId);
    if (p) p.wordsSaid += 1;
    this.ctx.emitEvent({ type: 'ok', payload: { name: p?.name, word: raw.trim() } });
    this.advance();
  }

  onPlayerLeave(playerId: string): void {
    const p = this.players.get(playerId);
    if (!p || !p.alive) return;
    p.alive = false;
    this.eliminated.push(playerId);
    if (this.aliveCount() <= 1) return this.endGame();
    if (this.order[this.currentIdx] === playerId) this.advance();
    else this.ctx.broadcastState();
  }

  private endGame(): void {
    this.phase = 'ended';
    const alive = [...this.players.values()].filter((p) => p.alive).map((p) => p.id);
    // Best -> worst: survivors, then reverse elimination order.
    const ranked = [...alive, ...[...this.eliminated].reverse()];
    const seen = new Set<string>();
    const ranking = ranked
      .filter((id) => !seen.has(id) && seen.add(id))
      .map((id) => {
        const p = this.players.get(id)!;
        return { label: p.name, score: p.wordsSaid };
      });
    const winner = this.players.get(alive[0]);
    const results: GameResults = {
      gameId: 'word-bomb',
      ranking,
      summary: winner ? `🏆 ${winner.name} survit avec ${winner.wordsSaid} mots !` : undefined,
    };
    this.ctx.endGame(results);
  }

  getStateFor(playerId: string): unknown {
    const cur = this.current();
    const me = this.players.get(playerId);
    const myTurn = this.order[this.currentIdx] === playerId && me?.alive === true;
    return {
      phase: this.phase,
      fragment: this.fragment,
      timeLeft: this.timeLeft,
      turnDuration: this.turnDuration,
      currentPlayerId: cur?.id ?? '',
      currentPlayerName: cur?.name ?? '',
      myTurn,
      amIAlive: me?.alive ?? false,
      usedCount: this.used.size,
      players: this.order.map((id) => {
        const p = this.players.get(id)!;
        return { id: p.id, name: p.name, lives: p.lives, alive: p.alive, isCurrent: id === cur?.id };
      }),
      actions: myTurn ? ['submit'] : [],
    };
  }
}
