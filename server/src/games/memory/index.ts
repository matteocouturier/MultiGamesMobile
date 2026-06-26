import { GameModule } from '../../core/game';
import { MemoryGame } from './MemoryGame';

export const memoryModule: GameModule = {
  definition: {
    id: 'memory',
    name: 'Memory',
    description:
      'Retourne deux cartes pour trouver des paires identiques. Une paire trouvée et tu rejoues ! ' +
      'Tour par tour, celui qui réunit le plus de paires gagne. Mémoire et observation.',
    tagline: 'Trouve les paires',
    minPlayers: 2,
    maxPlayers: 6,
    teamBased: false,
    teamSize: 1,
    icon: '🧠',
    color: '#2980B9',
  },
  create: (ctx) => new MemoryGame(ctx),
};
