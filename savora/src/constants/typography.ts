import { Platform } from 'react-native';

export const FontFamily = {
  regular: Platform.OS === 'ios' ? undefined : 'Roboto',
  medium: Platform.OS === 'ios' ? undefined : 'Roboto',
  semibold: Platform.OS === 'ios' ? undefined : 'Roboto',
  bold: Platform.OS === 'ios' ? undefined : 'Roboto',
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 22,
  xxxl: 26,
  display: 30,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};
