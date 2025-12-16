import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { socket } from '@/lib/socket';

interface Admin {
  id: string;
  email: string;
}

interface AuthStore {
  token: string | null;
  admin: Admin | null;
  isLoading: boolean;
  error: string | null;
  
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      admin: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        return new Promise((resolve) => {
          socket.emit('adminLogin', { email, password }, (response: any) => {
            if (response.success) {
              set({ token: response.token, admin: response.admin, isLoading: false });
              resolve(true);
            } else {
              set({ error: response.error, isLoading: false });
              resolve(false);
            }
          });
        });
      },

      register: async (email, password) => {
        set({ isLoading: true, error: null });
        return new Promise((resolve) => {
          socket.emit('adminRegister', { email, password }, (response: any) => {
            if (response.success) {
              set({ token: response.token, admin: response.admin, isLoading: false });
              resolve(true);
            } else {
              set({ error: response.error, isLoading: false });
              resolve(false);
            }
          });
        });
      },

      logout: () => set({ token: null, admin: null }),
      clearError: () => set({ error: null })
    }),
    {
      name: 'party-joy-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token, admin: state.admin }),
    }
  )
);