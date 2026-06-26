import { GameModule } from '../../core/game';
import { GuessTheWordGame } from './GuessTheWordGame';

export const guessTheWordModule: GameModule = {
  definition: {
    id: 'guess-the-word',
    name: 'Devine le mot',
    description:
      'En équipe de 2 : un joueur fait deviner un mot à son coéquipier avant la fin du chrono. ' +
      "L'équipe adverse arbitre : elle valide, fait passer ou signale une faute.",
    tagline: 'Fais deviner, marque des points',
    minPlayers: 4,
    maxPlayers: 8,
    teamBased: true,
    teamSize: 2,
    icon: '💬',
    color: '#7C5CFF',
  },
  create: (ctx) => new GuessTheWordGame(ctx),
};
