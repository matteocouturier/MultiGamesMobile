import { GameModule } from '../../core/game';
import { ReflexGame } from './ReflexGame';

export const reflexModule: GameModule = {
  definition: {
    id: 'reflex',
    name: 'Réflexe',
    description:
      'Attends le signal vert… puis tape le plus vite possible ! Mais attention : taper trop tôt ' +
      'est un faux départ. Le plus rapide sur 5 manches gagne.',
    tagline: 'Le plus rapide gagne',
    minPlayers: 2,
    maxPlayers: 8,
    teamBased: false,
    teamSize: 1,
    icon: '⚡',
    color: '#FFD23D',
  },
  create: (ctx) => new ReflexGame(ctx),
};
