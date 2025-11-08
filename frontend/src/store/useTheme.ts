import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark';

type ThemeState = {
  mode: ThemeMode;
  toggle: () => void;
  set: (mode: ThemeMode) => void;
};

const storageKey = 'ui.theme.mode';

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: (localStorage.getItem(storageKey) as ThemeMode) || 'dark',
  toggle: () => {
    const next = get().mode === 'dark' ? 'light' : 'dark';
    localStorage.setItem(storageKey, next);
    set({ mode: next });
  },
  set: (mode) => {
    localStorage.setItem(storageKey, mode);
    set({ mode });
  },
}));
