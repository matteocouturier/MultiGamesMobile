import { GameModule } from '../../core/game';
import { EmojiQuizGame } from './EmojiQuizGame';

export const emojiQuizModule: GameModule = {
  definition: {
    id: 'emoji-quiz',
    name: 'Quiz Emoji',
    description:
      'Des emojis décrivent un film ou une chose : devine de quoi il s’agit ! QCM, plus tu réponds ' +
      'vite plus tu marques. 8 énigmes.',
    tagline: 'Devine le film en emojis',
    minPlayers: 2,
    maxPlayers: 8,
    teamBased: false,
    teamSize: 1,
    icon: '🎬',
    color: '#FF6B9D',
  },
  create: (ctx) => new EmojiQuizGame(ctx),
};
