/**
 * End-to-end engine test: boots the real server and drives 4 guest clients
 * through create -> join -> start -> play a turn, asserting role-based state
 * (word hidden from guesser, visible to describer/referee) and scoring.
 *
 * Run: npx tsx test/e2e.test.ts
 */
import http from 'http';
import express from 'express';
import { Server } from 'socket.io';
import { io as Client, Socket } from 'socket.io-client';
import assert from 'node:assert';
import { attachSocketServer } from '../src/socket';
import { registerGames } from '../src/games';

const PORT = 4123;

interface Tracked {
  socket: Socket;
  room?: any;
  state?: any;
  events: any[];
}

function track(): Tracked {
  const socket = Client(`http://localhost:${PORT}`, { forceNew: true });
  const t: Tracked = { socket, events: [] };
  socket.on('room:update', (r) => (t.room = r));
  socket.on('game:state', (p: any) => (t.state = p.state));
  socket.on('game:event', (e) => t.events.push(e));
  return t;
}
const connected = (s: Socket) => new Promise<void>((r) => s.on('connect', () => r()));
const ack = <T>(s: Socket, ev: string, data?: unknown) =>
  new Promise<T>((res) => s.emit(ev, data, (r: T) => res(r)));
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitFor(pred: () => boolean, label: string, ms = 5000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if (pred()) return;
    await sleep(50);
  }
  throw new Error('timeout waiting for: ' + label);
}

/** Create a room for `gameId` with the given player names and wait until full. */
async function makeRoom(gameId: string, names: string[]): Promise<Tracked[]> {
  const host = track();
  await connected(host.socket);
  const created: any = await ack(host.socket, 'lobby:create', { playerName: names[0], gameId });
  if (!created.ok) throw new Error('create failed: ' + created.error);
  const code = created.data.code;
  const rest: Tracked[] = [];
  for (const n of names.slice(1)) {
    const g = track();
    await connected(g.socket);
    await ack(g.socket, 'lobby:join', { playerName: n, code });
    rest.push(g);
  }
  const all = [host, ...rest];
  await waitFor(() => host.room?.players.length === names.length, 'room filled ' + gameId);
  return all;
}

