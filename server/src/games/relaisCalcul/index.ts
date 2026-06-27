import { GameModule } from '../../core/game';
import { RelaisCalculGame } from './RelaisCalculGame';

export const relaisCalculModule: GameModule = {
  definition: {
    id: 'relais-calcul',
    name: 'Relais Calcul',
    description:
      'Course de calcul par équipes de 2 ! Résolvez en alternance (relais) : à chaque bonne réponse, ' +
      'la main passe à votre coéquipier. Première équipe à 12 bonnes réponses remporte la course.',
    tagline: 'La course de calcul à deux',
    minPlayers: 4,
    maxPlayers: 8,
    teamBased: true,
    teamSize: 2,
    icon: '➗',
    color: '#38BDF8',
  },
  create: (ctx) => new RelaisCalculGame(ctx),
};
