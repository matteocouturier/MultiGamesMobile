import { GameModule } from '../../core/game';
import { IntruderGame } from './IntruderGame';

export const intruderModule: GameModule = {
  definition: {
    id: 'intruder',
    name: 'Devine l’Intrus',
    description:
      'Quatre éléments s’affichent : trois appartiennent à la même catégorie, un seul est l’intrus. ' +
      'Trouve-le le plus vite possible ! Plus tu réponds tôt, plus tu marques. 8 énigmes.',
    tagline: 'Trouve l’intrus',
    minPlayers: 2,
    maxPlayers: 8,
    teamBased: false,
    teamSize: 1,
    icon: '🧩',
    color: '#D35400',
  },
  create: (ctx) => new IntruderGame(ctx),
};
