import { GameModule } from '../../core/game';
import { DuoQuizGame } from './DuoQuizGame';

export const duoQuizModule: GameModule = {
  definition: {
    id: 'duo-quiz',
    name: 'Duo Quiz',
    description:
      'Quiz par équipes de 2, en relais : à chaque question, un seul d’entre vous répond (à tour ' +
      'de rôle). Faites confiance à votre coéquipier ! Bonne réponse = point pour l’équipe.',
    tagline: 'Le quiz en relais à deux',
    minPlayers: 4,
    maxPlayers: 8,
    teamBased: true,
    teamSize: 2,
    icon: '🧠',
    color: '#22D3EE',
  },
  create: (ctx) => new DuoQuizGame(ctx),
};
