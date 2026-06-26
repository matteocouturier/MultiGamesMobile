import { GameContext, GameInstance } from '../../core/game';
import { GameResults } from '../../shared/types';

const COLS = 7;
const ROWS = 6;
const ROUNDS = 3;
const RESULT_MS = 3500;
type Disc = 'R' | 'Y' | null;

/** Puissance 4 — duel à 2. Aligne 4 jetons. Le meilleur sur 3 manches gagne. */
export class Connect4Game implements GameInstance {
  private phase: 'playing' | 'result' | 'ended' = 'playing';
  private ids: string[] = [];
  private names = new Map<string, string>();
  private disc = new Map<string, 'R' | 'Y'>();
  private wins = new Map<string, number>();
  private board: Disc[] = Array(COLS * ROWS).fill(null);
  private round = 0;
  private currentIdx = 0;
  private startIdx = 0;
  private lastResult: { winnerName: string | null; draw: boolean; line: number[] | null } | null = null;
  private token = 0;

  constructor(private ctx: GameContext) {}

  start(): void {
    this.ids = this.ctx.players().map((p) => p.id).slice(0, 2);
    this.ids.forEach((id, i) => {
      this.names.set(id, this.ctx.players().find((p) => p.id === id)?.name ?? '?');
      this.disc.set(id, i === 0 ? 'R' : 'Y');
      this.wins.set(id, 0);
    });
    this.beginRound();
  }
  dispose(): void {}

  private beginRound(): void {
    this.round += 1;
    this.phase = 'playing';
    this.board = Array(COLS * ROWS).fill(null);
    this.currentIdx = this.startIdx;
    this.lastResult = null;
    this.ctx.broadcastState();
  }

  private idx(r: number, c: number): number { return r * COLS + c; }

  private winLine(sym: 'R' | 'Y'): number[] | null {
    const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        for (const [dr, dc] of dirs) {
          const line: number[] = [];
          for (let k = 0; k < 4; k++) {
            const rr = r + dr * k, cc = c + dc * k;
            if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS) { line.length = 0; break; }
            if (this.board[this.idx(rr, cc)] !== sym) { line.length = 0; break; }
            line.push(this.idx(rr, cc));
          }
          if (line.length === 4) return line;
        }
      }
    }
    return null;
  }

  handleAction(playerId: string, type: string, payload?: unknown): void {
    if (this.phase !== 'playing' || type !== 'drop') return;
    if (this.ids[this.currentIdx] !== playerId) return;
    const col = Number((payload as any)?.col);
    if (!(col >= 0 && col < COLS)) return;
    // Drop to the lowest empty row in the column.
    let row = -1;
    for (let r = ROWS - 1; r >= 0; r--) { if (!this.board[this.idx(r, col)]) { row = r; break; } }
    if (row < 0) return; // column full
    const sym = this.disc.get(playerId)!;
    this.board[this.idx(row, col)] = sym;

    const line = this.winLine(sym);
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
    this.startIdx = 1 - this.startIdx;
    this.ctx.broadcastState();
    const tk = ++this.token;
    this.ctx.setTimeout(() => {
      if (tk !== this.token) return;
      if (this.round >= ROUNDS) this.end();
      else this.beginRound();
    }, RESULT_MS);
  }

  onPlayerLeave(playerId: string): void {
    if (this.phase === 'ended') return;
    const other = this.ids.find((id) => id !== playerId);
    if (other) {
      this.phase = 'ended';
      this.ctx.endGame({
        gameId: 'connect4',
        ranking: [
          { label: this.names.get(other) ?? '?', score: (this.wins.get(other) ?? 0) + 1 },
          { label: this.names.get(playerId) ?? '?', score: this.wins.get(playerId) ?? 0 },
        ],
        summary: `🏆 ${this.names.get(other)} gagne (abandon adverse)`,
      } as GameResults);
    }
  }

  private end(): void {
    this.phase = 'ended';
    const ranking = this.ids.map((id) => ({ label: this.names.get(id) ?? '?', score: this.wins.get(id) ?? 0 })).sort((a, b) => b.score - a.score);
    const draw = ranking[0]?.score === ranking[1]?.score;
    this.ctx.endGame({ gameId: 'connect4', ranking, summary: draw ? '🤝 Égalité !' : `🏆 ${ranking[0].label} remporte le duel !` } as GameResults);
  }

  getStateFor(playerId: string): unknown {
    const currentId = this.ids[this.currentIdx];
    return {
      phase: this.phase,
      round: this.round, totalRounds: ROUNDS,
      cols: COLS, rows: ROWS,
      board: this.board,
      myDisc: this.disc.get(playerId) ?? null,
      currentName: this.names.get(currentId) ?? '',
      myTurn: currentId === playerId && this.phase === 'playing',
      lastResult: this.phase === 'result' ? this.lastResult : null,
      scores: this.ids.map((id) => ({ name: this.names.get(id), disc: this.disc.get(id), wins: this.wins.get(id) ?? 0, isMe: id === playerId })),
      actions: currentId === playerId && this.phase === 'playing' ? ['drop'] : [],
    };
  }
}
