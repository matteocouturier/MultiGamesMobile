import { GameModule } from '../../core/game';
import { HangmanGame } from './HangmanGame';

export const hangmanModule: GameModule = {
  definition: {
    id: 'hangman',
    name: 'Le Pendu',
    description:
      'Un mot caché : proposez des lettres pour le révéler ! Chaque lettre trouvée rapporte des ' +
      'points, deviner le mot entier en rapporte 5. Mais attention aux erreurs : 8 et la manche est perdue.',
    tagline: 'Devine le mot lettre par lettre',
    minPlayers: 2,
    maxPlayers: 8,
    teamBased: false,
    teamSize: 1,
    icon: '🔡',
    color: '#C0392B',
  },
  create: (ctx) => new HangmanGame(ctx),
};
