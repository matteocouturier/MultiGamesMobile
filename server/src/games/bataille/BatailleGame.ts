import { GameContext, GameInstance } from '../../core/game';
import { GameResults } from '../../shared/types';
import { pickFresh } from '../shared/freshDeck';
import { getTeams } from '../shared/teams';
import categoriesData from '../../content/bataille.json';

const CATEGORIES: string[] = categoriesData as string[];
const ROUNDS = 5;
const TURN_TIME = 12;
const RESULT_MS = 3500;

function norm(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

/** Bataille de Catégories — par équipes. À tour de rôle, chaque équipe cite un mot
 *  de la catégorie (sans répétition) avant la fin du temps. L'équipe qui sèche est
 *  éliminée. Dernière équipe en lice remporte la manche. */
export class BatailleGame implements GameInstance {
  private phase: 'play' | 'result' | 'ended' = 'play';
  private deck: string[] = [];
  private round = 0;
  private category = '';
  private order: string[] = [];
  private alive = new Set<string>();
  private wins = new Map<string, number>();
  private used = new Set<string>();
  private activeIdx = 0;
  private timeLeft = TURN_TIME;
  private lastWord = '';
  private token = 0;

  constructor(private ctx: GameContext) {}

  start(): void {
    const teams = getTeams(this.ctx.players());
    this.order = teams.map((t) => t.id);
    for (const t of teams) this.wins.set(t.id, 0);
    this.deck = pickFresh(`bataille:${this.ctx.roomCode}`, CATEGORIES, ROUNDS, (c) => c);
    this.beginRound();
    this.ctx.setInterval(() => this.tick(), 1000);
  }
  dispose(): void {}

  private teamName(id: string): string { return getTeams(this.ctx.players()).find((t) => t.id === id)?.name ?? '?'; }

  private beginRound(): void {
    this.category = this.deck[this.round] ?? this.deck[0];
    this.round += 1;
    this.alive = new Set(this.order);
    this.used.clear();
    this.lastWord = '';
    this.activeIdx = 0;
    this.timeLeft = TURN_TIME;
    this.phase = 'play';
    this.ctx.broadcastState();
  }

  private activeTeam(): string { return this.order[this.activeIdx]; }

  private advance(): void {
    this.timeLeft = TURN_TIME;
    let guard = 0;
    do { this.activeIdx = (this.activeIdx + 1) % this.order.length; guard++; } while (!this.alive.has(this.activeTeam()) && guard <= this.order.length);
    this.ctx.broadcastState();
  }

  private tick(): void {
    if (this.phase === 'play') {
      this.timeLeft -= 1;
      if (this.timeLeft <= 0) {
        const out = this.activeTeam();
        this.alive.delete(out);
        this.ctx.emitEvent({ type: 'boom', payload: { name: this.teamName(out) } });
        if (this.alive.size <= 1) return this.endRound();
        this.advance();
      } else {
        this.ctx.broadcastState();
      }
    }
  }

  handleAction(playerId: string, type: string, payload?: unknown): void {
    if (this.phase !== 'play' || type !== 'submit') return;
    const teams = getTeams(this.ctx.players());
    const team = teams.find((t) => t.members.some((m) => m.id === playerId));
    if (!team || team.id !== this.activeTeam()) return; // not your team's turn
    const raw = String((payload as any)?.word ?? '').trim();
    const w = norm(raw);
    if (!w) return;
    if (this.used.has(w)) {
      this.ctx.emitEvent({ type: 'invalid', payload: { reason: 'déjà cité' } }, playerId);
      return;
    }
    this.used.add(w);
    this.lastWord = raw.slice(0, 24);
    this.ctx.emitEvent({ type: 'ok', payload: { word: this.lastWord } });
    this.advance();
  }

  onPlayerLeave(_id: string): void { if (this.phase !== 'ended') this.ctx.broadcastState(); }

  private endRound(): void {
    const winner = [...this.alive][0];
    if (winner) this.wins.set(winner, (this.wins.get(winner) ?? 0) + 1);
    this.phase = 'result';
    this.ctx.broadcastState();
    const tk = ++this.token;
    this.ctx.setTimeout(() => {
      if (tk !== this.token) return;
      if (this.round >= ROUNDS) this.end();
      else this.beginRound();
    }, RESULT_MS);
  }

  private board() {
    return getTeams(this.ctx.players()).map((t) => ({ id: t.id, name: t.name, color: t.color, score: this.wins.get(t.id) ?? 0 })).sort((a, b) => b.score - a.score);
  }
  private end(): void {
    this.phase = 'ended';
    const ranking = this.board().map((t) => ({ label: `Équipe ${t.name}`, score: t.score, color: t.color }));
    this.ctx.endGame({ gameId: 'bataille', ranking, summary: ranking[0] ? `🏆 L'équipe ${this.board()[0].name} remporte la bataille !` : undefined } as GameResults);
  }

  getStateFor(playerId: string): unknown {
    const teams = getTeams(this.ctx.players());
    const myTeam = teams.find((t) => t.members.some((m) => m.id === playerId));
    const activeId = this.activeTeam();
    const winner = this.phase === 'result' ? [...this.alive][0] : null;
    return {
      phase: this.phase,
      round: this.round, totalRounds: ROUNDS,
      category: this.category,
      timeLeft: this.timeLeft,
      activeTeamId: activeId, activeTeamName: this.teamName(activeId),
      isMyTurn: myTeam?.id === activeId && this.alive.has(activeId),
      lastWord: this.lastWord,
      usedCount: this.used.size,
      winnerName: winner ? this.teamName(winner) : null,
      teams: this.order.map((id) => ({ name: this.teamName(id), color: teams.find((t) => t.id === id)?.color, alive: this.alive.has(id), wins: this.wins.get(id) ?? 0, isMine: myTeam?.id === id })),
      actions: this.phase === 'play' && myTeam?.id === activeId && this.alive.has(activeId) ? ['submit'] : [],
    };
  }
}
