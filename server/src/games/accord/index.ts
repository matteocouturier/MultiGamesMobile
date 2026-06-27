import { GameModule } from '../../core/game';
import { AccordGame } from './AccordGame';

export const accordModule: GameModule = {
  definition: {
    id: 'accord',
    name: 'Accord Parfait',
    description:
      'En équipe de 2 : un thème s’affiche, et chacun écrit un mot en secret. Si toi et ton ' +
      'coéquipier écrivez le MÊME mot, votre équipe marque ! Pensez à l’unisson.',
    tagline: 'Pense comme ton binôme',
    minPlayers: 4,
    maxPlayers: 8,
    teamBased: true,
    teamSize: 2,
    icon: '🤝',
    color: '#F472B6',
  },
  create: (ctx) => new AccordGame(ctx),
};
