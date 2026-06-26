/** Paires de mots proches : les civils ont le 1er, l'undercover le 2nd. */
export const WORD_PAIRS: [string, string][] = [
  ['Chat', 'Tigre'],
  ['Café', 'Thé'],
  ['Plage', 'Désert'],
  ['Vélo', 'Moto'],
  ['Pomme', 'Poire'],
  ['Train', 'Métro'],
  ['Pizza', 'Quiche'],
  ['Lac', 'Rivière'],
  ['Roi', 'Empereur'],
  ['Crayon', 'Stylo'],
  ['Neige', 'Pluie'],
  ['Guitare', 'Violon'],
  ['Médecin', 'Infirmier'],
  ['Lion', 'Loup'],
  ['Bateau', 'Sous-marin'],
  ['Château', 'Palais'],
  ['Soleil', 'Lune'],
  ['Football', 'Rugby'],
];

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
