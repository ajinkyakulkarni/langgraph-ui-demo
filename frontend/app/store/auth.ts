import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mockAuth } from '@/app/lib/auth';

interface User {
  id: string;
  email: string;
  username: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async (username: string, password: string) => {
        try {
          const user = await mockAuth.login(username, password);
          set({
            user,
            isAuthenticated: true,
          });
        } catch (error) {
          throw error;
        }
      },

      register: async (email: string, username: string, password: string) => {
        try {
          const user = await mockAuth.register(email, username, password);
          // Auto-login after registration
          await mockAuth.login(username, password);
          set({
            user,
            isAuthenticated: true,
          });
        } catch (error) {
          throw error;
        }
      },

      logout: () => {
        mockAuth.logout();
        set({
          user: null,
          isAuthenticated: false,
        });
      },

      checkAuth: () => {
        const user = mockAuth.getCurrentUser();
        set({
          user,
          isAuthenticated: mockAuth.isAuthenticated(),
        });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);