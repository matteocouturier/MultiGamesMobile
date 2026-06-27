import wordsData from '../../content/guess-the-word.json';
/** French word bank for "Devine le mot". Easily extendable. */
export const WORDS: string[] = wordsData as string[];

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
