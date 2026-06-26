import { GameContext, GameInstance } from '../../core/game';
import { GameResults } from '../../shared/types';

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];
const ROUNDS = 3;
const RESULT_MS = 3000;

type Cell = 'X' | 'O' | null;

/** Morpion — duel à 2. Aligne 3 symboles. Le meilleur sur 3 manches gagne. */
export class MorpionGame implements GameInstance {
  private phase: 'playing' | 'result' | 'ended' = 'playing';
  private ids: string[] = [];
  private names = new Map<string, string>();
  private symbol = new Map<string, 'X' | 'O'>();
  private wins = new Map<string, number>();
  private board: Cell[] = Array(9).fill(null);
  private round = 0;
  private currentIdx = 0;
  private startIdx = 0;
  private lastResult: { winnerName: string | null; draw: boolean; line: number[] | null } | null = null;
  private phaseToken = 0;

  constructor(private ctx: GameContext) {}

  start(): void {
    this.ids = this.ctx.players().map((p) => p.id).slice(0, 2);
    this.ids.forEach((id, i) => {
      this.names.set(id, this.ctx.players().find((p) => p.id === id)?.name ?? '?');
      this.symbol.set(id, i === 0 ? 'X' : 'O');
      this.wins.set(id, 0);
    });
    this.beginRound();
  }
  dispose(): void {}

  private beginRound(): void {
    this.round += 1;
    this.phase = 'playing';
    this.board = Array(9).fill(null);
    this.currentIdx = this.startIdx;
    this.lastResult = null;
    this.ctx.broadcastState();
  }

  private winningLine(sym: 'X' | 'O'): number[] | null {
    for (const l of LINES) if (l.every((i) => this.board[i] === sym)) return l;
    return null;
  }

  handleAction(playerId: string, type: string, payload?: unknown): void {
    if (this.phase !== 'playing' || type !== 'play') return;
    if (this.ids[this.currentIdx] !== playerId) return;
    const cell = Number((payload as any)?.cell);
    if (!(cell >= 0 && cell < 9) || this.board[cell]) return;
    const sym = this.symbol.get(playerId)!;
    this.board[cell] = sym;

    const line = this.winningLine(sym);
    if (line) {
      this.wins.set(playerId, (this.wins.get(playerId) ?? 0) + 1);
      this.lastResult = { winnerName: this.names.get(playerId) ?? '?', draw: false, line };
      this.endRound();
    } else if (this.board.every((c) => c !== null)) {
      this.lastResult = { winnerName: null, draw: true, line: null };
      this.endRound();
    } else {
      this.currentIdx = 1 - this.currentIdx;
      this.ctx.broadcastState();
    }
  }

  private endRound(): void {
    this.phase = 'result';
    this.startIdx = 1 - this.startIdx; // alternate who starts next
    this.ctx.broadcastState();
    const token = ++this.phaseToken;
    this.ctx.setTimeout(() => {
      if (token !== this.phaseToken) return;
      if (this.round >= ROUNDS) this.end();
      else this.beginRound();
    }, RESULT_MS);
  }

  onPlayerLeave(playerId: string): void {
    if (this.phase === 'ended') return;
    // Opponent left -> the other player wins by forfeit.
    const other = this.ids.find((id) => id !== playerId);
    if (other) {
      const r = [
        { label: this.names.get(other) ?? '?', score: (this.wins.get(other) ?? 0) + 1 },
        { label: this.names.get(playerId) ?? '?', score: this.wins.get(playerId) ?? 0 },
      ];
      this.phase = 'ended';
      this.ctx.endGame({ gameId: 'morpion', ranking: r, summary: `🏆 ${this.names.get(other)} gagne (abandon adverse)` } as GameResults);
    }
  }

  private end(): void {
    this.phase = 'ended';
    const ranking = this.ids
      .map((id) => ({ label: this.names.get(id) ?? '?', score: this.wins.get(id) ?? 0 }))
      .sort((a, b) => b.score - a.score);
    const draw = ranking[0]?.score === ranking[1]?.score;
    this.ctx.endGame({
      gameId: 'morpion',
      ranking,
      summary: draw ? '🤝 Égalité parfaite !' : `🏆 ${ranking[0].label} remporte le duel !`,
    } as GameResults);
  }

  getStateFor(playerId: string): unknown {
    const currentId = this.ids[this.currentIdx];
    return {
      phase: this.phase,
      round: this.round, totalRounds: ROUNDS,
      board: this.board,
      mySymbol: this.symbol.get(playerId) ?? null,
      currentName: this.names.get(currentId) ?? '',
      myTurn: currentId === playerId && this.phase === 'playing',
      lastResult: this.phase === 'result' ? this.lastResult : null,
      scores: this.ids.map((id) => ({ name: this.names.get(id), symbol: this.symbol.get(id), wins: this.wins.get(id) ?? 0, isMe: id === playerId })),
      actions: this.ids[this.currentIdx] === playerId && this.phase === 'playing' ? ['play'] : [],
    };
  }
}
