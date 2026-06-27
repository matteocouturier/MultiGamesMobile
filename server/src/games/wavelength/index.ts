import { GameModule } from '../../core/game';
import { WavelengthGame } from './WavelengthGame';

export const wavelengthModule: GameModule = {
  definition: {
    id: 'wavelength',
    name: 'Longueur d’onde',
    description:
      'Par équipes de 2 : le "médium" voit une cible cachée sur un axe (ex. Froid ↔ Chaud) et donne ' +
      'un seul indice. Son coéquipier place le curseur au bon endroit. Plus c’est proche, plus vous ' +
      'marquez ! Les rôles tournent à chaque tour.',
    tagline: 'Êtes-vous sur la même longueur d’onde ?',
    minPlayers: 4,
    maxPlayers: 8,
    teamBased: true,
    teamSize: 2,
    icon: '🎯',
    color: '#A78BFA',
  },
  create: (ctx) => new WavelengthGame(ctx),
};
