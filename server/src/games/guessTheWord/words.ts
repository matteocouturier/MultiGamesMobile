/** French word bank for "Devine le mot". Easily extendable. */
export const WORDS: string[] = [
  'Montagne', 'Guitare', 'Éléphant', 'Pizza', 'Ordinateur', 'Plage', 'Volcan',
  'Bibliothèque', 'Parapluie', 'Dauphin', 'Château', 'Fusée', 'Chocolat',
  'Aspirateur', 'Pyramide', 'Cascade', 'Trampoline', 'Boussole', 'Hélicoptère',
  'Marionnette', 'Phare', 'Avalanche', 'Saxophone', 'Kangourou', 'Lanterne',
  'Brouette', 'Tornade', 'Cactus', 'Igloo', 'Sirène', 'Télescope', 'Vampire',
  'Brouillard', 'Carrousel', 'Escargot', 'Feu d’artifice', 'Labyrinthe',
  'Moustache', 'Perroquet', 'Sous-marin', 'Toboggan', 'Tournevis', 'Citrouille',
  'Domino', 'Étoile filante', 'Grenouille', 'Hamac', 'Jongleur', 'Mammouth',
  'Origami', 'Pingouin', 'Radeau', 'Sablier', 'Trésor', 'Ukulélé', 'Wagon',
];

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
