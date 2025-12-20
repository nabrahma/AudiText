export const PALETTES = {
  ember: {
    colors: ['#FF6B35', '#FF8C42', '#FFD166', '#000000'],
    primary: '#FF6B35',
    secondary: '#FF8C42',
    tertiary: '#FFD166',
    glow: 'rgba(255, 107, 53, 0.6)',
  },
  sunset: {
    colors: ['#E63946', '#FF6B6B', '#FFA07A', '#000000'],
    primary: '#E63946',
    secondary: '#FF6B6B',
    tertiary: '#FFA07A',
    glow: 'rgba(230, 57, 70, 0.6)',
  },
  aurora: {
    colors: ['#00E5A0', '#00C9A7', '#4DFFD2', '#000000'],
    primary: '#00E5A0',
    secondary: '#00C9A7',
    tertiary: '#4DFFD2',
    glow: 'rgba(0, 229, 160, 0.6)',
  },
  violet: {
    colors: ['#A855F7', '#C084FC', '#E9D5FF', '#000000'],
    primary: '#A855F7',
    secondary: '#C084FC',
    tertiary: '#E9D5FF',
    glow: 'rgba(168, 85, 247, 0.6)',
  },
  gold: {
    colors: ['#F59E0B', '#FBBF24', '#FDE68A', '#000000'],
    primary: '#F59E0B',
    secondary: '#FBBF24',
    tertiary: '#FDE68A',
    glow: 'rgba(245, 158, 11, 0.6)',
  },
} as const;

export type PaletteKey = keyof typeof PALETTES;
export const PALETTE_KEYS: PaletteKey[] = ['ember', 'sunset', 'aurora', 'violet', 'gold'];

// Hue shift values for DarkVeil background per palette
export const PALETTE_HUE_SHIFTS: Record<PaletteKey, number> = {
  ember: 0,      // Orange/red - base color
  sunset: 30,    // Red/pink shift
  aurora: 120,   // Green shift
  violet: 270,   // Purple shift
  gold: 45,      // Yellow/gold shift
};
