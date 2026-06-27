import { GameContext, GameInstance } from '../../core/game';
import { GameResults } from '../../shared/types';
import { pickFresh } from '../shared/freshDeck';
import { getTeams } from '../shared/teams';

const SPECTRA: [string, string][] = [
  ['Froid', 'Chaud'], ['Inutile', 'Indispensable'], ['Vieux', 'Moderne'], ['Mauvais', 'Bon'],
  ['Petit', 'Grand'], ['Pas cher', 'Cher'], ['Calme', 'Excitant'], ['Connu', 'Méconnu'],
  ['Sain', 'Malsain'], ['Facile', 'Difficile'], ['Laid', 'Beau'], ['Lent', 'Rapide'],
  ['Triste', 'Joyeux'], ['Commun', 'Rare'], ['Sérieux', 'Drôle'], ['Sucré', 'Salé'],
];
const CLUE_MS = 40000;
const GUESS_MS = 40000;
const REVEAL_MS = 7000;

function points(dist: number): number {
  if (dist <= 4) return 4;
  if (dist <= 10) return 3;
  if (dist <= 18) return 2;
  if (dist <= 28) return 1;
  return 0;
}

/** Sur la Longueur d'onde — par équipes de 2. Le "médium" voit une cible cachée sur
 *  un axe (ex. Froid↔Chaud) et donne un indice ; son coéquipier place le curseur.
 *  Plus c'est proche, plus l'équipe marque. Les rôles tournent. */
export class WavelengthGame implements GameInstance {
  private phase: 'clue' | 'guess' | 'reveal' | 'ended' = 'clue';
  private order: string[] = [];
  private roleIndex = new Map<string, number>();
  private scores = new Map<string, number>();
  private activeIdx = 0;
  private turn = 0;
  private totalTurns = 0;
  private spectrum: [string, string] = ['Froid', 'Chaud'];
  private target = 50;
  private clue = '';
  private guess = 50;
  private lastPoints = 0;
  private deckIdx = 0;
  private deck: [string, string][] = [];
  private token = 0;

  constructor(private ctx: GameContext) {}

  start(): void {
    const teams = getTeams(this.ctx.players());
    this.order = teams.map((t) => t.id);
    for (const t of teams) { this.scores.set(t.id, 0); this.roleIndex.set(t.id, 0); }
    this.totalTurns = this.order.length * 2;
    this.deck = pickFresh(`wavelength:${this.ctx.roomCode}`, SPECTRA, this.totalTurns, (s) => s.join('|'));
    this.beginTurn();
  }
  dispose(): void {}

  private schedule(fn: () => void, ms: number): void {
    const tk = ++this.token;
    this.ctx.setTimeout(() => { if (tk === this.token) fn(); }, ms);
  }

  private activeTeamId(): string { return this.order[this.activeIdx]; }
  private members(teamId: string) { return getTeams(this.ctx.players()).find((t) => t.id === teamId)?.members ?? []; }
  private psychicId(teamId: string): string | undefined { const m = this.members(teamId); return m[(this.roleIndex.get(teamId) ?? 0) % Math.max(m.length, 1)]?.id; }
  private guesserId(teamId: string): string | undefined { const m = this.members(teamId); if (m.length < 2) return undefined; return m[((this.roleIndex.get(teamId) ?? 0) ^ 1) % m.length]?.id; }

  private beginTurn(): void {
    this.turn += 1;
    this.spectrum = this.deck[this.deckIdx] ?? SPECTRA[0];
    this.deckIdx += 1;
    this.target = 5 + Math.floor(Math.random() * 90);
    this.clue = '';
    this.guess = 50;
    this.lastPoints = 0;
    this.phase = 'clue';
    this.ctx.broadcastState();
    this.schedule(() => this.toGuess(), CLUE_MS);
  }

  private toGuess(): void {
    if (this.phase !== 'clue') return;
    if (!this.clue) this.clue = '(aucun indice)';
    this.phase = 'guess';
    this.ctx.broadcastState();
    this.schedule(() => this.reveal(), GUESS_MS);
  }

