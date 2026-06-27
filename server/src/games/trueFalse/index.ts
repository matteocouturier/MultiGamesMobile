import { GameModule } from '../../core/game';
import { TrueFalseGame } from './TrueFalseGame';

export const trueFalseModule: GameModule = {
  definition: {
    id: 'true-false',
    name: 'Vrai ou Faux',
    description:
      'Une affirmation s’affiche : vrai ou faux ? Réponds le plus vite possible, plus tu es rapide ' +
      'plus tu marques. Le meilleur score après 8 affirmations gagne.',
    tagline: 'Vrai... ou faux ?',
    minPlayers: 2,
    maxPlayers: 8,
    teamBased: false,
    teamSize: 1,
    icon: '✅',
    color: '#2ECC71',
  },
  create: (ctx) => new TrueFalseGame(ctx),
};
