export const LightColors = {
  // Brand
  primary: '#16A34A',
  primaryLight: '#22C55E',
  primarySurface: '#F0FDF4',
  primaryDark: '#15803D',

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
  // Brand — Apple green, easy on eyes in dark
  primary: '#30D158',
  primaryLight: '#4CD964',
  primarySurface: '#0A2416',
  primaryDark: '#22C55E',

  // Backgrounds — near-black with depth layers
  background: '#0F0F10',
  surface: '#1A1A1B',
  card: '#1F1F20',

  // Borders — subtle, not harsh
  border: '#2A2A2B',
  borderLight: '#242425',

  // Text — warm off-white, not stark white
  text: '#EAEAEA',
  textSecondary: '#8A8A8E',
  textMuted: '#5A5A5E',
  textInverse: '#0F0F10',

  // Semantic
  success: '#30D158',
  warning: '#FFD60A',
  error: '#FF453A',
  info: '#0A84FF',

  // Recipe tag colors (deep tones for dark)
  tagHighProtein: '#0A2416',
  tagHighProteinText: '#30D158',
  tagComfort: '#2C1800',
  tagComfortText: '#FFD60A',
  tagHealthy: '#001C3D',
  tagHealthyText: '#0A84FF',
  tagVegan: '#1A0A2E',
  tagVeganText: '#BF5AF2',
  tagQuick: '#2C1800',
  tagQuickText: '#FFD60A',

  // Quick actions
  quickScanBg: '#1A0F00',
  quickScanIcon: '#FF9F0A',
  quickRecipeBg: '#001833',
  quickRecipeIcon: '#0A84FF',
  quickPlanBg: '#120A24',
  quickPlanIcon: '#BF5AF2',

  // Category colors
  catProduce: '#30D158',
  catDairy: '#0A84FF',
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

// Backward-compat default export
export const Colors = LightColors;

export type AppColors = typeof LightColors;
