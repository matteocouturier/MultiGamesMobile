/** Central design tokens — a rich, vibrant dark "glass + neon" aesthetic.
 *  All previous keys are preserved so every game keeps working. */
export const theme = {
  colors: {
    bg: '#08060F',
    // Deep violet -> indigo -> near-black ambient gradient.
    bgGradient: ['#1E1248', '#140C30', '#08060F'] as const,
    // Glassy translucent surfaces that sit over the gradient.
    surface: 'rgba(255,255,255,0.055)',
    surfaceAlt: 'rgba(255,255,255,0.10)',
    surfaceSolid: '#171231',
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
    // Ambient glow orbs behind the content.
    glow1: '#7C3AED',
    glow2: '#2563EB',
    glow3: '#DB2777',
  },
  gradients: {
    primary: ['#A78BFA', '#7C3AED'] as const,
    night: ['#1E1248', '#08060F'] as const,
    success: ['#34D399', '#0D9488'] as const,
  },
  radius: { sm: 12, md: 18, lg: 26, xl: 34, pill: 999 },
  spacing: (n: number) => n * 8,
  font: {
    h1: 36,
    h2: 25,
    h3: 19,
    body: 16,
    small: 13,
  },
  shadow: {
    card: {
      shadowColor: '#000000',
      shadowOpacity: 0.45,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 14 },
      elevation: 10,
    },
    glow: {
      shadowColor: '#8B5CF6',
      shadowOpacity: 0.55,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 8 },
      elevation: 12,
    },
  },
};

export type Theme = typeof theme;