  private reveal(): void {
    this.phase = 'reveal';
    this.lastPoints = points(Math.abs(this.guess - this.target));
    this.scores.set(this.activeTeamId(), (this.scores.get(this.activeTeamId()) ?? 0) + this.lastPoints);
    this.ctx.broadcastState();
    this.schedule(() => {
      const team = this.activeTeamId();
      this.roleIndex.set(team, (this.roleIndex.get(team) ?? 0) ^ 1); // swap roles next time
      if (this.turn >= this.totalTurns) return this.end();
      this.activeIdx = (this.activeIdx + 1) % this.order.length;
      this.beginTurn();
    }, REVEAL_MS);
  }

  handleAction(playerId: string, type: string, payload?: unknown): void {
    const team = this.activeTeamId();
    if (this.phase === 'clue' && type === 'clue' && this.psychicId(team) === playerId) {
      const w = String((payload as any)?.word ?? '').trim().slice(0, 24);
      if (!w) return;
      this.clue = w;
      this.toGuess();
    } else if (this.phase === 'guess' && type === 'guess' && this.guesserId(team) === playerId) {
      const v = Math.max(0, Math.min(100, Math.round(Number((payload as any)?.value))));
      if (!Number.isFinite(v)) return;
      this.guess = v;
      this.reveal();
    }
  }
  onPlayerLeave(_id: string): void { if (this.phase !== 'ended') this.ctx.broadcastState(); }

  private board() {
    return getTeams(this.ctx.players()).map((t) => ({ id: t.id, name: t.name, color: t.color, score: this.scores.get(t.id) ?? 0 })).sort((a, b) => b.score - a.score);
  }
  private end(): void {
    this.phase = 'ended';
    const ranking = this.board().map((t) => ({ label: `Équipe ${t.name}`, score: t.score, color: t.color }));
    this.ctx.endGame({ gameId: 'wavelength', ranking, summary: ranking[0] ? `🏆 L'équipe ${this.board()[0].name} est parfaitement sur la même longueur d'onde !` : undefined } as GameResults);
  }

  getStateFor(playerId: string): unknown {
    const teams = getTeams(this.ctx.players());
    const activeId = this.activeTeamId();
    const myTeam = teams.find((t) => t.members.some((m) => m.id === playerId));
    const isPsychic = this.psychicId(activeId) === playerId;
    const isGuesser = this.guesserId(activeId) === playerId;
    const role = isPsychic ? 'psychic' : isGuesser ? 'guesser' : 'spectator';
    const reveal = this.phase === 'reveal';
    // Target visible to the psychic during the clue phase, and everyone at reveal.
    const seeTarget = reveal || (isPsychic && this.phase === 'clue');
    return {
      phase: this.phase,
      turn: this.turn, totalTurns: this.totalTurns,
      spectrum: { left: this.spectrum[0], right: this.spectrum[1] },
      activeTeamName: teams.find((t) => t.id === activeId)?.name ?? '',
      activeTeamColor: teams.find((t) => t.id === activeId)?.color ?? '#888',
      myRole: role,
      psychicName: teams.find((t) => t.id === activeId)?.members.find((m) => m.id === this.psychicId(activeId))?.name ?? '',
      guesserName: teams.find((t) => t.id === activeId)?.members.find((m) => m.id === this.guesserId(activeId))?.name ?? '',
      target: seeTarget ? this.target : null,
      clue: this.phase === 'clue' ? null : this.clue,
      guess: reveal ? this.guess : null,
      points: reveal ? this.lastPoints : null,
      myTeamId: myTeam?.id ?? null,
      leaderboard: this.board().map((t) => ({ name: t.name, color: t.color, score: t.score, isMine: t.id === myTeam?.id })),
      actions: isPsychic && this.phase === 'clue' ? ['clue'] : isGuesser && this.phase === 'guess' ? ['guess'] : [],
    };
  }
}