async function main() {
  console.log('booting test server...');
  setTimeout(() => {
    console.error('HARD TIMEOUT — aborting');
    process.exit(2);
  }, 75000).unref();
  registerGames();
  const app = express();
  const server = http.createServer(app);
  const ioServer = new Server(server, { cors: { origin: '*' } });
  attachSocketServer(ioServer as any);
  await new Promise<void>((r) => server.listen(PORT, r));

  const host = track();
  await connected(host.socket);

  const created: any = await ack(host.socket, 'lobby:create', {
    playerName: 'Alice',
    gameId: 'guess-the-word',
  });
  assert.ok(created.ok, 'create ok');
  const code = created.data.code;
  assert.match(code, /^[A-Z]{6}$/, '6-letter code');
  // Regression: the host must receive the room state immediately after creating,
  // before anyone else joins (the first broadcast happens pre-join).
  await waitFor(() => host.room?.code === code && host.room.players.length === 1, 'host sees own room');
  console.log('✓ room created + host received initial room state', code);

  const guests: Tracked[] = [];
  for (const name of ['Bob', 'Chloé', 'Driss']) {
    const g = track();
    await connected(g.socket);
    const res: any = await ack(g.socket, 'lobby:join', { playerName: name, code });
    assert.ok(res.ok, `${name} joined: ${JSON.stringify(res)}`);
    guests.push(g);
  }
  const all = [host, ...guests];

  await waitFor(() => host.room?.players.length === 4, '4 players');
  assert.ok(host.room.canStart, 'canStart true with 2 balanced teams');
  console.log('✓ 4 players, balanced teams, canStart=true');

  const startRes: any = await new Promise((res) => host.socket.emit('lobby:start', res));
  assert.ok(startRes.ok, 'start ok: ' + JSON.stringify(startRes));

  await waitFor(() => all.every((t) => t.state?.phase === 'transition'), 'transition');
  const describer = all.find((t) => t.state.myRole === 'describer');
  assert.ok(describer, 'describer assigned');
  console.log('✓ game started, roles assigned in transition');

  describer!.socket.emit('game:action', { type: 'ready' });
  await waitFor(() => all.every((t) => t.state?.phase === 'turn'), 'turn');

  for (const t of all) {
    if (t.state.myRole === 'guesser') assert.strictEqual(t.state.word, null, 'guesser word hidden');
    if (t.state.myRole === 'describer') assert.ok(t.state.word, 'describer sees word');
    if (t.state.myRole === 'referee') assert.ok(t.state.word, 'referee sees word');
  }
  console.log('✓ word visibility correct (hidden from guesser only)');

  const referee = all.find((t) => t.state.myRole === 'referee')!;
  const before = referee.state.scores.reduce((a: number, x: any) => a + x.score, 0);
  referee.socket.emit('game:action', { type: 'found' });
  await waitFor(() => referee.state.foundThisTurn >= 1, 'found applied');
  const after = referee.state.scores.reduce((a: number, x: any) => a + x.score, 0);
  assert.strictEqual(after, before + 1, 'active team +1');
  assert.ok(referee.events.some((e) => e.type === 'found'), 'found event emitted');
  console.log('✓ referee "found" => +1 score and event broadcast');

  // ---- Scénario 2 : La Bombe à mots (jeu solo, 2 joueurs) -----------------
  console.log('\n--- Word Bomb ---');
  const wbHost = track();
  await connected(wbHost.socket);
  const wbCreated: any = await ack(wbHost.socket, 'lobby:create', {
    playerName: 'Zoe',
    gameId: 'word-bomb',
  });
  assert.ok(wbCreated.ok, 'wb room created');
  const wbCode = wbCreated.data.code;
  const wbGuest = track();
  await connected(wbGuest.socket);
  await ack(wbGuest.socket, 'lobby:join', { playerName: 'Yann', code: wbCode });

  await waitFor(() => wbHost.room?.players.length === 2 && !!wbHost.room?.canStart, 'wb 2 players');
  console.log('✓ Word Bomb: 2 joueurs, canStart');

  const wbStart: any = await new Promise((res) => wbHost.socket.emit('lobby:start', res));
  assert.ok(wbStart.ok, 'wb start ok');
  const wb = [wbHost, wbGuest];
  await waitFor(() => wb.every((t) => t.state?.phase === 'playing'), 'wb playing');

  const turnT = wb.find((t) => t.state.myTurn);
  assert.ok(turnT, 'a player has the turn');
  const usedBefore = turnT!.state.usedCount;
  const frag = turnT!.state.fragment as string;
  turnT!.socket.emit('game:action', { type: 'submit', payload: { word: frag.toLowerCase() + 'a' } });
  await waitFor(() => turnT!.state.usedCount > usedBefore, 'valid word accepted');
  assert.ok(turnT!.events.some((e) => e.type === 'ok'), 'ok event emitted');
  console.log('✓ Word Bomb: mot valide accepté + tour suivant');

  // ---- Scénario 3 : Quiz Culture ------------------------------------------
  console.log('\n--- Quiz ---');
  const qz = await makeRoom('quiz', ['Q1', 'Q2']);
  await new Promise((res) => qz[0].socket.emit('lobby:start', res));
  await waitFor(() => qz.every((t) => t.state?.phase === 'question'), 'quiz question');
  assert.ok(qz[0].state.question.length > 0 && qz[0].state.options.length === 4, 'question has 4 options');
  assert.strictEqual(qz[0].state.correctIndex, null, 'correct answer hidden during question');
  qz.forEach((t) => t.socket.emit('game:action', { type: 'answer', payload: { index: 0 } }));
  await waitFor(() => qz.every((t) => t.state?.phase === 'reveal'), 'quiz reveal', 4000);
  assert.notStrictEqual(qz[0].state.correctIndex, null, 'correct answer revealed');
  console.log('✓ Quiz: question -> réponses -> révélation (réponse cachée puis dévoilée)');

  // ---- Scénario 4 : Réflexe -----------------------------------------------
  console.log('\n--- Réflexe ---');
  const rx = await makeRoom('reflex', ['R1', 'R2']);
  await new Promise((res) => rx[0].socket.emit('lobby:start', res));
  await waitFor(() => rx.every((t) => t.state?.phase === 'arming'), 'reflex arming');
  rx[0].socket.emit('game:action', { type: 'tap' }); // trop tôt -> faux départ
  await waitFor(() => rx[0].state.myFalseStart === true, 'false start locked');
  assert.strictEqual(rx[1].state.myFalseStart, false, 'other player not penalised');
  console.log('✓ Réflexe: tap trop tôt = faux départ (verrouillé pour la manche)');

  // ---- Scénario 5 : Plus ou Moins -----------------------------------------
  console.log('\n--- Plus ou Moins ---');
  const hl = await makeRoom('higher-lower', ['H1', 'H2']);
  await new Promise((res) => hl[0].socket.emit('lobby:start', res));
  await waitFor(() => hl.every((t) => t.state?.phase === 'playing'), 'hl playing');
  hl[0].socket.emit('game:action', { type: 'guess', payload: { value: 50 } });
  await waitFor(() => hl[1].state.lastGuess != null, 'hl hint broadcast');
  assert.ok(['higher', 'lower'].includes(hl[1].state.lastGuess.hint), 'plus/moins hint');
  console.log('✓ Plus ou Moins: indice plus/moins diffusé');

  // ---- Scénario 6 : Petit Bac ---------------------------------------------
  console.log('\n--- Petit Bac ---');
  const pb = await makeRoom('petit-bac', ['P1', 'P2']);
  await new Promise((res) => pb[0].socket.emit('lobby:start', res));
  await waitFor(() => pb.every((t) => t.state?.phase === 'play'), 'pb play');
  const L = pb[0].state.letter.toLowerCase();
  const cats = pb[0].state.categories.length;
  pb[0].socket.emit('game:action', { type: 'submit', payload: { answers: Array(cats).fill(L + 'aa') } });
  pb[1].socket.emit('game:action', { type: 'submit', payload: { answers: Array(cats).fill(L + 'bb') } });
  await waitFor(() => pb.every((t) => t.state?.phase === 'reveal'), 'pb reveal', 4000);
  const p1res = pb[0].state.results.find((r: any) => r.name === 'P1');
  assert.strictEqual(p1res.total, cats * 2, 'réponses valides et uniques = 2 pts chacune');
  console.log('✓ Petit Bac: scoring auto (unique = 2 pts)');

  // ---- Scénario 7 : Undercover --------------------------------------------
  console.log('\n--- Undercover ---');
  const uc = await makeRoom('undercover', ['U1', 'U2', 'U3']);
  await new Promise((res) => uc[0].socket.emit('lobby:start', res));
  await waitFor(() => uc.every((t) => t.state?.phase === 'reveal'), 'uc reveal');
  const uwords = uc.map((t) => t.state.myWord);
  assert.ok(uwords.every((w) => typeof w === 'string' && w.length > 0), 'each player has a secret word');
  assert.strictEqual(new Set(uwords).size, 2, '2 mots distincts (civils + undercover)');
  const minority = uwords.find((w) => uwords.filter((x) => x === w).length === 1);
  assert.ok(minority, "l'undercover a le mot minoritaire");
  console.log('✓ Undercover: rôles assignés (1 mot minoritaire pour l’imposteur)');

  // ---- Scénario 8 : Vrai ou Faux ------------------------------------------
  console.log('\n--- Vrai ou Faux ---');
  const tf = await makeRoom('true-false', ['T1', 'T2']);
  await new Promise((res) => tf[0].socket.emit('lobby:start', res));
  await waitFor(() => tf.every((t) => t.state?.phase === 'question'), 'tf question');
  assert.strictEqual(tf[0].state.correct, null, 'answer hidden');
  tf.forEach((t) => t.socket.emit('game:action', { type: 'answer', payload: { value: true } }));
  await waitFor(() => tf.every((t) => t.state?.phase === 'reveal'), 'tf reveal', 4000);
  assert.notStrictEqual(tf[0].state.correct, null, 'answer revealed');
  console.log('✓ Vrai ou Faux: réponse cachée puis révélée');

  // ---- Scénario 9 : Anagrammes --------------------------------------------
  console.log('\n--- Anagrammes ---');
  const ag = await makeRoom('anagram', ['A1', 'A2']);
  await new Promise((res) => ag[0].socket.emit('lobby:start', res));
  await waitFor(() => ag.every((t) => t.state?.phase === 'round'), 'ag round');
  assert.ok(ag[0].state.scrambled.length >= 4, 'lettres mélangées affichées');
  console.log('✓ Anagrammes: mot mélangé distribué');

  // ---- Scénario 10 : Chifoumi ---------------------------------------------
  console.log('\n--- Chifoumi ---');
  const cf = await makeRoom('chifoumi', ['C1', 'C2']);
  await new Promise((res) => cf[0].socket.emit('lobby:start', res));
  await waitFor(() => cf.every((t) => t.state?.phase === 'pick'), 'cf pick');
  cf[0].socket.emit('game:action', { type: 'pick', payload: { choice: 'rock' } });
  cf[1].socket.emit('game:action', { type: 'pick', payload: { choice: 'scissors' } });
  await waitFor(() => cf.every((t) => t.state?.phase === 'reveal'), 'cf reveal', 4000);
  const rockEntry = cf[0].state.reveal.find((r: any) => r.choice === 'rock');
  assert.strictEqual(rockEntry.roundPts, 1, 'pierre bat ciseaux (+1)');
  console.log('✓ Chifoumi: pierre bat ciseaux');

  // ---- Scénario 11 : La Question ------------------------------------------
  console.log('\n--- La Question ---');
  const ng = await makeRoom('number-guess', ['N1', 'N2']);
  await new Promise((res) => ng[0].socket.emit('lobby:start', res));
  await waitFor(() => ng.every((t) => t.state?.phase === 'question'), 'ng question');
  ng[0].socket.emit('game:action', { type: 'guess', payload: { value: 100 } });
  ng[1].socket.emit('game:action', { type: 'guess', payload: { value: 5000 } });
  await waitFor(() => ng.every((t) => t.state?.phase === 'reveal'), 'ng reveal', 4000);
  assert.notStrictEqual(ng[0].state.answer, null, 'réponse révélée');
  assert.ok(ng[0].state.leaderboard.some((p: any) => p.score > 0), 'le plus proche a marqué');
  console.log('✓ La Question: réponse révélée, le plus proche marque');

  // ---- Scénario 12 : Calcul Mental ----------------------------------------
  console.log('\n--- Calcul Mental ---');
  const md = await makeRoom('math-duel', ['M1', 'M2']);
  await new Promise((res) => md[0].socket.emit('lobby:start', res));
  await waitFor(() => md.every((t) => t.state?.phase === 'round'), 'md round');
  assert.ok(md[0].state.problem.length > 0, 'un calcul est affiché');
  console.log('✓ Calcul Mental: problème distribué');

  // ---- Scénario 13 : Quiz Emoji -------------------------------------------
  console.log('\n--- Quiz Emoji ---');
  const eq = await makeRoom('emoji-quiz', ['E1', 'E2']);
  await new Promise((res) => eq[0].socket.emit('lobby:start', res));
  await waitFor(() => eq.every((t) => t.state?.phase === 'question'), 'eq question');
  assert.strictEqual(eq[0].state.correctIndex, null, 'réponse cachée');
  eq.forEach((t) => t.socket.emit('game:action', { type: 'answer', payload: { index: 0 } }));
  await waitFor(() => eq.every((t) => t.state?.phase === 'reveal'), 'eq reveal', 4000);
  assert.notStrictEqual(eq[0].state.correctIndex, null, 'réponse révélée');
  console.log('✓ Quiz Emoji: énigme emojis -> révélation');

  // ---- Scénario 14 : Couleur-Mot ------------------------------------------
  console.log('\n--- Couleur-Mot ---');
  const st = await makeRoom('stroop', ['S1', 'S2']);
  await new Promise((res) => st[0].socket.emit('lobby:start', res));
  await waitFor(() => st.every((t) => t.state?.phase === 'round'), 'stroop round');
  assert.strictEqual(st[0].state.options.length, 4, '4 couleurs proposées');
  assert.ok(st[0].state.inkHex.startsWith('#'), 'couleur d’encre fournie');
  console.log('✓ Couleur-Mot: mot coloré + 4 options');

  // ---- Scénario 15 : Morpion ----------------------------------------------
  console.log('\n--- Morpion ---');
  const mo = await makeRoom('morpion', ['X', 'O']);
  await new Promise((res) => mo[0].socket.emit('lobby:start', res));
  await waitFor(() => mo.every((t) => t.state?.phase === 'playing'), 'morpion playing');
  const first = mo.find((t) => t.state.myTurn)!;
  const second = mo.find((t) => !t.state.myTurn)!;
  first.socket.emit('game:action', { type: 'play', payload: { cell: 0 } });
  await waitFor(() => second.state.myTurn === true, 'turn passes after a move');
  assert.ok(second.state.board.filter((c: any) => c).length === 1, 'un symbole posé');
  console.log('✓ Morpion: coup joué, tour passé à l’adversaire');

  // ---- Scénario 16 : Simon ------------------------------------------------
  console.log('\n--- Simon ---');
  const si = await makeRoom('simon', ['I1', 'I2']);
  await new Promise((res) => si[0].socket.emit('lobby:start', res));
  await waitFor(() => si.every((t) => t.state?.phase === 'show'), 'simon show');
  assert.ok(Array.isArray(si[0].state.sequence) && si[0].state.sequence.length === 1, 'séquence de longueur 1 montrée');
  console.log('✓ Simon: séquence affichée en phase "show"');

  // ---- Scénario 17 : Le Pendu ---------------------------------------------
  console.log('\n--- Le Pendu ---');
  const hm = await makeRoom('hangman', ['G1', 'G2']);
  await new Promise((res) => hm[0].socket.emit('lobby:start', res));
  await waitFor(() => hm.every((t) => t.state?.phase === 'play'), 'hangman play');
  assert.ok(hm[0].state.masked.length >= 4, 'mot masqué affiché');
  hm[0].socket.emit('game:action', { type: 'letter', payload: { char: 'E' } });
  await waitFor(() => hm[1].state.guessed.includes('E'), 'lettre enregistrée');
  console.log('✓ Le Pendu: lettre proposée enregistrée');

  // ---- Scénario 18 : Plus Haute Carte -------------------------------------
  console.log('\n--- Plus Haute Carte ---');
  const tc = await makeRoom('top-card', ['K1', 'K2']);
  await new Promise((res) => tc[0].socket.emit('lobby:start', res));
  await waitFor(() => tc.every((t) => t.state?.phase === 'pick'), 'topcard pick');
  assert.strictEqual(tc[0].state.myHand.length, 6, 'main de 6 cartes');
  tc[0].socket.emit('game:action', { type: 'play', payload: { value: 6 } });
  tc[1].socket.emit('game:action', { type: 'play', payload: { value: 1 } });
  await waitFor(() => tc.every((t) => t.state?.phase === 'reveal'), 'topcard reveal', 4000);
  assert.ok(tc[0].state.reveal.find((r: any) => r.value === 6)?.won, 'la carte 6 gagne');
  console.log('✓ Plus Haute Carte: la plus haute carte remporte la manche');

  // ---- Scénario 19 : Question Populaire -----------------------------------
  console.log('\n--- Question Populaire ---');
  const po = await makeRoom('popular', ['V1', 'V2', 'V3']);
  await new Promise((res) => po[0].socket.emit('lobby:start', res));
  await waitFor(() => po.every((t) => t.state?.phase === 'question'), 'popular question');
  po.forEach((t) => t.socket.emit('game:action', { type: 'vote', payload: { option: 0 } }));
  await waitFor(() => po.every((t) => t.state?.phase === 'reveal'), 'popular reveal', 4000);
  assert.strictEqual(po[0].state.counts[0], 3, '3 votes sur la même option');
  assert.ok(po[0].state.leaderboard.some((p: any) => p.score === 2), 'majorité = +2 points');
  console.log('✓ Question Populaire: vote majoritaire récompensé');

  // ---- Scénario 20 : Puissance 4 ------------------------------------------
  console.log('\n--- Puissance 4 ---');
  const c4 = await makeRoom('connect4', ['R', 'J']);
  await new Promise((res) => c4[0].socket.emit('lobby:start', res));
  await waitFor(() => c4.every((t) => t.state?.phase === 'playing'), 'c4 playing');
  assert.strictEqual(c4[0].state.board.length, 42, 'plateau 7x6');
  const c4first = c4.find((t) => t.state.myTurn)!;
  const c4second = c4.find((t) => !t.state.myTurn)!;
  c4first.socket.emit('game:action', { type: 'drop', payload: { col: 0 } });
  await waitFor(() => c4second.state.myTurn === true, 'c4 turn passes');
  assert.ok(c4second.state.board.filter((d: any) => d).length === 1, 'un jeton tombé');
  console.log('✓ Puissance 4: jeton lâché, tour passé');

  // ---- Scénario 21 : Memory -----------------------------------------------
  console.log('\n--- Memory ---');
  const me = await makeRoom('memory', ['Y1', 'Y2']);
  await new Promise((res) => me[0].socket.emit('lobby:start', res));
  await waitFor(() => me.every((t) => t.state?.phase === 'playing'), 'memory playing');
  assert.strictEqual(me[0].state.cards.length, 16, '16 cartes (8 paires)');
  const meTurn = me.find((t) => t.state.myTurn)!;
  meTurn.socket.emit('game:action', { type: 'flip', payload: { index: 0 } });
  await waitFor(() => meTurn.state.cards[0].value != null, 'carte retournée');
  console.log('✓ Memory: carte retournée visible');

  // ---- Scénario 22 : Devine l'intrus --------------------------------------
  console.log('\n--- Devine l’intrus ---');
  const it = await makeRoom('intruder', ['Z1', 'Z2']);
  await new Promise((res) => it[0].socket.emit('lobby:start', res));
  await waitFor(() => it.every((t) => t.state?.phase === 'question'), 'intruder question');
  assert.strictEqual(it[0].state.items.length, 4, '4 éléments proposés');
  assert.strictEqual(it[0].state.correctIndex, null, 'intrus caché');
  it.forEach((t) => t.socket.emit('game:action', { type: 'answer', payload: { index: 0 } }));
  await waitFor(() => it.every((t) => t.state?.phase === 'reveal'), 'intruder reveal', 4000);
  assert.notStrictEqual(it[0].state.correctIndex, null, 'intrus révélé');
  console.log('✓ Devine l’intrus: 4 éléments, intrus révélé');

  // ---- Scénario 23 : Stop ou Encore ---------------------------------------
  console.log('\n--- Stop ou Encore ---');
  const pl = await makeRoom('press-luck', ['W1', 'W2']);
  await new Promise((res) => pl[0].socket.emit('lobby:start', res));
  await waitFor(() => pl.every((t) => t.state?.phase === 'play'), 'pressluck play');
  assert.strictEqual(pl[0].state.myStatus, 'active', 'départ actif');
  pl.forEach((t) => t.socket.emit('game:action', { type: 'bank' }));
  await waitFor(() => pl.every((t) => t.state?.phase === 'result'), 'pressluck resolved', 4000);
  console.log('✓ Stop ou Encore: tous "Stop" -> manche résolue');

  // ---- Scénario 24 : Accord Parfait (2v2) ---------------------------------
  console.log('\n--- Accord Parfait ---');
  const ac = await makeRoom('accord', ['A1', 'A2', 'A3', 'A4']);
  await new Promise((res) => ac[0].socket.emit('lobby:start', res));
  await waitFor(() => ac.every((t) => t.state?.phase === 'play'), 'accord play');
  ac.forEach((t) => t.socket.emit('game:action', { type: 'submit', payload: { word: 'test' } }));
  await waitFor(() => ac.every((t) => t.state?.phase === 'reveal'), 'accord reveal', 4000);
  assert.ok(ac[0].state.reveal.some((t: any) => t.matched), 'au moins une équipe a matché');
  console.log('✓ Accord Parfait: mots identiques = équipe qui marque');

  // ---- Scénario 25 : Duo Quiz (2v2) ---------------------------------------
  console.log('\n--- Duo Quiz ---');
  const dq = await makeRoom('duo-quiz', ['D1', 'D2', 'D3', 'D4']);
  await new Promise((res) => dq[0].socket.emit('lobby:start', res));
  await waitFor(() => dq.every((t) => t.state?.phase === 'question'), 'duoquiz question');
  const actives = dq.filter((t) => t.state.amIActive);
  assert.strictEqual(actives.length, 2, 'un répondant actif par équipe');
  actives.forEach((t) => t.socket.emit('game:action', { type: 'answer', payload: { index: 0 } }));
  await waitFor(() => dq.every((t) => t.state?.phase === 'reveal'), 'duoquiz reveal', 4000);
  console.log('✓ Duo Quiz: relais (1 répondant actif par équipe) -> révélation');

  // ---- Scénario 26 : Bataille de Catégories (2v2) -------------------------
  console.log('\n--- Bataille de Catégories ---');
  const bt = await makeRoom('bataille', ['B1', 'B2', 'B3', 'B4']);
  await new Promise((res) => bt[0].socket.emit('lobby:start', res));
  await waitFor(() => bt.every((t) => t.state?.phase === 'play'), 'bataille play');
  assert.ok(bt[0].state.category.length > 0, 'une catégorie est tirée');
  const btTurn = bt.find((t) => t.state.isMyTurn)!;
  btTurn.socket.emit('game:action', { type: 'submit', payload: { word: 'lion' } });
  await waitFor(() => bt.some((t) => t.state.usedCount === 1), 'mot accepté');
  console.log('✓ Bataille: mot cité accepté, tour passé');

  // ---- Scénario 27 : Relais Calcul (2v2) ----------------------------------
  console.log('\n--- Relais Calcul ---');
  const rc = await makeRoom('relais-calcul', ['C1', 'C2', 'C3', 'C4']);
  await new Promise((res) => rc[0].socket.emit('lobby:start', res));
  await waitFor(() => rc.every((t) => t.state?.phase === 'play'), 'relais play');
  assert.ok(rc[0].state.problem.length > 0 && rc[0].state.target === 12, 'problème + objectif 12');
  assert.strictEqual(rc.filter((t) => t.state.amIActive).length, 2, 'un calculateur actif par équipe');
  console.log('✓ Relais Calcul: problème distribué, relais en place');

  // ---- Scénario 28 : Longueur d'onde (2v2) --------------------------------
  console.log('\n--- Longueur d’onde ---');
  const wv = await makeRoom('wavelength', ['W1', 'W2', 'W3', 'W4']);
  await new Promise((res) => wv[0].socket.emit('lobby:start', res));
  await waitFor(() => wv.every((t) => t.state?.phase === 'clue'), 'wavelength clue');
  const psychic = wv.find((t) => t.state.myRole === 'psychic')!;
  assert.ok(psychic.state.target != null, 'le médium voit la cible');
  assert.strictEqual(wv.filter((t) => t.state.myRole === 'guesser').length, 1, 'un seul devineur actif');
  psychic.socket.emit('game:action', { type: 'clue', payload: { word: 'tiede' } });
  await waitFor(() => wv.every((t) => t.state?.phase === 'guess'), 'wavelength guess', 4000);
  const guesser = wv.find((t) => t.state.myRole === 'guesser')!;
  guesser.socket.emit('game:action', { type: 'guess', payload: { value: 50 } });
  await waitFor(() => wv.every((t) => t.state?.phase === 'reveal'), 'wavelength reveal', 4000);
  assert.ok(wv[0].state.points != null, 'points attribués selon la proximité');
  console.log('✓ Longueur d’onde: indice -> curseur -> points');

  console.log('\nALL ENGINE TESTS PASSED ✅');
  [...all, wbHost, wbGuest, ...qz, ...rx, ...hl, ...pb, ...uc, ...tf, ...ag, ...cf, ...ng, ...md, ...eq, ...st, ...mo, ...si, ...hm, ...tc, ...po, ...c4, ...me, ...it, ...pl, ...ac, ...dq, ...bt, ...rc, ...wv].forEach((t) => t.socket.close());
  ioServer.close();
  server.close();
  await sleep(150);
  process.exit(0);
}

main().catch((e) => {
  console.error('TEST FAILED ❌', e);
  process.exit(1);
});
