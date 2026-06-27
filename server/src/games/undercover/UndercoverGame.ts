import { GameContext, GameInstance } from '../../core/game';
import { GameResults } from '../../shared/types';
import { shuffle, WORD_PAIRS } from './words';

const REVEAL_MS = 7000; // time to memorise your secret word
const CLUE_MS = 45000; // time to submit a one-word clue
const VOTE_MS = 30000; // time to vote
const RESULT_MS = 6000; // time showing the eliminated player

type Role = 'civil' | 'undercover';
type Phase = 'reveal' | 'clue' | 'vote' | 'result' | 'ended';

/**
 * Undercover — social deduction. Most players (civils) share a word; one or two
 * "undercover" players get a similar but different word and don't know they're
 * the impostor. Each round everyone gives a one-word clue, then votes someone
 * out. Civils win by eliminating all undercovers; the undercover wins by
 * surviving to parity.
 */
export class UndercoverGame implements GameInstance {
  private phase: Phase = 'reveal';
  private round = 0;
  private order: string[] = [];
  private names = new Map<string, string>();
  private roles = new Map<string, Role>();
  private words = new Map<string, string>();
  private alive = new Set<string>();

  private clues = new Map<string, string>();
  private votes = new Map<string, string>();
  private lastEliminated: { id: string; name: string; role: Role; word: string } | null = null;
  private phaseToken = 0;

  constructor(private ctx: GameContext) {}

  start(): void {
    const players = this.ctx.players();
    for (const p of players) {
      this.order.push(p.id);
      this.names.set(p.id, p.name);
      this.alive.add(p.id);
    }
    const [civWord, underWord] = shuffle(WORD_PAIRS)[0];
    const nbUnder = players.length >= 6 ? 2 : 1;
    const shuffled = shuffle(this.order);
    shuffled.forEach((id, i) => {
      const isUnder = i < nbUnder;
      this.roles.set(id, isUnder ? 'undercover' : 'civil');
      this.words.set(id, isUnder ? underWord : civWord);
    });
    this.beginReveal();
  }

  dispose(): void {}

  private schedule(fn: () => void, ms: number): void {
    const token = ++this.phaseToken;
    this.ctx.setTimeout(() => {
      if (token === this.phaseToken) fn();
    }, ms);
  }

  private beginReveal(): void {
    this.phase = 'reveal';
    this.ctx.broadcastState();
    this.schedule(() => this.beginClue(), REVEAL_MS);
  }

  private beginClue(): void {
    this.phase = 'clue';
    this.round += 1;
    this.clues.clear();
    this.ctx.broadcastState();
    this.schedule(() => this.beginVote(), CLUE_MS);
  }

  private beginVote(): void {
    this.phase = 'vote';
    this.votes.clear();
    // Fill missing clues so nobody blocks the reveal.
    for (const id of this.alive) if (!this.clues.has(id)) this.clues.set(id, '—');
    this.ctx.broadcastState();
    this.schedule(() => this.resolveVote(), VOTE_MS);
  }

  private resolveVote(): void {
    const counts = new Map<string, number>();
    for (const target of this.votes.values()) counts.set(target, (counts.get(target) ?? 0) + 1);
    let max = -1;
    let leaders: string[] = [];
    for (const id of this.alive) {
      const c = counts.get(id) ?? 0;
      if (c > max) {
        max = c;
        leaders = [id];
      } else if (c === max) {
        leaders.push(id);
      }
    }
    const eliminatedId = leaders[Math.floor(Math.random() * leaders.length)];
    if (eliminatedId && max > 0) {
      this.alive.delete(eliminatedId);
      this.lastEliminated = {
        id: eliminatedId,
        name: this.names.get(eliminatedId) ?? '?',
        role: this.roles.get(eliminatedId)!,
        word: this.words.get(eliminatedId) ?? '',
      };
    } else {
      this.lastEliminated = null; // no votes cast
    }
    this.phase = 'result';
    this.ctx.broadcastState();
    this.schedule(() => this.afterResult(), RESULT_MS);
  }

