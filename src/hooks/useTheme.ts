import { useUserStore } from '../store/userStore';
import { LightColors, DarkColors, AppColors } from '../constants/colors';

export function useTheme(): { colors: AppColors; isDark: boolean } {
  const isDark = useUserStore((s) => s.darkMode);
  return { colors: isDark ? DarkColors : LightColors, isDark };
}
