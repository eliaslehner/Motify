// themes.ts - Modular theme configuration
// You can easily swap colors or add new themes here

export interface ThemeColors {
  // Base colors
  background: string;
  foreground: string;
  
  // Card colors
  card: string;
  cardForeground: string;
  
  // Popover colors
  popover: string;
  popoverForeground: string;
  
  // Primary colors
  primary: string;
  primaryForeground: string;
  primaryGlow: string;
  
  // Secondary colors
  secondary: string;
  secondaryForeground: string;
  
  // Muted colors
  muted: string;
  mutedForeground: string;
  
  // Accent colors
  accent: string;
  accentForeground: string;
  
  // Success colors
  success: string;
  successForeground: string;
  successLight: string;
  
  // Warning colors
  warning: string;
  warningForeground: string;
  warningLight: string;
  
  // Destructive colors
  destructive: string;
  destructiveForeground: string;
  destructiveLight: string;
  
  // Border and input
  border: string;
  input: string;
  ring: string;
  
  // Gradients
  gradientPrimary: string;
  gradientSuccess: string;
  gradientCard: string;
  
  // Shadow
  shadowGlow: string;
  
  // GitHub colors
  github: string;
  githubForeground: string;
  githubHover: string;
}

export const lightTheme: ThemeColors = {
  background: '220 25% 98%',
  foreground: '220 15% 12%',
  
  card: '0 0% 100%',
  cardForeground: '220 15% 12%',
  
  popover: '0 0% 100%',
  popoverForeground: '220 15% 12%',
  
  primary: '221 83% 53%',
  primaryForeground: '0 0% 100%',
  primaryGlow: '221 83% 65%',
  
  secondary: '220 20% 95%',
  secondaryForeground: '220 15% 12%',
  
  muted: '220 20% 95%',
  mutedForeground: '220 10% 45%',
  
  accent: '267 84% 61%',
  accentForeground: '0 0% 100%',
  
  success: '142 76% 45%',
  successForeground: '0 0% 100%',
  successLight: '142 76% 95%',
  
  warning: '38 92% 50%',
  warningForeground: '0 0% 100%',
  warningLight: '38 92% 95%',
  
  destructive: '0 84% 60%',
  destructiveForeground: '0 0% 100%',
  destructiveLight: '0 84% 97%',
  
  border: '220 20% 90%',
  input: '220 20% 90%',
  ring: '221 83% 53%',
  
  gradientPrimary: 'linear-gradient(135deg, hsl(221 83% 53%), hsl(267 84% 61%))',
  gradientSuccess: 'linear-gradient(135deg, hsl(142 76% 45%), hsl(142 76% 55%))',
  gradientCard: 'linear-gradient(180deg, hsl(0 0% 100%), hsl(220 25% 99%))',
  
  shadowGlow: '0 0 30px hsl(221 83% 53% / 0.3)',
  
  github: '210 12% 90%',
  githubForeground: '210 12% 16%',
  githubHover: '210 12% 95%',
};

export const darkTheme: ThemeColors = {
  background: '220 25% 8%',
  foreground: '220 15% 95%',
  
  card: '220 20% 12%',
  cardForeground: '220 15% 95%',
  
  popover: '220 20% 12%',
  popoverForeground: '220 15% 95%',
  
  primary: '221 83% 53%',
  primaryForeground: '0 0% 100%',
  primaryGlow: '221 83% 65%',
  
  secondary: '220 20% 18%',
  secondaryForeground: '220 15% 95%',
  
  muted: '220 20% 18%',
  mutedForeground: '220 10% 65%',
  
  accent: '267 84% 61%',
  accentForeground: '0 0% 100%',
  
  success: '142 76% 45%',
  successForeground: '0 0% 100%',
  successLight: '142 76% 15%',
  
  warning: '38 92% 50%',
  warningForeground: '0 0% 100%',
  warningLight: '38 92% 15%',
  
  destructive: '0 84% 60%',
  destructiveForeground: '0 0% 100%',
  destructiveLight: '0 84% 15%',
  
  border: '220 20% 20%',
  input: '220 20% 20%',
  ring: '221 83% 53%',
  
  gradientPrimary: 'linear-gradient(135deg, hsl(221 83% 53%), hsl(267 84% 61%))',
  gradientSuccess: 'linear-gradient(135deg, hsl(142 76% 45%), hsl(142 76% 55%))',
  gradientCard: 'linear-gradient(180deg, hsl(220 20% 12%), hsl(220 20% 14%))',
  
  shadowGlow: '0 0 30px hsl(221 83% 53% / 0.4)',
  
  github: '220 20% 18%',
  githubForeground: '220 15% 95%',
  githubHover: '220 20% 22%',
};

// You can easily add more themes here
// Example: Blue theme, Purple theme, etc.
export const themes = {
  light: lightTheme,
  dark: darkTheme,
  // Add custom themes here:
  // ocean: oceanTheme,
  // sunset: sunsetTheme,
} as const;

export type ThemeName = keyof typeof themes;
