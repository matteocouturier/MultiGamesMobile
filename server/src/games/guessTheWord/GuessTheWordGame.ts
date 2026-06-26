import { GameContext, GameInstance, GamePlayer } from '../../core/game';
import { GameResults } from '../../shared/types';
import { shuffle, WORDS } from './words';

const TURN_DURATION = 60; // seconds
const ROUNDS_PER_TEAM = 2; // each team plays this many turns
const TRANSITION_MS = 6000; // auto-start a turn after this delay

type Phase = 'transition' | 'turn' | 'ended';
type Role = 'describer' | 'guesser' | 'referee' | 'spectator';

interface TeamView {
  teamId: string;
  name: string;
  color: string;
  score: number;
}

/**
 * "Devine le mot" — teams of 2 (one describer, one guesser). The other team(s)
 * referee: they validate found words, allow passes, or flag fouls. A timer and
 * score drive the turn. Turns rotate between teams for a fixed number of rounds.
 */
export class GuessTheWordGame implements GameInstance {
  private phase: Phase = 'transition';
  private scores = new Map<string, number>();
  private teamOrder: string[] = [];
  /** Which member of a team describes this turn (toggles each turn). */
  private roleIndex = new Map<string, number>();

  private activeIdx = 0;
  private turnsPlayed = 0;
  private timeLeft = TURN_DURATION;
  private foundThisTurn = 0;

  private deck: string[] = [];
  private currentWord: string | null = null;
  private tickStarted = false;

  constructor(private ctx: GameContext) {}

  // ---- Lifecycle ----------------------------------------------------------

  start(): void {
    this.teamOrder = this.computeTeamOrder();
    for (const t of this.teamOrder) {
      this.scores.set(t, 0);
      this.roleIndex.set(t, 0);
    }
    this.deck = shuffle(WORDS);
    this.beginTransition();
  }

  dispose(): void {
    // Timers are owned by the engine context and cleared on game end.
  }

  // ---- Turn flow ----------------------------------------------------------

  private beginTransition(): void {
    this.phase = 'transition';
    this.ctx.broadcastState();
    this.ctx.setTimeout(() => {
      if (this.phase === 'transition') this.beginTurn();
    }, TRANSITION_MS);
  }

  private beginTurn(): void {
    this.phase = 'turn';
    this.timeLeft = TURN_DURATION;
    this.foundThisTurn = 0;
    this.nextWord();

    if (!this.tickStarted) {
      this.tickStarted = true;
      this.ctx.setInterval(() => this.tick(), 1000);
    }
    this.ctx.broadcastState();
  }

  private tick(): void {
    if (this.phase !== 'turn') return;
    this.timeLeft -= 1;
    if (this.timeLeft <= 0) {
      this.endTurn();
    } else {
      this.ctx.broadcastState();
    }
  }

  private endTurn(): void {
    // Toggle describer/guesser roles within the team that just played.
    const justPlayed = this.teamOrder[this.activeIdx];
    this.roleIndex.set(justPlayed, (this.roleIndex.get(justPlayed) ?? 0) ^ 1);

    this.turnsPlayed += 1;
    const totalTurns = this.teamOrder.length * ROUNDS_PER_TEAM;
    if (this.turnsPlayed >= totalTurns) {
      this.endGame();
      return;
    }
    this.activeIdx = (this.activeIdx + 1) % this.teamOrder.length;
    this.beginTransition();
  }

  private nextWord(): void {
    if (this.deck.length === 0) this.deck = shuffle(WORDS);
    this.currentWord = this.deck.pop() ?? null;
  }

  private endGame(): void {
    this.phase = 'ended';
    const views = this.teamViews().sort((a, b) => b.score - a.score);
    const results: GameResults = {
      gameId: 'guess-the-word',
      ranking: views.map((v) => ({ label: v.name, score: v.score, color: v.color })),
      summary: views.length ? `🏆 ${views[0].name} l'emporte avec ${views[0].score} points !` : undefined,
    };
    this.ctx.endGame(results);
  }

  // ---- Player actions -----------------------------------------------------

  handleAction(playerId: string, type: string, _payload?: unknown): void {
    if (this.phase === 'transition' && type === 'ready') {
      if (this.isActiveDescriber(playerId)) this.beginTurn();
      return;
    }
    if (this.phase !== 'turn') return;

    const isReferee = this.roleOf(playerId) === 'referee';
    const isActiveMember = this.activeMembers().some((p) => p.id === playerId);

    switch (type) {
      case 'found':
        if (!isReferee) return;
        this.scores.set(
          this.teamOrder[this.activeIdx],
          (this.scores.get(this.teamOrder[this.activeIdx]) ?? 0) + 1
        );
        this.foundThisTurn += 1;
        this.ctx.emitEvent({ type: 'found', payload: { word: this.currentWord } });
        this.nextWord();
        this.ctx.broadcastState();
        break;

      case 'pass':
        if (!isReferee && !isActiveMember) return;
        this.ctx.emitEvent({ type: 'pass', payload: { word: this.currentWord } });
        this.nextWord();
        this.ctx.broadcastState();
        break;

      case 'foul':
        if (!isReferee) return;
        this.ctx.emitEvent({ type: 'foul', payload: { word: this.currentWord } });
        this.nextWord();
        this.ctx.broadcastState();
        break;
    }
  }

