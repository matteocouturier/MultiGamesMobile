/** Design tokens with light & dark palettes.
 *  The active palette is resolved synchronously at module load (instant on web
 *  via localStorage), so every StyleSheet.create across the app — including all
 *  games — picks up the right colors with no per-component changes. Toggling
 *  persists the choice and reloads. */

type Grad = readonly [string, string, ...string[]];

export type ThemeMode = 'light' | 'dark';

function readMode(): ThemeMode {
  try {
    // Web: localStorage is synchronous and available at module init.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ls = (globalThis as any)?.localStorage;
    if (ls && ls.getItem('mg-theme') === 'light') return 'light';
  } catch {
    /* native or unavailable -> default dark */
  }
  return 'dark';
}

export const themeMode: ThemeMode = readMode();
const light = themeMode === 'light';

const darkColors = {
  bg: '#08060F',
  bgGradient: ['#1E1248', '#140C30', '#08060F'] as Grad,
  surface: 'rgba(255,255,255,0.055)',
  surfaceAlt: 'rgba(255,255,255,0.10)',
  surfaceSolid: '#171231',
  sheet: '#1A1338',
  border: 'rgba(255,255,255,0.13)',
  borderStrong: 'rgba(255,255,255,0.22)',
  primary: '#8B5CF6',
  primaryDark: '#6D28D9',
  text: '#F6F3FF',
  textMuted: '#ABA1D8',
  danger: '#FF4D6D',
  success: '#2DD4BF',
  warning: '#FBBF24',
  white: '#FFFFFF',
  glow1: '#7C3AED',
  glow2: '#2563EB',
  glow3: '#DB2777',
};

const lightColors: typeof darkColors = {
  bg: '#F1EEFB',
  bgGradient: ['#FCFBFF', '#F1ECFB', '#E6DEF7'] as Grad,
  surface: 'rgba(255,255,255,0.72)',
  surfaceAlt: 'rgba(255,255,255,0.95)',
  surfaceSolid: '#FFFFFF',
  sheet: '#FFFFFF',
  border: 'rgba(30,18,72,0.12)',
  borderStrong: 'rgba(30,18,72,0.24)',
  primary: '#7C3AED',
  primaryDark: '#6D28D9',
  text: '#1C1340',
  textMuted: '#6F6699',
  danger: '#E11D48',
  success: '#0D9488',
  warning: '#D97706',
  white: '#FFFFFF',
  glow1: '#C4B5FD',
  glow2: '#A5B4FC',
  glow3: '#F9A8D4',
};

export const theme = {
  mode: themeMode,
  colors: light ? lightColors : darkColors,
  gradients: {
    primary: ['#A78BFA', '#7C3AED'] as Grad,
    night: ['#1E1248', '#08060F'] as Grad,
    success: ['#34D399', '#0D9488'] as Grad,
  },
  // Premium type: "Sora" for display/headings, "Inter" for body (loaded on web).
  fonts: {
    display: 'Sora, system-ui, -apple-system, sans-serif',
    body: 'Inter, system-ui, -apple-system, sans-serif',
  },
  radius: { sm: 14, md: 20, lg: 28, xl: 38, pill: 999 },
  spacing: (n: number) => n * 8,
  font: { h1: 36, h2: 25, h3: 19, body: 16, small: 13 },
  shadow: {
    card: light
      ? { shadowColor: '#6D28D9', shadowOpacity: 0.14, shadowRadius: 20, shadowOffset: { width: 0, height: 12 }, elevation: 6 }
      : { shadowColor: '#000000', shadowOpacity: 0.45, shadowRadius: 24, shadowOffset: { width: 0, height: 14 }, elevation: 10 },
    glow: { shadowColor: '#8B5CF6', shadowOpacity: light ? 0.4 : 0.55, shadowRadius: 22, shadowOffset: { width: 0, height: 8 }, elevation: 12 },
  },
};

/** Persist the chosen mode and reload so the new palette applies everywhere. */
export function setThemeMode(mode: ThemeMode): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ls = (globalThis as any)?.localStorage;
    if (ls) ls.setItem('mg-theme', mode);
  } catch {
    /* ignore */
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const loc = (globalThis as any)?.location;
    if (loc?.reload) loc.reload();
  } catch {
    /* native: no-op */
  }
}

