import { GameContext, GameInstance } from '../../core/game';
import { GameResults } from '../../shared/types';
import { Question, QUESTIONS, shuffle } from './questions';

const QUESTION_TIME = 15; // seconds to answer
const REVEAL_TIME = 4; // seconds showing the answer
const NB_QUESTIONS = 8;

/**
 * Quiz Culture — free-for-all trivia. Everyone answers the same multiple-choice
 * question; points scale with how fast you answer. A reusable base for themed
 * quizzes (swap the question bank).
 */
export class QuizGame implements GameInstance {
  private phase: 'question' | 'reveal' | 'ended' = 'question';
  private deck: Question[] = [];
  private idx = 0;
  private timeLeft = QUESTION_TIME;
  private scores = new Map<string, number>();
  private names = new Map<string, string>();
  private answers = new Map<string, { choice: number; timeLeft: number }>();
  private tickStarted = false;

  constructor(private ctx: GameContext) {}

  start(): void {
    for (const p of this.ctx.players()) {
      this.scores.set(p.id, 0);
      this.names.set(p.id, p.name);
    }
    this.deck = shuffle(QUESTIONS).slice(0, NB_QUESTIONS);
    this.beginQuestion();
    this.ctx.setInterval(() => this.tick(), 1000);
    this.tickStarted = true;
  }

  dispose(): void {}

  private beginQuestion(): void {
    this.phase = 'question';
    this.timeLeft = QUESTION_TIME;
    this.answers.clear();
    this.ctx.broadcastState();
  }

  private tick(): void {
    if (this.phase === 'question') {
      this.timeLeft -= 1;
      if (this.timeLeft <= 0 || this.answers.size >= this.scores.size) {
        this.reveal();
      } else {
        this.ctx.broadcastState();
      }
    } else if (this.phase === 'reveal') {
      this.timeLeft -= 1;
      if (this.timeLeft <= 0) this.next();
      else this.ctx.broadcastState();
    }
  }

  private reveal(): void {
    this.phase = 'reveal';
    this.timeLeft = REVEAL_TIME;
    const q = this.deck[this.idx];
    for (const [pid, a] of this.answers) {
      if (a.choice === q.correct) {
        const bonus = Math.round(500 * (a.timeLeft / QUESTION_TIME));
        this.scores.set(pid, (this.scores.get(pid) ?? 0) + 500 + bonus);
      }
    }
    this.ctx.broadcastState();
  }

  private next(): void {
    this.idx += 1;
    if (this.idx >= this.deck.length) return this.endGame();
    this.beginQuestion();
  }

  handleAction(playerId: string, type: string, payload?: unknown): void {
    if (this.phase !== 'question' || type !== 'answer') return;
    if (this.answers.has(playerId)) return; // already answered
    const choice = typeof payload === 'object' && payload && 'index' in payload ? Number((payload as any).index) : -1;
    if (choice < 0 || choice > 3) return;
    this.answers.set(playerId, { choice, timeLeft: this.timeLeft });
    this.ctx.emitEvent({ type: 'answered' }, playerId);
    this.ctx.broadcastState();
  }

  onPlayerLeave(playerId: string): void {
    this.answers.delete(playerId);
    if (this.phase !== 'ended') this.ctx.broadcastState();
  }

  private leaderboard() {
    return [...this.scores.entries()]
      .map(([id, score]) => ({ label: this.names.get(id) ?? '?', score }))
      .sort((a, b) => b.score - a.score);
  }

  private endGame(): void {
    this.phase = 'ended';
    const ranking = this.leaderboard();
    this.ctx.endGame({
      gameId: 'quiz',
      ranking,
      summary: ranking[0] ? `🏆 ${ranking[0].label} gagne avec ${ranking[0].score} points !` : undefined,
    } as GameResults);
  }

  getStateFor(playerId: string): unknown {
    const q = this.deck[this.idx];
    const mine = this.answers.get(playerId);
    const reveal = this.phase === 'reveal';
    return {
      phase: this.phase,
      questionIndex: this.idx + 1,
      totalQuestions: this.deck.length,
      question: q?.q ?? '',
      options: q?.options ?? [],
      timeLeft: this.timeLeft,
      duration: reveal ? REVEAL_TIME : QUESTION_TIME,
      myAnswer: mine?.choice ?? null,
      answeredCount: this.answers.size,
      totalPlayers: this.scores.size,
      correctIndex: reveal ? q?.correct ?? null : null,
      iWasRight: reveal ? mine?.choice === q?.correct : null,
      leaderboard: this.leaderboard(),
      actions: this.phase === 'question' && !mine ? ['answer'] : [],
    };
  }
}
