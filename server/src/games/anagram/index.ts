import { GameModule } from '../../core/game';
import { AnagramGame } from './AnagramGame';

export const anagramModule: GameModule = {
  definition: {
    id: 'anagram',
    name: 'Anagrammes',
    description:
      'Les lettres d’un mot sont mélangées : sois le premier à retrouver le mot original ! ' +
      '6 manches, le plus rapide à chaque fois marque le point.',
    tagline: 'Remets les lettres dans l’ordre',
    minPlayers: 2,
    maxPlayers: 8,
    teamBased: false,
    teamSize: 1,
    icon: '🔤',
    color: '#F39C12',
  },
  create: (ctx) => new AnagramGame(ctx),
};
