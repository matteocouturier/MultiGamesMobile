import React from 'react';
import { GuessTheWordView } from './guessTheWord/GuessTheWordView';
import { WordBombView } from './wordBomb/WordBombView';
import { QuizView } from './quiz/QuizView';
import { ReflexView } from './reflex/ReflexView';

/**
 * Maps a gameId to its in-game view component. Mirror of the server-side game
 * registry: register a new game's view here and it renders automatically.
 */
export const GAME_VIEWS: Record<string, React.ComponentType<{ state: any }>> = {
  'guess-the-word': GuessTheWordView,
  'word-bomb': WordBombView,
  'quiz': QuizView,
  'reflex': ReflexView,
};
