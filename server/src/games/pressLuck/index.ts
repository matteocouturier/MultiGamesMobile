import { GameModule } from '../../core/game';
import { PressLuckGame } from './PressLuckGame';

export const pressLuckModule: GameModule = {
  definition: {
    id: 'press-luck',
    name: 'Stop ou Encore',
    description:
      'Tente le diable ! À chaque "Encore", tu gagnes des points… mais tu risques de tout perdre. ' +
      '"Stop" sécurise ton butin de la manche. Le plus gros total après 4 manches gagne.',
    tagline: 'Jusqu’où iras-tu ?',
    minPlayers: 2,
    maxPlayers: 8,
    teamBased: false,
    teamSize: 1,
    icon: '🎲',
    color: '#F1C40F',
  },
  create: (ctx) => new PressLuckGame(ctx),
};
