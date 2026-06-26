import React from 'react';
import { GuessTheWordView } from './guessTheWord/GuessTheWordView';

/**
 * Maps a gameId to its in-game view component. Mirror of the server-side game
 * registry: register a new game's view here and it renders automatically.
 */
export const GAME_VIEWS: Record<string, React.ComponentType<{ state: any }>> = {
  'guess-the-word': GuessTheWordView,
};
