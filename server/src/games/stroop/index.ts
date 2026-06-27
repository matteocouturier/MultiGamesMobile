import { GameModule } from '../../core/game';
import { StroopGame } from './StroopGame';

export const stroopModule: GameModule = {
  definition: {
    id: 'stroop',
    name: 'Couleur-Mot',
    description:
      'Un mot de couleur s’affiche… mais écrit dans une autre couleur ! Tape la COULEUR de l’encre, ' +
      'pas le mot. Ton cerveau va chauffer. Le plus rapide sur 8 manches gagne.',
    tagline: 'Tape la couleur, pas le mot !',
    minPlayers: 2,
    maxPlayers: 8,
    teamBased: false,
    teamSize: 1,
    icon: '🎨',
    color: '#FF4D88',
  },
  create: (ctx) => new StroopGame(ctx),
};
