import { GameModule } from '../../core/game';
import { UndercoverGame } from './UndercoverGame';

export const undercoverModule: GameModule = {
  definition: {
    id: 'undercover',
    name: 'Undercover',
    description:
      'Presque tout le monde a le même mot secret… sauf l’imposteur, qui en a un proche mais ' +
      'différent (et l’ignore !). À chaque manche, donnez un indice en un mot, puis votez pour ' +
      'éliminer un suspect. Démasquez l’undercover avant qu’il ne reste !',
    tagline: 'Démasque l’imposteur',
    minPlayers: 3,
    maxPlayers: 8,
    teamBased: false,
    teamSize: 1,
    icon: '🕵️',
    color: '#E8556D',
  },
  create: (ctx) => new UndercoverGame(ctx),
};
