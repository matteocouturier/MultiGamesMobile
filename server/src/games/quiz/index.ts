import { GameModule } from '../../core/game';
import { QuizGame } from './QuizGame';

export const quizModule: GameModule = {
  definition: {
    id: 'quiz',
    name: 'Quiz Culture',
    description:
      'Tous la même question à choix multiples : réponds vite et juste ! Plus tu es rapide, ' +
      'plus tu marques de points. Le meilleur score après 8 questions gagne.',
    tagline: 'Réponds vite, marque fort',
    minPlayers: 2,
    maxPlayers: 8,
    teamBased: false,
    teamSize: 1,
    icon: '🧠',
    color: '#34C7C5',
  },
  create: (ctx) => new QuizGame(ctx),
};
