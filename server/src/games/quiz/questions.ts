/** Banque de questions du Quiz Culture. correct = index de la bonne réponse. */
export interface Question {
  q: string;
  options: [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
}

export const QUESTIONS: Question[] = [
  { q: 'Quelle est la capitale de l’Australie ?', options: ['Sydney', 'Canberra', 'Melbourne', 'Perth'], correct: 1 },
  { q: 'Combien de côtés a un hexagone ?', options: ['5', '6', '7', '8'], correct: 1 },
  { q: 'Qui a peint la Joconde ?', options: ['Van Gogh', 'Picasso', 'De Vinci', 'Monet'], correct: 2 },
  { q: 'Quelle planète est la plus proche du Soleil ?', options: ['Vénus', 'Mars', 'Mercure', 'Terre'], correct: 2 },
  { q: 'En quelle année a eu lieu la Révolution française ?', options: ['1789', '1804', '1715', '1848'], correct: 0 },
  { q: 'Quel est le plus grand océan du monde ?', options: ['Atlantique', 'Indien', 'Arctique', 'Pacifique'], correct: 3 },
  { q: 'Combien de joueurs dans une équipe de football (sur le terrain) ?', options: ['9', '10', '11', '12'], correct: 2 },
  { q: 'Quel gaz les plantes absorbent-elles ?', options: ['Oxygène', 'Azote', 'CO2', 'Hydrogène'], correct: 2 },
  { q: 'Quelle est la monnaie du Japon ?', options: ['Yuan', 'Won', 'Yen', 'Roupie'], correct: 2 },
  { q: 'Qui a écrit "Les Misérables" ?', options: ['Zola', 'Hugo', 'Balzac', 'Flaubert'], correct: 1 },
  { q: 'Quel est l’élément chimique de symbole "O" ?', options: ['Or', 'Oxygène', 'Osmium', 'Olivine'], correct: 1 },
  { q: 'Combien de continents y a-t-il ?', options: ['5', '6', '7', '8'], correct: 2 },
  { q: 'Quel animal est le plus rapide du monde (à la course) ?', options: ['Lion', 'Guépard', 'Cheval', 'Antilope'], correct: 1 },
  { q: 'La Tour Eiffel se trouve dans quelle ville ?', options: ['Lyon', 'Marseille', 'Paris', 'Nice'], correct: 2 },
  { q: 'Quel est le plus long fleuve du monde ?', options: ['Amazone', 'Nil', 'Mississippi', 'Yangtsé'], correct: 1 },
  { q: 'Combien font 7 x 8 ?', options: ['54', '56', '58', '64'], correct: 1 },
  { q: 'Quel pays a la forme d’une botte ?', options: ['Espagne', 'Grèce', 'Italie', 'Portugal'], correct: 2 },
  { q: 'Quelle est la vitesse de la lumière (approx.) ?', options: ['300 000 km/s', '150 000 km/s', '1 000 km/s', '3 000 km/s'], correct: 0 },
];

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
