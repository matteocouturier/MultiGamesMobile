import { GameModule } from '../../core/game';
import { Connect4Game } from './Connect4Game';

export const connect4Module: GameModule = {
  definition: {
    id: 'connect4',
    name: 'Puissance 4',
    description:
      'Le duel classique : fais tomber tes jetons et aligne-en 4 (horizontal, vertical ou ' +
      'diagonal) avant ton adversaire. Le meilleur sur 3 manches gagne.',
    tagline: 'Aligne 4 jetons',
    minPlayers: 2,
    maxPlayers: 2,
    teamBased: false,
    teamSize: 1,
    icon: '🔴',
    color: '#E74C3C',
  },
  create: (ctx) => new Connect4Game(ctx),
};
