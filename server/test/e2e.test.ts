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
  }, 30000).unref();
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

  console.log('\nALL ENGINE TESTS PASSED ✅');
  [...all, wbHost, wbGuest, ...qz, ...rx, ...hl, ...pb, ...uc, ...tf, ...ag, ...cf, ...ng].forEach((t) => t.socket.close());
  ioServer.close();
  server.close();
  await sleep(150);
  process.exit(0);
}

main().catch((e) => {
  console.error('TEST FAILED ❌', e);
  process.exit(1);
});
