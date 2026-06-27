import pairsData from '../../content/undercover.json';
/** Paires de mots proches : les civils ont le 1er, l'undercover le 2nd. */
export const WORD_PAIRS: [string, string][] = pairsData as [string, string][];

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
