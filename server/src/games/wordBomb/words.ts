/**
 * Base words used to generate *solvable* syllable fragments (each fragment is a
 * substring of at least one real word) and helpers for lenient validation.
 */
const BASE_WORDS = [
  'maison', 'voiture', 'chat', 'chien', 'table', 'chaise', 'fenetre', 'porte',
  'jardin', 'fleur', 'arbre', 'montagne', 'riviere', 'soleil', 'lune', 'etoile',
  'manger', 'boire', 'courir', 'sauter', 'parler', 'ecouter', 'regarder', 'penser',
  'rouge', 'bleu', 'vert', 'jaune', 'orange', 'violet', 'noir', 'blanc',
  'matin', 'journee', 'soiree', 'minute', 'seconde', 'heure', 'semaine', 'annee',
  'pomme', 'banane', 'orange', 'fraise', 'cerise', 'raisin', 'tomate', 'carotte',
  'ordinateur', 'telephone', 'musique', 'cinema', 'theatre', 'lecture', 'voyage',
  'animal', 'oiseau', 'poisson', 'cheval', 'lapin', 'souris', 'tortue', 'lion',
  'travail', 'ecole', 'famille', 'ami', 'amour', 'bonheur', 'cuisine', 'plage',
  'feliciter', 'partir', 'arriver', 'comprendre', 'apprendre', 'construire',
];

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
