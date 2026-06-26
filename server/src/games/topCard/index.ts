import { GameModule } from '../../core/game';
import { TopCardGame } from './TopCardGame';

export const topCardModule: GameModule = {
  definition: {
    id: 'top-card',
    name: 'Plus Haute Carte',
    description:
      'Tu as une main de cartes (1 à 6). Chaque manche, joue-en une en même temps que les autres : ' +
      'la plus haute remporte la manche. Mais une carte jouée est perdue… Quand sortir tes atouts ?',
    tagline: 'Joue la bonne carte au bon moment',
    minPlayers: 2,
    maxPlayers: 8,
    teamBased: false,
    teamSize: 1,
    icon: '🃏',
    color: '#8E44AD',
  },
  create: (ctx) => new TopCardGame(ctx),
};
