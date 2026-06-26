import { GameModule } from '../../core/game';
import { PopularGame } from './PopularGame';

export const popularModule: GameModule = {
  definition: {
    id: 'popular',
    name: 'Question Populaire',
    description:
      'Réponds comme la majorité ! À chaque question, tu marques un point par autre joueur qui a ' +
      'choisi la même réponse que toi. Sauras-tu deviner ce que pense le groupe ?',
    tagline: 'Pense comme le groupe',
    minPlayers: 3,
    maxPlayers: 8,
    teamBased: false,
    teamSize: 1,
    icon: '🗳️',
    color: '#27AE60',
  },
  create: (ctx) => new PopularGame(ctx),
};
