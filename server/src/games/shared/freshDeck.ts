/**
 * Per-room memory of recently used items, so successive games in the same room
 * don't draw the same questions/words. When the pool is exhausted the memory
 * resets. Keyed by an arbitrary bucket string (use `${gameId}:${roomCode}`).
 */
const memory = new Map<string, Set<string>>();

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Pick `n` items not used recently in this bucket, then mark them as used. */
export function pickFresh<T>(bucket: string, items: T[], n: number, keyOf: (t: T) => string): T[] {
  let used = memory.get(bucket);
  if (!used) {
    used = new Set();
    memory.set(bucket, used);
  }
  let available = items.filter((i) => !used!.has(keyOf(i)));
  if (available.length < n) {
    // Not enough fresh items left: reset the memory and reuse the full pool.
    used.clear();
    available = items;
  }
  const chosen = shuffle(available).slice(0, n);
  for (const c of chosen) used.add(keyOf(c));
  return chosen;
}
