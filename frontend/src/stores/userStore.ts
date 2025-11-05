import { create } from 'zustand';

interface UserState {
  // Add user session properties here, e.g., userId, token
  // For now, we'll keep it simple
  isLoggedIn: boolean;
  apiKey: string;
  login: () => void;
  logout: () => void;

  // Add user settings properties here
  settings: {
    theme: 'light' | 'dark';
  };
  setTheme: (theme: 'light' | 'dark') => void;
  setApiKey: (apiKey: string) => void;
}

export const useUserStore = create<UserState>((set) => ({
  isLoggedIn: false,
  apiKey: '',
  login: () => set({ isLoggedIn: true }),
  logout: () => set({ isLoggedIn: false }),

  settings: {
    theme: 'light',
  },
  setTheme: (theme) => set((state) => ({ settings: { ...state.settings, theme } })),
  setApiKey: (apiKey) => set({ apiKey }),
}));
