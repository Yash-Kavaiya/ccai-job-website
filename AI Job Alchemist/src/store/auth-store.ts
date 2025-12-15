import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
  GithubAuthProvider
} from 'firebase/auth';
import { auth, githubProvider } from '@/lib/firebase';

interface User {
  uid: string;
  name: string | null;
  email: string | null;
  photoURL: string | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  loginWithGithub: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
}

const mapFirebaseUser = (user: FirebaseUser): User => ({
  uid: user.uid,
  name: user.displayName,
  email: user.email,
  photoURL: user.photoURL,
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      loginWithGithub: async () => {
        set({ isLoading: true, error: null });
        try {
          const result = await signInWithPopup(auth, githubProvider);
          // This gives you a GitHub Access Token. You can use it to access the GitHub API.
          const credential = GithubAuthProvider.credentialFromResult(result);
          const token = credential?.accessToken;

          const user = result.user;
          set({
            user: mapFirebaseUser(user),
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error: any) {
          console.error('GitHub login failed:', error);
          set({
            isLoading: false,
            error: error.message || 'Failed to login with GitHub'
          });
          throw error;
        }
      },

      loginWithEmail: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const result = await signInWithEmailAndPassword(auth, email, password);
          set({
            user: mapFirebaseUser(result.user),
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error: any) {
          console.error('Login failed:', error);
          set({
            isLoading: false,
            error: error.message || 'Failed to login'
          });
          throw error;
        }
      },

      signupWithEmail: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const result = await createUserWithEmailAndPassword(auth, email, password);
          set({
            user: mapFirebaseUser(result.user),
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error: any) {
          console.error('Signup failed:', error);
          set({
            isLoading: false,
            error: error.message || 'Failed to sign up'
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await signOut(auth);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
        } catch (error: any) {
          set({ isLoading: false });
          console.error('Logout failed:', error);
          throw error;
        }
      },

      clearError: () => set({ error: null }),

      setUser: (user) => set({
        user,
        isAuthenticated: !!user,
        isLoading: false
      }),
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

// Subscribe to auth state changes to keep store in sync
import { onAuthStateChanged } from 'firebase/auth';
onAuthStateChanged(auth, (user) => {
  const store = useAuthStore.getState();
  if (user) {
    store.setUser(mapFirebaseUser(user));
  } else {
    // Only clear if we were previously authenticated to avoid loops or unnecessary updates
    if (store.isAuthenticated) {
      store.setUser(null);
    }
  }
});