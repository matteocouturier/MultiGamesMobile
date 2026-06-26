import React from 'react';
import { GuessTheWordView } from './guessTheWord/GuessTheWordView';
import { WordBombView } from './wordBomb/WordBombView';
import { QuizView } from './quiz/QuizView';
import { ReflexView } from './reflex/ReflexView';
import { HigherLowerView } from './higherLower/HigherLowerView';
import { PetitBacView } from './petitBac/PetitBacView';
import { UndercoverView } from './undercover/UndercoverView';
import { TrueFalseView } from './trueFalse/TrueFalseView';
import { AnagramView } from './anagram/AnagramView';
import { ChifoumiView } from './chifoumi/ChifoumiView';
import { NumberGuessView } from './numberGuess/NumberGuessView';
import { MathDuelView } from './mathDuel/MathDuelView';
import { EmojiQuizView } from './emojiQuiz/EmojiQuizView';
import { StroopView } from './stroop/StroopView';
import { MorpionView } from './morpion/MorpionView';
import { SimonView } from './simon/SimonView';
import { HangmanView } from './hangman/HangmanView';
import { TopCardView } from './topCard/TopCardView';
import { PopularView } from './popular/PopularView';

/**
 * Maps a gameId to its in-game view component. Mirror of the server-side game
 * registry: register a new game's view here and it renders automatically.
 */
export const GAME_VIEWS: Record<string, React.ComponentType<{ state: any }>> = {
  'guess-the-word': GuessTheWordView,
  'word-bomb': WordBombView,
  'quiz': QuizView,
  'reflex': ReflexView,
  'higher-lower': HigherLowerView,
  'petit-bac': PetitBacView,
  'undercover': UndercoverView,
  'true-false': TrueFalseView,
  'anagram': AnagramView,
  'chifoumi': ChifoumiView,
  'number-guess': NumberGuessView,
  'math-duel': MathDuelView,
  'emoji-quiz': EmojiQuizView,
  'stroop': StroopView,
  'morpion': MorpionView,
  'simon': SimonView,
  'hangman': HangmanView,
  'top-card': TopCardView,
  'popular': PopularView,
};
