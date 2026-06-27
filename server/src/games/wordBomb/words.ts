import baseWordsData from '../../content/word-bomb.json';
/**
 * Base words used to generate *solvable* syllable fragments (each fragment is a
 * substring of at least one real word) and helpers for lenient validation.
 */
const BASE_WORDS: string[] = baseWordsData as string[];

/** Strip accents and non-letters, lowercase. */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

/** Generate an uppercase 2-3 letter fragment that exists in a real word. */
export function randomFragment(): string {
  for (let i = 0; i < 20; i++) {
    const w = normalize(BASE_WORDS[Math.floor(Math.random() * BASE_WORDS.length)]);
    const len = Math.random() < 0.6 ? 2 : 3;
    if (w.length < len + 1) continue;
    const start = Math.floor(Math.random() * (w.length - len));
    return w.slice(start, start + len).toUpperCase();
  }
  return 'TA';
}