  private afterResult(): void {
    const winner = this.checkWinner();
    if (winner) return this.endGame(winner);
    this.beginClue();
  }

  private aliveRoles(): { under: number; civ: number } {
    let under = 0;
    let civ = 0;
    for (const id of this.alive) (this.roles.get(id) === 'undercover' ? under++ : civ++);
    return { under, civ };
  }

  private checkWinner(): 'civils' | 'undercover' | null {
    const { under, civ } = this.aliveRoles();
    if (under === 0) return 'civils';
    if (under >= civ) return 'undercover';
    return null;
  }

  handleAction(playerId: string, type: string, payload?: unknown): void {
    if (!this.alive.has(playerId)) return;
    if (this.phase === 'clue' && type === 'clue') {
      if (this.clues.has(playerId)) return;
      const word = String((payload as any)?.word ?? '').trim().slice(0, 20) || '—';
      this.clues.set(playerId, word);
      this.ctx.broadcastState();
      if ([...this.alive].every((id) => this.clues.has(id))) this.beginVote();
    } else if (this.phase === 'vote' && type === 'vote') {
      const target = String((payload as any)?.targetId ?? '');
      if (!this.alive.has(target) || target === playerId) return;
      this.votes.set(playerId, target);
      this.ctx.broadcastState();
      if ([...this.alive].every((id) => this.votes.has(id))) this.resolveVote();
    }
  }

  onPlayerLeave(playerId: string): void {
    if (!this.alive.has(playerId)) return;
    this.alive.delete(playerId);
    this.clues.delete(playerId);
    this.votes.delete(playerId);
    if (this.phase === 'ended') return;
    const winner = this.checkWinner();
    if (winner) return this.endGame(winner);
    this.ctx.broadcastState();
  }

  private endGame(winner: 'civils' | 'undercover'): void {
    this.phase = 'ended';
    // Winners ranked first. Score: 2 if on winning side, +1 if survived.
    const ranking = this.order
      .map((id) => {
        const role = this.roles.get(id)!;
        const won = winner === 'undercover' ? role === 'undercover' : role === 'civil';
        const score = (won ? 2 : 0) + (this.alive.has(id) ? 1 : 0);
        return { label: `${this.names.get(id)} (${role === 'undercover' ? 'Undercover' : 'Civil'})`, score };
      })
      .sort((a, b) => b.score - a.score);
    this.ctx.endGame({
      gameId: 'undercover',
      ranking,
      summary: winner === 'civils' ? '🛡️ Les Civils ont démasqué l’Undercover !' : '🕵️ L’Undercover a gagné !',
    } as GameResults);
  }

  getStateFor(playerId: string): unknown {
    const showClues = this.phase === 'vote' || this.phase === 'result';
    const ended = this.phase === 'ended';
    return {
      phase: this.phase,
      round: this.round,
      myWord: this.words.get(playerId) ?? '',
      amIAlive: this.alive.has(playerId),
      players: this.order.map((id) => ({
        id,
        name: this.names.get(id),
        alive: this.alive.has(id),
        isMe: id === playerId,
        clue: showClues ? this.clues.get(id) ?? null : null,
        submittedClue: this.clues.has(id),
        voted: this.phase === 'vote' ? this.votes.has(id) : false,
        // Roles only revealed at the very end.
        role: ended ? this.roles.get(id) : null,
      })),
      iSubmittedClue: this.clues.has(playerId),
      myVote: this.votes.get(playerId) ?? null,
      lastEliminated: this.phase === 'result' ? this.lastEliminated : null,
      actions:
        this.phase === 'clue' && this.alive.has(playerId) && !this.clues.has(playerId)
          ? ['clue']
          : this.phase === 'vote' && this.alive.has(playerId) && !this.votes.has(playerId)
          ? ['vote']
          : [],
    };
  }
}
