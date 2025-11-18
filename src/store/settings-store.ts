import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { table } from '@/lib/devv-backend-stub';
import { useAuthStore } from './auth-store';

// User Profile Types
export interface UserProfile {
  _id?: string;
  _uid?: string;
  name: string;
  email: string;
  title: string;
  location: string;
  experience_level: 'entry' | 'mid' | 'senior' | 'principal';
  skills: string[];
  ai_specializations: string[];
  resume_url?: string;
  ats_score?: number;
  profile_completion: number;
  created_at?: string;
  updated_at?: string;
}

// Settings Types
export interface NotificationSettings {
  emailNotifications: boolean;
  jobAlerts: boolean;
  interviewReminders: boolean;
  weeklyDigest: boolean;
  trendAlerts: boolean;
  networkingPrompts: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'connections';
  resumeVisibility: 'public' | 'private' | 'companies';
  allowDataCollection: boolean;
  allowAnalytics: boolean;
}

export interface PreferenceSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  preferredJobTypes: string[];
  preferredLocations: string[];
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
}

interface SettingsState {
  // Profile State
  profile: UserProfile | null;
  isLoadingProfile: boolean;
  profileUpdateSuccess: boolean;
  
  // Settings State
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  preferences: PreferenceSettings;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  activeTab: string;
  
  // Actions
  loadProfile: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  uploadProfileImage: (file: File) => Promise<string>;
  deleteAccount: () => Promise<void>;
  
  // Settings Actions
  updateNotifications: (settings: Partial<NotificationSettings>) => void;
  updatePrivacy: (settings: Partial<PrivacySettings>) => void;
  updatePreferences: (settings: Partial<PreferenceSettings>) => void;
  
  // UI Actions
  setActiveTab: (tab: string) => void;
  clearError: () => void;
  resetSettings: () => void;
}

const defaultNotifications: NotificationSettings = {
  emailNotifications: true,
  jobAlerts: true,
  interviewReminders: true,
  weeklyDigest: true,
  trendAlerts: false,
  networkingPrompts: false,
};

const defaultPrivacy: PrivacySettings = {
  profileVisibility: 'private',
  resumeVisibility: 'companies',
  allowDataCollection: true,
  allowAnalytics: true,
};

