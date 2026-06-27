import { GameModule } from '../../core/game';
import { PetitBacGame } from './PetitBacGame';

export const petitBacModule: GameModule = {
  definition: {
    id: 'petit-bac',
    name: 'Petit Bac',
    description:
      'Une lettre est tirée : trouve un mot par catégorie (Prénom, Animal, Ville…) commençant ' +
      'par cette lettre. Réponse unique = 2 points, partagée = 1 point. Le plus rapide stoppe la manche !',
    tagline: 'Une lettre, des catégories',
    minPlayers: 2,
    maxPlayers: 8,
    teamBased: false,
    teamSize: 1,
    icon: '📝',
    color: '#9B7BFF',
  },
  create: (ctx) => new PetitBacGame(ctx),
};
