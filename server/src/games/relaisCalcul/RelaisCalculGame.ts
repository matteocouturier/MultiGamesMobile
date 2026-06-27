import { GameContext, GameInstance } from '../../core/game';
import { GameResults } from '../../shared/types';
import { getTeams } from '../shared/teams';

const TARGET = 12; // bonnes réponses pour gagner
const TIME_LIMIT = 120; // sécurité

function makeProblem(): { text: string; answer: number } {
  const ops = ['+', '-', '×'] as const;
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a: number, b: number, answer: number;
  if (op === '×') { a = 2 + Math.floor(Math.random() * 9); b = 2 + Math.floor(Math.random() * 9); answer = a * b; }
  else if (op === '+') { a = 5 + Math.floor(Math.random() * 60); b = 5 + Math.floor(Math.random() * 60); answer = a + b; }
  else { a = 20 + Math.floor(Math.random() * 60); b = 1 + Math.floor(Math.random() * a); answer = a - b; }
  return { text: `${a} ${op} ${b}`, answer };
}

interface TeamState { problem: { text: string; answer: number }; activeIdx: number; correct: number }

/** Relais Calcul — par équipes de 2. Chaque équipe court vers 12 bonnes réponses ;
 *  les coéquipiers résolvent en alternance (relais). Première équipe au but gagne. */
export class RelaisCalculGame implements GameInstance {
  private phase: 'play' | 'ended' = 'play';
  private teamStates = new Map<string, TeamState>();
  private timeLeft = TIME_LIMIT;

  constructor(private ctx: GameContext) {}

  start(): void {
    for (const t of getTeams(this.ctx.players())) this.teamStates.set(t.id, { problem: makeProblem(), activeIdx: 0, correct: 0 });
    this.ctx.broadcastState();
    this.ctx.setInterval(() => this.tick(), 1000);
  }
  dispose(): void {}

  private tick(): void {
    if (this.phase !== 'play') return;
    this.timeLeft -= 1;
    if (this.timeLeft <= 0) this.end();
    else this.ctx.broadcastState();
  }

  private activeMemberId(teamId: string): string | undefined {
    const team = getTeams(this.ctx.players()).find((t) => t.id === teamId);
    const ts = this.teamStates.get(teamId);
    if (!team || !ts || team.members.length === 0) return undefined;
    return team.members[ts.activeIdx % team.members.length]?.id;
  }

  handleAction(playerId: string, type: string, payload?: unknown): void {
    if (this.phase !== 'play' || type !== 'answer') return;
    const team = getTeams(this.ctx.players()).find((t) => t.members.some((m) => m.id === playerId));
    if (!team) return;
    const ts = this.teamStates.get(team.id);
    if (!ts || this.activeMemberId(team.id) !== playerId) return; // not your turn in the relay
    const v = Math.round(Number((payload as any)?.value));
    if (v === ts.problem.answer) {
      ts.correct += 1;
      ts.activeIdx += 1; // pass to teammate
      ts.problem = makeProblem();
      this.ctx.emitEvent({ type: 'ok', payload: { name: this.ctx.players().find((p) => p.id === playerId)?.name } });
      if (ts.correct >= TARGET) return this.end();
      this.ctx.broadcastState();
    } else {
      this.ctx.emitEvent({ type: 'invalid', payload: { reason: 'faux' } }, playerId);
    }
  }
  onPlayerLeave(_id: string): void { if (this.phase !== 'ended') this.ctx.broadcastState(); }

  private board() {
    return getTeams(this.ctx.players()).map((t) => ({ id: t.id, name: t.name, color: t.color, score: this.teamStates.get(t.id)?.correct ?? 0 })).sort((a, b) => b.score - a.score);
  }
  private end(): void {
    this.phase = 'ended';
    const ranking = this.board().map((t) => ({ label: `Équipe ${t.name}`, score: t.score, color: t.color }));
    this.ctx.endGame({ gameId: 'relais-calcul', ranking, summary: ranking[0] ? `🏆 L'équipe ${this.board()[0].name} a gagné la course !` : undefined } as GameResults);
  }

  getStateFor(playerId: string): unknown {
    const team = getTeams(this.ctx.players()).find((t) => t.members.some((m) => m.id === playerId));
    const ts = team ? this.teamStates.get(team.id) : undefined;
    const activeId = team ? this.activeMemberId(team.id) : undefined;
    const activeName = team?.members.find((m) => m.id === activeId)?.name ?? '';
    return {
      phase: this.phase,
      target: TARGET,
      timeLeft: this.timeLeft,
      problem: ts?.problem.text ?? '',
      myTeamCorrect: ts?.correct ?? 0,
      amIActive: activeId === playerId,
      activeName,
      leaderboard: this.board().map((t) => ({ name: t.name, color: t.color, score: t.score, isMine: t.id === team?.id })),
      actions: this.phase === 'play' && activeId === playerId ? ['answer'] : [],
    };
  }
}
