/** Client-side categorisation of games, used by the home filters. */
export interface Category {
  key: string;
  label: string;
  icon: string;
}

export const CATEGORIES: Category[] = [
  { key: 'mots', label: 'Mots', icon: '🔤' },
  { key: 'quiz', label: 'Quiz & Culture', icon: '🧠' },
  { key: 'reflexe', label: 'Réflexe', icon: '⚡' },
  { key: 'strategie', label: 'Stratégie', icon: '♟️' },
  { key: 'ambiance', label: 'Ambiance', icon: '🎉' },
];

/** gameId -> category key. */
export const GAME_CATEGORY: Record<string, string> = {
  'guess-the-word': 'mots',
  'word-bomb': 'mots',
  'anagram': 'mots',
  'hangman': 'mots',
  'petit-bac': 'mots',
  'quiz': 'quiz',
  'true-false': 'quiz',
  'emoji-quiz': 'quiz',
  'number-guess': 'quiz',
  'intruder': 'quiz',
  'reflex': 'reflexe',
  'stroop': 'reflexe',
  'math-duel': 'reflexe',
  'simon': 'reflexe',
  'memory': 'reflexe',
  'morpion': 'strategie',
  'connect4': 'strategie',
  'top-card': 'strategie',
  'higher-lower': 'ambiance',
  'undercover': 'ambiance',
  'chifoumi': 'ambiance',
  'popular': 'ambiance',
  'press-luck': 'ambiance',
  'accord': 'ambiance',
  'duo-quiz': 'quiz',
  'bataille': 'ambiance',
  'relais-calcul': 'reflexe',
  'wavelength': 'ambiance',
};