const defaultPreferences: PreferenceSettings = {
  theme: 'system',
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  preferredJobTypes: ['full-time'],
  preferredLocations: ['Remote'],
  salaryRange: {
    min: 80000,
    max: 200000,
    currency: 'USD',
  },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Initial State
      profile: null,
      isLoadingProfile: false,
      profileUpdateSuccess: false,
      notifications: defaultNotifications,
      privacy: defaultPrivacy,
      preferences: defaultPreferences,
      isLoading: false,
      error: null,
      activeTab: 'profile',

      // Profile Actions
      loadProfile: async () => {
        const { user } = useAuthStore.getState();
        if (!user) {
          set({ error: 'User not authenticated' });
          return;
        }

        set({ isLoadingProfile: true, error: null });
        try {
          const response = await table.getItems('ewh7o6feheyo', {
            query: { _uid: user.uid },
            limit: 1,
          });

          if (response.items && response.items.length > 0) {
            const profileData = response.items[0];
            const profile: UserProfile = {
              _id: profileData._id,
              _uid: profileData._uid,
              name: profileData.name || user.name,
              email: profileData.email || user.email,
              title: profileData.title || '',
              location: profileData.location || '',
              experience_level: profileData.experience_level || 'entry',
              skills: profileData.skills ? JSON.parse(profileData.skills) : [],
              ai_specializations: profileData.ai_specializations ? JSON.parse(profileData.ai_specializations) : [],
              resume_url: profileData.resume_url,
              ats_score: profileData.ats_score,
              profile_completion: profileData.profile_completion || 0,
              created_at: profileData.created_at,
              updated_at: profileData.updated_at,
            };
            set({ profile, isLoadingProfile: false });
          } else {
            // Create new profile if none exists
            const newProfile: UserProfile = {
              name: user.name,
              email: user.email,
              title: '',
              location: '',
              experience_level: 'entry',
              skills: [],
              ai_specializations: [],
              profile_completion: 20, // Basic info complete
            };
            set({ profile: newProfile, isLoadingProfile: false });
          }
        } catch (error) {
          console.error('Failed to load profile:', error);
          set({ 
            error: 'Failed to load profile. Please try again.',
            isLoadingProfile: false 
          });
        }
      },

      updateProfile: async (updates: Partial<UserProfile>) => {
        const { user } = useAuthStore.getState();
        const { profile } = get();
        
        if (!user || !profile) {
          set({ error: 'User not authenticated or profile not loaded' });
          return;
        }

        set({ isLoading: true, error: null, profileUpdateSuccess: false });
        try {
          const updatedProfile = { 
            ...profile, 
            ...updates,
            updated_at: new Date().toISOString(),
          };

          // Calculate profile completion
          let completion = 0;
          if (updatedProfile.name) completion += 15;
          if (updatedProfile.email) completion += 15;
          if (updatedProfile.title) completion += 20;
          if (updatedProfile.location) completion += 10;
          if (updatedProfile.skills.length > 0) completion += 20;
          if (updatedProfile.ai_specializations.length > 0) completion += 15;
          if (updatedProfile.resume_url) completion += 5;
          
          updatedProfile.profile_completion = completion;

          const dataToSave = {
            name: updatedProfile.name,
            email: updatedProfile.email,
            title: updatedProfile.title,
            location: updatedProfile.location,
            experience_level: updatedProfile.experience_level,
            skills: JSON.stringify(updatedProfile.skills),
            ai_specializations: JSON.stringify(updatedProfile.ai_specializations),
            resume_url: updatedProfile.resume_url || '',
            ats_score: updatedProfile.ats_score || 0,
            profile_completion: updatedProfile.profile_completion,
            updated_at: updatedProfile.updated_at,
          };

          if (profile._id) {
            // Update existing profile
            await table.updateItem('ewh7o6feheyo', {
              _uid: user.uid,
              _id: profile._id,
              ...dataToSave,
            });
          } else {
            // Create new profile
            await table.addItem('ewh7o6feheyo', {
              ...dataToSave,
              created_at: new Date().toISOString(),
            });
            // Note: _id will be auto-generated by the system
            updatedProfile._uid = user.uid;
          }

          set({ 
            profile: updatedProfile, 
            isLoading: false, 
            profileUpdateSuccess: true 
          });

          // Clear success message after 3 seconds
          setTimeout(() => {
            set({ profileUpdateSuccess: false });
          }, 3000);

        } catch (error) {
          console.error('Failed to update profile:', error);
          set({ 
            error: 'Failed to update profile. Please try again.',
            isLoading: false 
          });
        }
      },

      uploadProfileImage: async (file: File) => {
        set({ isLoading: true, error: null });
        try {
          // This would integrate with the file upload API
          // For now, we'll simulate the upload
          const imageUrl = `https://api.placeholder.com/150x150/${file.name}`;
          
          await get().updateProfile({ resume_url: imageUrl });
          set({ isLoading: false });
          return imageUrl;
        } catch (error) {
          console.error('Failed to upload image:', error);
          set({ 
            error: 'Failed to upload image. Please try again.',
            isLoading: false 
          });
          throw error;
        }
      },

      deleteAccount: async () => {
        const { user } = useAuthStore.getState();
        const { profile } = get();
        
        if (!user || !profile?._id) {
          set({ error: 'User not authenticated or profile not found' });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          // Delete profile
          await table.deleteItem('ewh7o6feheyo', {
            _uid: user.uid,
            _id: profile._id,
          });

          // Delete job matches
          const matches = await table.getItems('ewh9fiypokqo', {
            query: { _uid: user.uid },
          });

          if (matches.items) {
            for (const match of matches.items) {
              await table.deleteItem('ewh9fiypokqo', {
                _uid: user.uid,
                _id: match._id,
              });
            }
          }

          // Delete interview schedules
          const interviews = await table.getItems('ewhkqzfu5ngg', {
            query: { _uid: user.uid },
          });

          if (interviews.items) {
            for (const interview of interviews.items) {
              await table.deleteItem('ewhkqzfu5ngg', {
                _uid: user.uid,
                _id: interview._id,
              });
            }
          }

          // Logout user
          await useAuthStore.getState().logout();
          
          set({ 
            profile: null,
            isLoading: false,
            notifications: defaultNotifications,
            privacy: defaultPrivacy,
            preferences: defaultPreferences,
          });

        } catch (error) {
          console.error('Failed to delete account:', error);
          set({ 
            error: 'Failed to delete account. Please try again.',
            isLoading: false 
          });
        }
      },

      // Settings Actions
      updateNotifications: (settings: Partial<NotificationSettings>) => {
        set(state => ({
          notifications: { ...state.notifications, ...settings }
        }));
      },

      updatePrivacy: (settings: Partial<PrivacySettings>) => {
        set(state => ({
          privacy: { ...state.privacy, ...settings }
        }));
      },

      updatePreferences: (settings: Partial<PreferenceSettings>) => {
        set(state => ({
          preferences: { ...state.preferences, ...settings }
        }));
      },

      // UI Actions
      setActiveTab: (tab: string) => set({ activeTab: tab }),
      
      clearError: () => set({ error: null }),
      
      resetSettings: () => set({
        notifications: defaultNotifications,
        privacy: defaultPrivacy,
        preferences: defaultPreferences,
      }),
    }),
    {
      name: 'aijobhub-settings',
      partialize: (state) => ({
        notifications: state.notifications,
        privacy: state.privacy,
        preferences: state.preferences,
        activeTab: state.activeTab,
      }),
    }
  )
);