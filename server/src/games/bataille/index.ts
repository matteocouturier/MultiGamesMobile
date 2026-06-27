import { GameModule } from '../../core/game';
import { BatailleGame } from './BatailleGame';

export const batailleModule: GameModule = {
  definition: {
    id: 'bataille',
    name: 'Bataille de Catégories',
    description:
      'Par équipes : une catégorie est tirée (Fruits, Pays…). À tour de rôle, chaque équipe doit ' +
      'citer un mot sans répétition avant la fin du temps. L’équipe qui sèche est éliminée. La ' +
      'dernière équipe en lice gagne la manche !',
    tagline: 'Citez sans sécher !',
    minPlayers: 4,
    maxPlayers: 8,
    teamBased: true,
    teamSize: 2,
    icon: '🔥',
    color: '#FB923C',
  },
  create: (ctx) => new BatailleGame(ctx),
};
