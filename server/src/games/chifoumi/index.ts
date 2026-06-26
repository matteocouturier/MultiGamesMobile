import { GameModule } from '../../core/game';
import { ChifoumiGame } from './ChifoumiGame';

export const chifoumiModule: GameModule = {
  definition: {
    id: 'chifoumi',
    name: 'Chifoumi Tournoi',
    description:
      'Pierre, feuille, ciseaux… mais à plusieurs ! Chaque manche, tu marques un point par ' +
      'adversaire battu. Le meilleur total après 5 manches remporte le tournoi.',
    tagline: 'Pierre, feuille, ciseaux !',
    minPlayers: 2,
    maxPlayers: 8,
    teamBased: false,
    teamSize: 1,
    icon: '✊',
    color: '#E67E22',
  },
  create: (ctx) => new ChifoumiGame(ctx),
};