  onPlayerLeave(_playerId: string): void {
    // Recompute team order to drop emptied teams; keep the game going.
    const stillThere = new Set(this.computeTeamOrder());
    this.teamOrder = this.teamOrder.filter((t) => stillThere.has(t));
    if (this.teamOrder.length < 2) {
      this.endGame();
      return;
    }
    if (this.activeIdx >= this.teamOrder.length) this.activeIdx = 0;
    if (this.phase !== 'ended') this.ctx.broadcastState();
  }

  // ---- Team helpers -------------------------------------------------------

  private computeTeamOrder(): string[] {
    const seen: string[] = [];
    for (const p of this.ctx.players()) {
      if (p.teamId && !seen.includes(p.teamId)) seen.push(p.teamId);
    }
    return seen;
  }

  private teamMembers(teamId: string): GamePlayer[] {
    return this.ctx.players().filter((p) => p.teamId === teamId);
  }

  private activeMembers(): GamePlayer[] {
    return this.teamMembers(this.teamOrder[this.activeIdx]);
  }

  private activeDescriber(): GamePlayer | undefined {
    const members = this.activeMembers();
    const idx = this.roleIndex.get(this.teamOrder[this.activeIdx]) ?? 0;
    return members[idx % Math.max(members.length, 1)];
  }

  private activeGuesser(): GamePlayer | undefined {
    const members = this.activeMembers();
    if (members.length < 2) return undefined;
    const idx = (this.roleIndex.get(this.teamOrder[this.activeIdx]) ?? 0) ^ 1;
    return members[idx % members.length];
  }

  private isActiveDescriber(playerId: string): boolean {
    return this.activeDescriber()?.id === playerId;
  }

  private roleOf(playerId: string): Role {
    const player = this.ctx.players().find((p) => p.id === playerId);
    if (!player) return 'spectator';
    const activeTeam = this.teamOrder[this.activeIdx];
    if (player.teamId !== activeTeam) return 'referee';
    if (this.activeDescriber()?.id === playerId) return 'describer';
    if (this.activeGuesser()?.id === playerId) return 'guesser';
    return 'spectator';
  }

  private teamViews(): TeamView[] {
    const players = this.ctx.players();
    const meta = new Map<string, { name: string; color: string }>();
    // Pull team display info from any player carrying it is not available here;
    // fall back to generic names. The lobby owns team metadata; we map by order.
    const palette = ['#FF5A5F', '#4C8DFF', '#34C759', '#FFC53D'];
    const names = ['Rouge', 'Bleu', 'Vert', 'Jaune'];
    this.teamOrder.forEach((t, i) => meta.set(t, { name: names[i] ?? `Équipe ${i + 1}`, color: palette[i] ?? '#888' }));
    void players;
    return this.teamOrder.map((t) => ({
      teamId: t,
      name: meta.get(t)!.name,
      color: meta.get(t)!.color,
      score: this.scores.get(t) ?? 0,
    }));
  }

  // ---- Per-player state ---------------------------------------------------

  getStateFor(playerId: string): unknown {
    const role = this.roleOf(playerId);
    const activeTeamId = this.teamOrder[this.activeIdx];
    const teams = this.teamViews();
    const activeView = teams.find((t) => t.teamId === activeTeamId);
    const describer = this.activeDescriber();
    const guesser = this.activeGuesser();

    // Word is visible to the describer and to referees (to validate), hidden
    // from the guesser.
    const canSeeWord = role === 'describer' || role === 'referee';

    const actions: string[] = [];
    if (this.phase === 'transition') {
      if (role === 'describer') actions.push('ready');
    } else if (this.phase === 'turn') {
      if (role === 'referee') actions.push('found', 'pass', 'foul');
      else if (role === 'describer' || role === 'guesser') actions.push('pass');
    }

    return {
      phase: this.phase,
      myRole: role,
      myTeamId: this.ctx.players().find((p) => p.id === playerId)?.teamId ?? null,
      scores: teams,
      activeTeamId,
      activeTeamName: activeView?.name ?? '',
      activeTeamColor: activeView?.color ?? '#888',
      round: Math.floor(this.turnsPlayed / Math.max(this.teamOrder.length, 1)) + 1,
      totalRounds: ROUNDS_PER_TEAM,
      turnIndex: this.turnsPlayed + 1,
      totalTurns: this.teamOrder.length * ROUNDS_PER_TEAM,
      timeLeft: this.timeLeft,
      turnDuration: TURN_DURATION,
      describerName: describer?.name ?? '—',
      guesserName: guesser?.name ?? '—',
      word: canSeeWord ? this.currentWord : null,
      foundThisTurn: this.foundThisTurn,
      actions,
    };
  }
}
