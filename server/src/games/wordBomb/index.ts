import { GameModule } from '../../core/game';
import { WordBombGame } from './WordBombGame';

export const wordBombModule: GameModule = {
  definition: {
    id: 'word-bomb',
    name: 'La Bombe à mots',
    description:
      'Chacun son tour : un fragment de syllabe s’affiche, tu dois taper un mot qui le contient ' +
      'avant que la bombe explose ! Sinon tu perds une vie. Dernier survivant gagne.',
    tagline: 'Trouve un mot avant l’explosion',
    minPlayers: 2,
    maxPlayers: 8,
    teamBased: false,
    teamSize: 1,
    icon: '💣',
    color: '#FF8A3D',
  },
  create: (ctx) => new WordBombGame(ctx),
};
