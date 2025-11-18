import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { table } from '@/lib/devv-backend-stub';

// Types for social features
export interface SocialProfile {
  _uid: string;
  _id: string;
  profile_slug: string;
  display_name: string;
  bio: string;
  avatar_url?: string;
  is_public: string; // 'true' or 'false'
  show_email: string;
  show_location: string;
  show_skills: string;
  show_experience: string;
  social_links: string; // JSON string
  achievements: string; // JSON array
  portfolio_items: string; // JSON array
  total_views: number;
  total_connections: number;
  last_active: string;
  created_at: string;
  updated_at: string;
}

export interface UserConnection {
  _uid: string;
  _id: string;
  connected_user_id: string;
  connected_user_name: string;
  connection_status: 'pending' | 'accepted' | 'blocked';
  connection_type: 'colleague' | 'recruiter' | 'peer' | 'mentor';
  message: string;
  mutual_connections: number;
  created_at: string;
  accepted_at?: string;
  last_interaction: string;
}

export interface SocialLinks {
  linkedin?: string;
  github?: string;
  twitter?: string;
  portfolio?: string;
  website?: string;
}

export interface Achievement {
  title: string;
  description: string;
  date: string;
  type: 'certification' | 'award' | 'project' | 'publication';
  url?: string;
}

export interface PortfolioItem {
  title: string;
  description: string;
  image_url?: string;
  project_url?: string;
  github_url?: string;
  technologies: string[];
  date: string;
}

interface SocialStore {
  // State
  socialProfile: SocialProfile | null;
  connections: UserConnection[];
  publicProfiles: SocialProfile[];
  profileViews: number;
  isLoading: boolean;
  error: string | null;
  profilePreview: SocialProfile | null;
  connectionRequests: UserConnection[];

  // Social Profile Actions
  createSocialProfile: (profileData: Partial<SocialProfile>) => Promise<void>;
  updateSocialProfile: (updates: Partial<SocialProfile>) => Promise<void>;
  loadSocialProfile: () => Promise<void>;
  toggleProfileVisibility: (isPublic: boolean) => Promise<void>;
  updateProfileSlug: (slug: string) => Promise<void>;
  addAchievement: (achievement: Achievement) => Promise<void>;
  removeAchievement: (achievementIndex: number) => Promise<void>;
  addPortfolioItem: (item: PortfolioItem) => Promise<void>;
  removePortfolioItem: (itemIndex: number) => Promise<void>;
  updateSocialLinks: (links: SocialLinks) => Promise<void>;

  // Public Profile Actions
  viewPublicProfile: (profileSlug: string) => Promise<SocialProfile | null>;
  searchPublicProfiles: (query: string) => Promise<void>;
  loadFeaturedProfiles: () => Promise<void>;
  recordProfileView: (profileSlug: string) => Promise<void>;

  // Connection Actions
  sendConnectionRequest: (userId: string, message: string, type: UserConnection['connection_type']) => Promise<void>;
  acceptConnectionRequest: (connectionId: string) => Promise<void>;
  rejectConnectionRequest: (connectionId: string) => Promise<void>;
  loadConnections: () => Promise<void>;
  loadConnectionRequests: () => Promise<void>;
  removeConnection: (connectionId: string) => Promise<void>;
  blockUser: (connectionId: string) => Promise<void>;

  // Profile Sharing Actions
  generateProfileShareUrl: (profileSlug: string) => string;
  shareProfile: (platform: 'linkedin' | 'twitter' | 'email' | 'copy') => Promise<void>;

