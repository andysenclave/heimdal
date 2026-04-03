import { useThemeStore } from '@lib/stores/theme-store';

export function useTheme() {
  const { theme, toggleTheme, setTheme } = useThemeStore();
  return { theme, toggleTheme, setTheme, isDark: theme === 'dark' };
}
