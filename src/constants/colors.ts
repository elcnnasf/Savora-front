export const LightColors = {
  // Brand
  primary: '#F97316',
  primaryLight: '#FB923C',
  primarySurface: '#FFF7ED',
  primaryDark: '#EA580C',

  // Backgrounds
  background: '#FFFFFF',
  surface: '#F8FAF8',
  card: '#FFFFFF',

  // Borders
  border: '#E5E7EB',
  borderLight: '#F3F4F6',

  // Text
  text: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Semantic
  success: '#16A34A',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Recipe tag colors
  tagHighProtein: '#DCFCE7',
  tagHighProteinText: '#15803D',
  tagComfort: '#FEF3C7',
  tagComfortText: '#B45309',
  tagHealthy: '#DBEAFE',
  tagHealthyText: '#1D4ED8',
  tagVegan: '#F3E8FF',
  tagVeganText: '#7C3AED',
  tagQuick: '#FEF9C3',
  tagQuickText: '#A16207',

  // Quick action pill backgrounds
  quickScanBg: '#FFF7ED',
  quickScanIcon: '#EA580C',
  quickRecipeBg: '#EFF6FF',
  quickRecipeIcon: '#2563EB',
  quickPlanBg: '#F5F3FF',
  quickPlanIcon: '#7C3AED',

  // Shopping list category colors
  catProduce: '#16A34A',
  catDairy: '#2563EB',
  catMeat: '#DC2626',
  catPantry: '#7C3AED',

  // Misc
  shadow: 'rgba(0,0,0,0.08)',
  shadowMd: 'rgba(0,0,0,0.12)',
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.3)',
  scrim: 'rgba(0,0,0,0.6)',

  // Premium
  premiumGold: '#F59E0B',
  premiumBg: '#064E3B',
  premiumBgLight: '#065F46',
} as const;

export const DarkColors = {
  // Brand
  primary: '#F97316',
  primaryLight: '#FB923C',
  primarySurface: '#2C1200',
  primaryDark: '#EA580C',

  // Backgrounds
  background: '#111111',
  surface: '#1C1C1E',
  card: '#1C1C1E',

  // Borders
  border: '#2C2C2E',
  borderLight: '#242424',

  // Text
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  textMuted: '#636366',
  textInverse: '#FFFFFF',

  // Semantic
  success: '#30D158',
  warning: '#D97706',
  error: '#FF453A',
  info: '#2563EB',

  // Recipe tag colors
  tagHighProtein: '#052E16',
  tagHighProteinText: '#30D158',
  tagComfort: '#2C1800',
  tagComfortText: '#FBBF24',
  tagHealthy: '#001C3D',
  tagHealthyText: '#60A5FA',
  tagVegan: '#1A0A2E',
  tagVeganText: '#BF5AF2',
  tagQuick: '#2C1800',
  tagQuickText: '#FBBF24',

  // Quick action pill backgrounds
  quickScanBg: '#FFF7ED',
  quickScanIcon: '#EA580C',
  quickRecipeBg: '#EFF6FF',
  quickRecipeIcon: '#2563EB',
  quickPlanBg: '#F5F3FF',
  quickPlanIcon: '#7C3AED',

  // Shopping list category colors
  catProduce: '#30D158',
  catDairy: '#60A5FA',
  catMeat: '#FF453A',
  catPantry: '#BF5AF2',

  // Misc
  shadow: 'rgba(0,0,0,0.6)',
  shadowMd: 'rgba(0,0,0,0.7)',
  overlay: 'rgba(0,0,0,0.75)',
  overlayLight: 'rgba(0,0,0,0.55)',
  scrim: 'rgba(0,0,0,0.9)',

  // Premium
  premiumGold: '#FFD60A',
  premiumBg: '#0A2416',
  premiumBgLight: '#0F3620',
} as const;

export const Colors = LightColors;

// Widen literal color values to string so light/dark palettes are interchangeable
export type AppColors = { [K in keyof typeof LightColors]: string };
