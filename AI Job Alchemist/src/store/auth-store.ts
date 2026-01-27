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
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, githubProvider, db } from '@/lib/firebase';

interface User {
  uid: string;
  name: string | null;
  email: string | null;
  photoURL: string | null;
  role?: 'candidate' | 'recruiter';
  onboardingComplete?: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  loginWithGoogle: (role?: 'candidate' | 'recruiter') => Promise<void>;
  loginWithGithub: (role?: 'candidate' | 'recruiter') => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string, role?: 'candidate' | 'recruiter') => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
  setOnboardingComplete: () => void;
}

const mapFirebaseUser = (
  user: FirebaseUser,
  role?: 'candidate' | 'recruiter',
  onboardingComplete?: boolean
): User => ({
  uid: user.uid,
  name: user.displayName,
  email: user.email,
  photoURL: user.photoURL,
  role: role,
  onboardingComplete: role === 'candidate' ? true : onboardingComplete ?? false
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      loginWithGoogle: async (role) => {
        set({ isLoading: true, error: null });
        try {
          const result = await signInWithPopup(auth, googleProvider);
          const user = result.user;

          // Check/Create user in Firestore
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);

          let userRole = role;
          let onboardingComplete = true; // Default for candidates

          if (userDoc.exists()) {
            const userData = userDoc.data();
            userRole = userData.role as 'candidate' | 'recruiter';
            onboardingComplete = userData.onboardingComplete ?? (userRole === 'candidate');
          } else {
            // If no role provided for new user, default to candidate
            userRole = role || 'candidate';
            onboardingComplete = userRole === 'candidate'; // Candidates don't need onboarding
            await setDoc(userDocRef, {
              uid: user.uid,
              email: user.email,
              name: user.displayName,
              photoURL: user.photoURL,
              role: userRole,
              onboardingComplete: onboardingComplete,
              createdAt: new Date().toISOString()
            });
          }

          set({
            user: mapFirebaseUser(user, userRole, onboardingComplete),
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error: any) {
          console.error('Google login failed:', error);
          set({
            isLoading: false,
            error: error.message || 'Failed to login with Google'
          });
          throw error;
        }
      },

      loginWithGithub: async (role) => {
        set({ isLoading: true, error: null });
        try {
          const result = await signInWithPopup(auth, githubProvider);
          const user = result.user;

          // Check/Create user in Firestore
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);

          let userRole = role;
          let onboardingComplete = true;

          if (userDoc.exists()) {
            const userData = userDoc.data();
            userRole = userData.role as 'candidate' | 'recruiter';
            onboardingComplete = userData.onboardingComplete ?? (userRole === 'candidate');
          } else {
            userRole = role || 'candidate';
            onboardingComplete = userRole === 'candidate';
            await setDoc(userDocRef, {
              uid: user.uid,
              email: user.email,
              name: user.displayName,
              photoURL: user.photoURL,
              role: userRole,
              onboardingComplete: onboardingComplete,
              createdAt: new Date().toISOString()
            });
          }

          set({
            user: mapFirebaseUser(user, userRole, onboardingComplete),
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

          // Fetch role and onboarding status from Firestore
          const userDocRef = doc(db, 'users', result.user.uid);
          const userDoc = await getDoc(userDocRef);
          let role: 'candidate' | 'recruiter' | undefined;
          let onboardingComplete = true;

          if (userDoc.exists()) {
            const userData = userDoc.data();
            role = userData.role as 'candidate' | 'recruiter';
            onboardingComplete = userData.onboardingComplete ?? (role === 'candidate');
          }

          set({
            user: mapFirebaseUser(result.user, role, onboardingComplete),
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

      signupWithEmail: async (email, password, role = 'candidate') => {
        set({ isLoading: true, error: null });
        try {
          const result = await createUserWithEmailAndPassword(auth, email, password);

          // Candidates don't need onboarding, recruiters do
          const onboardingComplete = role === 'candidate';

          // Save user to Firestore
          await setDoc(doc(db, 'users', result.user.uid), {
            uid: result.user.uid,
            email: result.user.email,
            role: role,
            onboardingComplete: onboardingComplete,
            createdAt: new Date().toISOString()
          });

          set({
            user: mapFirebaseUser(result.user, role, onboardingComplete),
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

      setOnboardingComplete: () => set((state) => ({
        user: state.user ? { ...state.user, onboardingComplete: true } : null
      })),
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
onAuthStateChanged(auth, async (user) => {
  const store = useAuthStore.getState();
  if (user) {
    // Fetch role and onboarding status from Firestore
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      let role: 'candidate' | 'recruiter' | undefined;
      let onboardingComplete = true;

      if (userDoc.exists()) {
        const userData = userDoc.data();
        role = userData.role as 'candidate' | 'recruiter';
        onboardingComplete = userData.onboardingComplete ?? (role === 'candidate');
      }

      store.setUser(mapFirebaseUser(user, role, onboardingComplete));
    } catch (e) {
      console.error("Failed to fetch user profile on auth state change", e);
      // Fallback to minimal user info if firestore fails
      store.setUser(mapFirebaseUser(user));
    }
  } else {
    if (store.isAuthenticated) {
      store.setUser(null);
    }
  }
});
