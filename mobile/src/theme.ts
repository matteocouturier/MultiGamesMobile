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
  radius: { sm: 12, md: 18, lg: 26, xl: 34, pill: 999 },
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

// Web only: paint the document background to match the active palette so there
// is no colour flash before the app mounts (and overscroll matches).
try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = (globalThis as any)?.document;
  if (doc?.body) doc.body.style.backgroundColor = theme.colors.bg;
  if (doc?.documentElement) doc.documentElement.style.backgroundColor = theme.colors.bg;
} catch {
  /* native: no document */
}

export type Theme = typeof theme;

