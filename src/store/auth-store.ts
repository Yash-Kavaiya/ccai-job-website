import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth } from '@devvai/devv-code-backend';

interface User {
  projectId: string;
  uid: string;
  name: string;
  email: string;
  createdTime: number;
  lastLoginTime: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  sendOTP: (email: string) => Promise<void>;
  verifyOTP: (email: string, code: string) => Promise<User>;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      sendOTP: async (email: string) => {
        set({ isLoading: true });
        try {
          await auth.sendOTP(email);
        } catch (error) {
          console.error('Failed to send OTP:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      verifyOTP: async (email: string, code: string) => {
        set({ isLoading: true });
        try {
          const response = await auth.verifyOTP(email, code);
          set({ 
            user: response.user, 
            isAuthenticated: true,
            isLoading: false
          });
          return response.user;
        } catch (error) {
          set({ isLoading: false });
          console.error('OTP verification failed:', error);
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await auth.logout();
          set({ 
            user: null, 
            isAuthenticated: false,
            isLoading: false
          });
        } catch (error) {
          set({ isLoading: false });
          console.error('Logout failed:', error);
          throw error;
        }
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'aijobhub-auth',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);