export function toggleTheme(): void {
  setThemeMode(themeMode === 'light' ? 'dark' : 'light');
}

// Web only: make it behave like a native app — lock the viewport (no pinch /
// double-tap zoom), fill the screen, no rubber-band scroll, and paint the
// document background to match the active palette (no colour flash).
try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = (globalThis as any)?.document;
  if (doc) {
    let vp = doc.querySelector('meta[name="viewport"]');
    if (!vp) {
      vp = doc.createElement('meta');
      vp.setAttribute('name', 'viewport');
      doc.head.appendChild(vp);
    }
    vp.setAttribute(
      'content',
      'width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover'
    );

    // PWA / "add to home screen" -> full-screen standalone app, no browser chrome.
    const metas: [string, string, boolean][] = [
      ['apple-mobile-web-app-capable', 'yes', false],
      ['mobile-web-app-capable', 'yes', false],
      ['apple-mobile-web-app-status-bar-style', 'black-translucent', false],
      ['apple-mobile-web-app-title', 'MultiGames', false],
      ['theme-color', theme.colors.bg, false],
    ];
    for (const [name, content] of metas) {
      let m = doc.querySelector(`meta[name="${name}"]`);
      if (!m) {
        m = doc.createElement('meta');
        m.setAttribute('name', name);
        doc.head.appendChild(m);
      }
      m.setAttribute('content', content);
    }

    // Premium web fonts (Sora + Inter).
    const preconnect = doc.createElement('link');
    preconnect.setAttribute('rel', 'preconnect');
    preconnect.setAttribute('href', 'https://fonts.gstatic.com');
    preconnect.setAttribute('crossorigin', '');
    doc.head.appendChild(preconnect);
    const fontsLink = doc.createElement('link');
    fontsLink.setAttribute('rel', 'stylesheet');
    fontsLink.setAttribute(
      'href',
      'https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap'
    );
    doc.head.appendChild(fontsLink);

    const style = doc.createElement('style');
    style.innerHTML = `
      html, body, #root {
        font-family: Inter, system-ui, -apple-system, sans-serif;
      }
      html, body, #root {
        height: 100%;
        margin: 0;
        padding: 0;
        overflow: hidden;
        background-color: ${theme.colors.bg};
        overscroll-behavior: none;
      }
      body {
        position: fixed;
        width: 100%;
        -webkit-text-size-adjust: 100%;
        text-size-adjust: 100%;
        touch-action: manipulation;
      }
      * { -webkit-tap-highlight-color: transparent; }
    `;
    doc.head.appendChild(style);

    // Link the PWA manifest + touch icon (installable app).
    const addLink = (rel: string, href: string) => {
      let l = doc.querySelector(`link[rel="${rel}"]`);
      if (!l) {
        l = doc.createElement('link');
        l.setAttribute('rel', rel);
        doc.head.appendChild(l);
      }
      l.setAttribute('href', href);
    };
    addLink('manifest', '/manifest.webmanifest');
    addLink('apple-touch-icon', '/apple-touch-icon.png');

    // Register the service worker where allowed (https or localhost) — required
    // for Android's "Install app". Harmless/no-op over plain http.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = globalThis as any;
    const sw = g.navigator?.serviceWorker;
    const loc = g.location;
    if (sw && (loc?.protocol === 'https:' || loc?.hostname === 'localhost')) {
      sw.register('/sw.js').catch(() => {});
    }

    // Block zoom for an app-like feel. `touch-action: manipulation` (above)
    // already kills double-tap zoom WITHOUT slowing rapid game taps. Here we
    // also block iOS pinch (gesture* events) and desktop ctrl+wheel/keys.
    doc.addEventListener('gesturestart', (e: Event) => e.preventDefault());
    doc.addEventListener('gesturechange', (e: Event) => e.preventDefault());
    doc.addEventListener('gestureend', (e: Event) => e.preventDefault());
    g.addEventListener?.('wheel', (e: any) => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
    g.addEventListener?.('keydown', (e: any) => {
      if ((e.ctrlKey || e.metaKey) && ['+', '-', '=', '0'].includes(e.key)) e.preventDefault();
    });
  }
} catch {
  /* native: no document */
}

export type Theme = typeof theme;

