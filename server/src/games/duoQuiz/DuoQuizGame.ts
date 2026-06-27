import { GameContext, GameInstance } from '../../core/game';
import { GameResults } from '../../shared/types';
import { pickFresh } from '../shared/freshDeck';
import { getTeams } from '../shared/teams';
import { QUESTIONS, Question } from '../quiz/questions';

const TIME = 15;
const REVEAL = 4;
const NB = 8;

/** Duo Quiz — par équipes de 2, en relais : à chaque question, un seul membre de
 *  l'équipe répond (en alternance). Bonne réponse = point pour l'équipe. */
export class DuoQuizGame implements GameInstance {
  private phase: 'question' | 'reveal' | 'ended' = 'question';
  private deck: Question[] = [];
  private idx = 0;
  private timeLeft = TIME;
  private scores = new Map<string, number>();
  private answers = new Map<string, { choice: number; t: number }>(); // teamId -> answer

  constructor(private ctx: GameContext) {}

  start(): void {
    for (const t of getTeams(this.ctx.players())) this.scores.set(t.id, 0);
    this.deck = pickFresh(`duo-quiz:${this.ctx.roomCode}`, QUESTIONS, NB, (q) => q.q);
    this.begin();
    this.ctx.setInterval(() => this.tick(), 1000);
  }
  dispose(): void {}

  private begin(): void { this.phase = 'question'; this.timeLeft = TIME; this.answers.clear(); this.ctx.broadcastState(); }
  private tick(): void {
    if (this.phase === 'question') { this.timeLeft -= 1; if (this.timeLeft <= 0 || this.answers.size >= getTeams(this.ctx.players()).length) this.reveal(); else this.ctx.broadcastState(); }
    else if (this.phase === 'reveal') { this.timeLeft -= 1; if (this.timeLeft <= 0) this.next(); else this.ctx.broadcastState(); }
  }
  private reveal(): void {
    this.phase = 'reveal'; this.timeLeft = REVEAL;
    const correct = this.deck[this.idx].correct;
    for (const [teamId, a] of this.answers) if (a.choice === correct) this.scores.set(teamId, (this.scores.get(teamId) ?? 0) + 500 + Math.round(500 * a.t / TIME));
    this.ctx.broadcastState();
  }
  private next(): void { this.idx += 1; if (this.idx >= this.deck.length) this.end(); else this.begin(); }

  /** The team member who answers this question (alternates each question). */
  private activeMemberId(teamMembers: { id: string }[]): string | undefined {
    if (teamMembers.length === 0) return undefined;
    return teamMembers[this.idx % teamMembers.length]?.id;
  }

  handleAction(playerId: string, type: string, payload?: unknown): void {
    if (this.phase !== 'question' || type !== 'answer') return;
    const teams = getTeams(this.ctx.players());
    const team = teams.find((t) => t.members.some((m) => m.id === playerId));
    if (!team || this.answers.has(team.id)) return;
    if (this.activeMemberId(team.members) !== playerId) return; // not your turn to answer
    const choice = Number((payload as any)?.index);
    if (choice < 0 || choice > 3) return;
    this.answers.set(team.id, { choice, t: this.timeLeft });
    this.ctx.emitEvent({ type: 'answered' }, playerId);
    this.ctx.broadcastState();
  }
  onPlayerLeave(_id: string): void { if (this.phase !== 'ended') this.ctx.broadcastState(); }

  private board() {
    return getTeams(this.ctx.players()).map((t) => ({ id: t.id, name: t.name, color: t.color, score: this.scores.get(t.id) ?? 0 })).sort((a, b) => b.score - a.score);
  }
  private end(): void {
    this.phase = 'ended';
    const ranking = this.board().map((t) => ({ label: `Équipe ${t.name}`, score: t.score, color: t.color }));
    this.ctx.endGame({ gameId: 'duo-quiz', ranking, summary: ranking[0] ? `🏆 L'équipe ${this.board()[0].name} gagne !` : undefined } as GameResults);
  }

  getStateFor(playerId: string): unknown {
    const teams = getTeams(this.ctx.players());
    const myTeam = teams.find((t) => t.members.some((m) => m.id === playerId));
    const activeId = myTeam ? this.activeMemberId(myTeam.members) : undefined;
    const amIActive = activeId === playerId;
    const activeName = myTeam?.members.find((m) => m.id === activeId)?.name ?? '';
    const myAns = myTeam ? this.answers.get(myTeam.id) : undefined;
    const reveal = this.phase === 'reveal';
    return {
      phase: this.phase,
      index: this.idx + 1, total: this.deck.length,
      question: this.deck[this.idx]?.q ?? '', options: this.deck[this.idx]?.options ?? [],
      timeLeft: this.timeLeft, duration: reveal ? REVEAL : TIME,
      amIActive, activeName,
      myTeamChoice: myAns?.choice ?? null, myTeamAnswered: !!myAns,
      correctIndex: reveal ? this.deck[this.idx]?.correct ?? null : null,
      teamWasRight: reveal ? myAns?.choice === this.deck[this.idx]?.correct : null,
      leaderboard: this.board(),
      actions: this.phase === 'question' && amIActive && !myAns ? ['answer'] : [],
    };
  }
}
