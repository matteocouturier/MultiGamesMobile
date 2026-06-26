import { GameModule } from '../../core/game';
import { NumberGuessGame } from './NumberGuessGame';

export const numberGuessModule: GameModule = {
  definition: {
    id: 'number-guess',
    name: 'La Question',
    description:
      'Une question à réponse chiffrée (combien d’os, quelle hauteur…). Propose ton nombre : ' +
      'les plus proches de la vérité marquent le plus de points. 5 questions.',
    tagline: 'Trouve le bon chiffre',
    minPlayers: 2,
    maxPlayers: 8,
    teamBased: false,
    teamSize: 1,
    icon: '🎯',
    color: '#1ABC9C',
  },
  create: (ctx) => new NumberGuessGame(ctx),
};
