/** Build & share an invite link that auto-fills the room code on open. */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g: any = globalThis;

/** Read a `?join=CODE` parameter from the URL (web), normalized to 6 letters. */
export function readJoinCode(): string | null {
  try {
    const search: string | undefined = g.location?.search;
    if (!search) return null;
    const code = new URLSearchParams(search).get('join');
    if (!code) return null;
    const clean = code.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6);
    return clean.length === 6 ? clean : null;
  } catch {
    return null;
  }
}

/** Remove the `?join=` parameter from the address bar (after we've used it). */
export function clearJoinParam(): void {
  try {
    if (g.history?.replaceState && g.location) g.history.replaceState(null, '', g.location.pathname);
  } catch {
    /* ignore */
  }
}

export function inviteLink(code: string): string {
  try {
    if (g.location?.origin) return `${g.location.origin}/?join=${code}`;
  } catch {
    /* native */
  }
  return `https://minigames.644.fr/?join=${code}`;
}

/** Share via the native share sheet, or fall back to copying the link. */
export async function shareInvite(code: string): Promise<'shared' | 'copied' | 'none'> {
  const url = inviteLink(code);
  const text = `Rejoins ma partie sur MultiGames 🎮 — code ${code}`;
  try {
    if (g.navigator?.share) {
      await g.navigator.share({ title: 'MultiGames', text, url });
      return 'shared';
    }
    if (g.navigator?.clipboard?.writeText) {
      await g.navigator.clipboard.writeText(url);
      return 'copied';
    }
  } catch {
    // user cancelled the share sheet, or clipboard denied
    return 'none';
  }
  return 'none';
}