  // Utility Actions
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useSocialStore = create<SocialStore>()(
  persist(
    (set, get) => ({
      // Initial State
      socialProfile: null,
      connections: [],
      publicProfiles: [],
      profileViews: 0,
      isLoading: false,
      error: null,
      profilePreview: null,
      connectionRequests: [],

      // Social Profile Actions
      createSocialProfile: async (profileData) => {
        set({ isLoading: true, error: null });
        try {
          const timestamp = new Date().toISOString();
          
          const newProfile: Partial<SocialProfile> = {
            profile_slug: profileData.profile_slug || '',
            display_name: profileData.display_name || '',
            bio: profileData.bio || '',
            avatar_url: profileData.avatar_url || '',
            is_public: 'false',
            show_email: 'false',
            show_location: 'true',
            show_skills: 'true',
            show_experience: 'true',
            social_links: JSON.stringify({}),
            achievements: JSON.stringify([]),
            portfolio_items: JSON.stringify([]),
            total_views: 0,
            total_connections: 0,
            last_active: timestamp,
            created_at: timestamp,
            updated_at: timestamp,
            ...profileData
          };

          await table.addItem('ewrto6a4sn40', newProfile);
          set({ socialProfile: newProfile as SocialProfile, isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      updateSocialProfile: async (updates) => {
        const { socialProfile } = get();
        if (!socialProfile) return;

        set({ isLoading: true, error: null });
        try {
          const updatedData = {
            ...updates,
            updated_at: new Date().toISOString(),
            last_active: new Date().toISOString()
          };

          await table.updateItem('ewrto6a4sn40', {
            _uid: socialProfile._uid,
            _id: socialProfile._id,
            ...updatedData
          });

          set({ 
            socialProfile: { ...socialProfile, ...updatedData },
            isLoading: false 
          });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      loadSocialProfile: async () => {
        set({ isLoading: true, error: null });
        try {
          const result = await table.getItems('ewrto6a4sn40');
          const profiles = result.items;
          const userProfile = profiles.length > 0 ? profiles[0] as SocialProfile : null;
          set({ socialProfile: userProfile, isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      toggleProfileVisibility: async (isPublic) => {
        const { updateSocialProfile } = get();
        await updateSocialProfile({ is_public: isPublic ? 'true' : 'false' });
      },

      updateProfileSlug: async (slug) => {
        const { updateSocialProfile } = get();
        await updateSocialProfile({ profile_slug: slug });
      },

      addAchievement: async (achievement) => {
        const { socialProfile, updateSocialProfile } = get();
        if (!socialProfile) return;

        const achievements = JSON.parse(socialProfile.achievements || '[]') as Achievement[];
        achievements.push(achievement);
        await updateSocialProfile({ achievements: JSON.stringify(achievements) });
      },

      removeAchievement: async (achievementIndex) => {
        const { socialProfile, updateSocialProfile } = get();
        if (!socialProfile) return;

        const achievements = JSON.parse(socialProfile.achievements || '[]') as Achievement[];
        achievements.splice(achievementIndex, 1);
        await updateSocialProfile({ achievements: JSON.stringify(achievements) });
      },

      addPortfolioItem: async (item) => {
        const { socialProfile, updateSocialProfile } = get();
        if (!socialProfile) return;

        const portfolioItems = JSON.parse(socialProfile.portfolio_items || '[]') as PortfolioItem[];
        portfolioItems.push(item);
        await updateSocialProfile({ portfolio_items: JSON.stringify(portfolioItems) });
      },

      removePortfolioItem: async (itemIndex) => {
        const { socialProfile, updateSocialProfile } = get();
        if (!socialProfile) return;

        const portfolioItems = JSON.parse(socialProfile.portfolio_items || '[]') as PortfolioItem[];
        portfolioItems.splice(itemIndex, 1);
        await updateSocialProfile({ portfolio_items: JSON.stringify(portfolioItems) });
      },

      updateSocialLinks: async (links) => {
        const { updateSocialProfile } = get();
        await updateSocialProfile({ social_links: JSON.stringify(links) });
      },

      // Public Profile Actions
      viewPublicProfile: async (profileSlug) => {
        set({ isLoading: true, error: null });
        try {
          const result = await table.getItems('ewrto6a4sn40', {
            query: { profile_slug: profileSlug }
          });
          const profiles = result.items;
          const profile = profiles.length > 0 ? profiles[0] as SocialProfile : null;
          
          if (profile && profile.is_public === 'true') {
            set({ profilePreview: profile, isLoading: false });
            return profile;
          } else {
            set({ profilePreview: null, isLoading: false });
            return null;
          }
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          return null;
        }
      },

      searchPublicProfiles: async (query) => {
        set({ isLoading: true, error: null });
        try {
          const result = await table.getItems('ewrto6a4sn40', {
            query: { is_public: 'true' }
          });
          const allProfiles = result.items;
          
          const filteredProfiles = allProfiles.filter((profile: any) => {
            const searchText = `${profile.display_name} ${profile.bio}`.toLowerCase();
            return searchText.includes(query.toLowerCase());
          });

          set({ publicProfiles: filteredProfiles as SocialProfile[], isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      loadFeaturedProfiles: async () => {
        set({ isLoading: true, error: null });
        try {
          const result = await table.getItems('ewrto6a4sn40', {
            query: { is_public: 'true' }
          });
          const profiles = result.items;
          const sortedProfiles = profiles
            .sort((a: any, b: any) => b.total_views - a.total_views)
            .slice(0, 12);

          set({ publicProfiles: sortedProfiles as SocialProfile[], isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      recordProfileView: async (profileSlug) => {
        try {
          const result = await table.getItems('ewrto6a4sn40', {
            query: { profile_slug: profileSlug }
          });
          const profiles = result.items;
          if (profiles.length > 0) {
            const profile = profiles[0] as SocialProfile;
            await table.updateItem('ewrto6a4sn40', {
              _uid: profile._uid,
              _id: profile._id,
              total_views: profile.total_views + 1,
              last_active: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Error recording profile view:', error);
        }
      },

      // Connection Actions
      sendConnectionRequest: async (userId, message, type) => {
        set({ isLoading: true, error: null });
        try {
          const timestamp = new Date().toISOString();
          
          const connectionData = {
            connected_user_id: userId,
            connected_user_name: 'User', // This would be fetched from user profile
            connection_status: 'pending' as const,
            connection_type: type,
            message,
            mutual_connections: 0,
            created_at: timestamp,
            last_interaction: timestamp
          };

          await table.addItem('ewrtoiv0vw1s', connectionData);
          set({ isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      acceptConnectionRequest: async (connectionId) => {
        set({ isLoading: true, error: null });
        try {
          const result = await table.getItems('ewrtoiv0vw1s');
          const connections = result.items;
          const connection = connections.find((c: any) => c._id === connectionId);
          
          if (connection) {
            await table.updateItem('ewrtoiv0vw1s', {
              _uid: connection._uid,
              _id: connection._id,
              connection_status: 'accepted',
              accepted_at: new Date().toISOString(),
              last_interaction: new Date().toISOString()
            });
            
            await get().loadConnections();
            await get().loadConnectionRequests();
          }
          
          set({ isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      rejectConnectionRequest: async (connectionId) => {
        set({ isLoading: true, error: null });
        try {
          const result = await table.getItems('ewrtoiv0vw1s');
          const connections = result.items;
          const connection = connections.find((c: any) => c._id === connectionId);
          
          if (connection) {
            await table.deleteItem('ewrtoiv0vw1s', {
              _uid: connection._uid,
              _id: connection._id
            });
            
            await get().loadConnectionRequests();
          }
          
          set({ isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      loadConnections: async () => {
        set({ isLoading: true, error: null });
        try {
          const allConnections = await table.select('ewrtoiv0vw1s', {});
          const acceptedConnections = allConnections.filter((c: any) => c.connection_status === 'accepted');
          set({ connections: acceptedConnections as UserConnection[], isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      loadConnectionRequests: async () => {
        set({ isLoading: true, error: null });
        try {
          const allConnections = await table.select('ewrtoiv0vw1s', {});
          const pendingRequests = allConnections.filter((c: any) => c.connection_status === 'pending');
          set({ connectionRequests: pendingRequests as UserConnection[], isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      removeConnection: async (connectionId) => {
        set({ isLoading: true, error: null });
        try {
          const result = await table.getItems('ewrtoiv0vw1s');
          const connections = result.items;
          const connection = connections.find((c: any) => c._id === connectionId);
          
          if (connection) {
            await table.deleteItem('ewrtoiv0vw1s', {
              _uid: connection._uid,
              _id: connection._id
            });
            
            await get().loadConnections();
          }
          
          set({ isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      blockUser: async (connectionId) => {
        set({ isLoading: true, error: null });
        try {
          const result = await table.getItems('ewrtoiv0vw1s');
          const connections = result.items;
          const connection = connections.find((c: any) => c._id === connectionId);
          
          if (connection) {
            await table.updateItem('ewrtoiv0vw1s', {
              _uid: connection._uid,
              _id: connection._id,
              connection_status: 'blocked',
              last_interaction: new Date().toISOString()
            });
            
            await get().loadConnections();
          }
          
          set({ isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      // Profile Sharing Actions
      generateProfileShareUrl: (profileSlug) => {
        return `${window.location.origin}/profile/${profileSlug}`;
      },

      shareProfile: async (platform) => {
        const { socialProfile, generateProfileShareUrl } = get();
        if (!socialProfile) return;

        const shareUrl = generateProfileShareUrl(socialProfile.profile_slug);
        const shareText = `Check out my AI professional profile: ${socialProfile.display_name}`;

        switch (platform) {
          case 'linkedin':
            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`);
            break;
          case 'twitter':
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`);
            break;
          case 'email':
            window.open(`mailto:?subject=${encodeURIComponent('Check out my AI profile')}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`);
            break;
          case 'copy':
            await navigator.clipboard.writeText(shareUrl);
            break;
        }
      },

      // Utility Actions
      clearError: () => set({ error: null }),
      
      setLoading: (loading) => set({ isLoading: loading })
    }),
    {
      name: 'social-store',
      partialize: (state) => ({
        socialProfile: state.socialProfile,
        connections: state.connections,
        profileViews: state.profileViews
      })
    }
  )
);