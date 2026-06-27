# 📝 Fichiers de configuration des jeux

Chaque jeu lit son contenu (questions, mots, catégories…) depuis un fichier
JSON ici. **Pour enrichir un jeu, il suffit d'ajouter des entrées dans le bon
fichier** — pas besoin de toucher au code. Après modification, redéploie
(`bash deploy.sh`) pour que les changements soient pris en compte.

| Fichier | Jeu | Format d'une entrée |
|---|---|---|
| `quiz.json` | Quiz Culture | `{ "q": "Question ?", "options": ["A","B","C","D"], "correct": 0 }` (correct = index 0-3) |
| `true-false.json` | Vrai ou Faux | `{ "text": "Affirmation.", "answer": true }` |
| `emoji-quiz.json` | Quiz Emoji | `{ "emojis": "🦁👑", "options": ["A","B","C","D"], "correct": 0 }` |
| `number-guess.json` | La Question | `{ "q": "Combien… ?", "answer": 206, "unit": "cm" }` (unit optionnel) |
| `intruder.json` | Devine l'intrus | `{ "items": ["A","B","C","D"], "intruder": 2, "hint": "fruits" }` (intruder = index) |
| `popular.json` | Question Populaire | `{ "q": "Ceci ou cela ?", "options": ["🏖️ Plage","⛰️ Montagne"] }` (2 à 4 options) |
| `anagram.json` | Anagrammes | `"motsimple"` (chaîne, sans accents idéalement) |
| `hangman.json` | Le Pendu | `"motsimple"` |
| `word-bomb.json` | Bombe à mots | `"motsimple"` (sert à générer les syllabes) |
| `guess-the-word.json` | Devine le mot | `"Un Mot"` |
| `accord.json` | Accord Parfait | `"Un thème"` |
| `bataille.json` | Bataille de Catégories | `"Catégorie"` |
| `wavelength.json` | Longueur d'onde | `["Gauche", "Droite"]` (les deux extrêmes de l'axe) |
| `undercover.json` | Undercover | `["MotCivils", "MotImposteur"]` (deux mots proches) |
| `petit-bac.json` | Petit Bac | `{ "categories": ["Prénom","Animal",…], "letters": "ABC…" }` |

## Règles à respecter
- **JSON valide** : virgules entre les entrées, pas de virgule après la dernière,
  guillemets droits `"` (pas `'`). Un validateur JSON en ligne aide en cas de doute.
- Pour les quiz, `correct` / `intruder` est l'**index** de la bonne réponse
  (0 = première option, 1 = deuxième, etc.).
- Plus il y a d'entrées, moins les parties se répètent (le moteur évite déjà de
  ressortir une question tant que le stock n'est pas épuisé, par salon).
