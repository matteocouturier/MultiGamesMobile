import { GameModule } from '../../core/game';
import { HigherLowerGame } from './HigherLowerGame';

export const higherLowerModule: GameModule = {
  definition: {
    id: 'higher-lower',
    name: 'Plus ou Moins',
    description:
      'Un nombre secret entre 1 et 100. Devinez à tour de rôle : on vous dit "plus grand" ou ' +
      '"plus petit". Le premier à trouver le nombre exact gagne la manche !',
    tagline: 'Trouve le nombre secret',
    minPlayers: 2,
    maxPlayers: 8,
    teamBased: false,
    teamSize: 1,
    icon: '🔢',
    color: '#5BC0EB',
  },
  create: (ctx) => new HigherLowerGame(ctx),
};
