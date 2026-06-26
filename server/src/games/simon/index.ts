import { GameModule } from '../../core/game';
import { SimonGame } from './SimonGame';

export const simonModule: GameModule = {
  definition: {
    id: 'simon',
    name: 'Simon',
    description:
      'Mémorise la séquence de couleurs qui s’allonge à chaque manche, puis reproduis-la dans le ' +
      'bon ordre. Une seule erreur et tu es éliminé. Le dernier survivant gagne.',
    tagline: 'Mémorise la séquence',
    minPlayers: 2,
    maxPlayers: 8,
    teamBased: false,
    teamSize: 1,
    icon: '🪜',
    color: '#16A085',
  },
  create: (ctx) => new SimonGame(ctx),
};
