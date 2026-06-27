/** Questions loaded from the editable config: src/content/quiz.json */
import data from '../../content/quiz.json';

export interface Question {
  q: string;
  options: string[];
  correct: number;
}

export const QUESTIONS: Question[] = data as Question[];
