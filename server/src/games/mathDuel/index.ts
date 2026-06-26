import { GameModule } from '../../core/game';
import { MathDuelGame } from './MathDuelGame';

export const mathDuelModule: GameModule = {
  definition: {
    id: 'math-duel',
    name: 'Calcul Mental',
    description:
      'Un calcul s’affiche : sois le premier à donner le bon résultat ! 8 manches, le plus rapide ' +
      'à chaque calcul marque le point. Réveille tes neurones.',
    tagline: 'Le plus rapide en calcul',
    minPlayers: 2,
    maxPlayers: 8,
    teamBased: false,
    teamSize: 1,
    icon: '🧮',
    color: '#3498DB',
  },
  create: (ctx) => new MathDuelGame(ctx),
};
