import { create } from 'zustand';
const storageKey = 'ui.theme.mode';
export const useThemeStore = create((set, get) => ({
    mode: localStorage.getItem(storageKey) || 'dark',
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
