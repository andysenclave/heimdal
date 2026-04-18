import { create } from 'zustand';

interface ThemeState {
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
}

function getInitialTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem('heimdal-theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return 'dark';
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),
  setTheme: (theme) => {
    localStorage.setItem('heimdal-theme', theme);
    document.documentElement.classList.toggle('light', theme === 'light');
    set({ theme });
  },
  toggleTheme: () => {
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('heimdal-theme', next);
      document.documentElement.classList.toggle('light', next === 'light');
      return { theme: next };
    });
  },
}));
