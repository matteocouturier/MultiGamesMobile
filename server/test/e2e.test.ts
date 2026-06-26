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

async function main() {
  console.log('booting test server...');
  setTimeout(() => {
    console.error('HARD TIMEOUT — aborting');
    process.exit(2);
  }, 18000).unref();
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
  console.log('✓ room created', code);

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

  console.log('\nALL ENGINE TESTS PASSED ✅');
  all.forEach((t) => t.socket.close());
  ioServer.close();
  server.close();
  await sleep(150);
  process.exit(0);
}

main().catch((e) => {
  console.error('TEST FAILED ❌', e);
  process.exit(1);
});
