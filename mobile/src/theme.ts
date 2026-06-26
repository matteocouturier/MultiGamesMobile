/** Central design tokens. Keep the look consistent and pro across screens. */
export const theme = {
  colors: {
    bg: '#0E0B1E',
    bgGradient: ['#171231', '#0E0B1E'] as const,
    surface: '#1C1736',
    surfaceAlt: '#241D45',
    border: '#2E2858',
    primary: '#7C5CFF',
    primaryDark: '#5B3FE0',
    text: '#F4F2FF',
    textMuted: '#A39FC4',
    danger: '#FF5A5F',
    success: '#34C759',
    warning: '#FFC53D',
    white: '#FFFFFF',
  },
  radius: { sm: 10, md: 16, lg: 24, pill: 999 },
  spacing: (n: number) => n * 8,
  font: {
    h1: 32,
    h2: 24,
    h3: 19,
    body: 16,
    small: 13,
  },
  shadow: {
    card: {
      shadowColor: '#000',
      shadowOpacity: 0.35,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
  },
};

export type Theme = typeof theme;
