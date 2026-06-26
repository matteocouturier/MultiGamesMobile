import { GameModule } from '../../core/game';
import { MorpionGame } from './MorpionGame';

export const morpionModule: GameModule = {
  definition: {
    id: 'morpion',
    name: 'Morpion Duel',
    description:
      'Le classique duel à deux : aligne 3 symboles (horizontal, vertical ou diagonal) avant ton ' +
      'adversaire. Le meilleur sur 3 manches gagne. Parfait pour un face-à-face.',
    tagline: 'Aligne 3 symboles',
    minPlayers: 2,
    maxPlayers: 2,
    teamBased: false,
    teamSize: 1,
    icon: '⭕',
    color: '#95A5FF',
  },
  create: (ctx) => new MorpionGame(ctx),
};
