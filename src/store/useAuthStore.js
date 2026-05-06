import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      login: (email) => set({ user: { email } }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'docusync-auth-storage',
    }
  )
);
