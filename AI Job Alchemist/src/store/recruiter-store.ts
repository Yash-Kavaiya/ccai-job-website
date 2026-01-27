import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { doc, setDoc, getDoc, updateDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from './auth-store';
import type {
  CompanyProfile,
  HiringNeeds,
  RecruiterProfile,
  JobPosting,
  JobApplication,
  RecruiterAnalytics,
  TeamMember
} from '@/types/recruiter';

interface RecruiterState {
  // Onboarding state
  onboardingStep: number;
  companyProfile: Partial<CompanyProfile> | null;
  hiringNeeds: Partial<HiringNeeds> | null;
  isOnboardingComplete: boolean;

  // Dashboard state
  recruiterProfile: RecruiterProfile | null;
  postedJobs: JobPosting[];
  applications: JobApplication[];
  analytics: RecruiterAnalytics | null;
  teamMembers: TeamMember[];

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Onboarding actions
  setOnboardingStep: (step: number) => void;
  setCompanyProfile: (profile: Partial<CompanyProfile>) => void;
  setHiringNeeds: (needs: Partial<HiringNeeds>) => void;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => void;

  // Data fetching actions
  loadRecruiterProfile: () => Promise<void>;
  loadPostedJobs: () => Promise<void>;
  loadApplications: (jobId?: string) => Promise<void>;
  loadAnalytics: () => Promise<void>;
  loadTeamMembers: () => Promise<void>;

  // Job management actions
  createJob: (job: Omit<JobPosting, 'id' | 'recruiterId' | 'views' | 'applicationsCount' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateJob: (jobId: string, updates: Partial<JobPosting>) => Promise<void>;
  deleteJob: (jobId: string) => Promise<void>;

  // Application management actions
  updateApplicationStatus: (applicationId: string, status: JobApplication['status']) => Promise<void>;

  // Utility actions
  clearError: () => void;
}

export const useRecruiterStore = create<RecruiterState>()(
  persist(
    (set, get) => ({
      // Initial state
      onboardingStep: 1,
      companyProfile: null,
      hiringNeeds: null,
      isOnboardingComplete: false,
      recruiterProfile: null,
      postedJobs: [],
      applications: [],
      analytics: null,
      teamMembers: [],
      isLoading: false,
      error: null,

      // Onboarding actions
      setOnboardingStep: (step) => set({ onboardingStep: step }),

      setCompanyProfile: (profile) => set({ companyProfile: profile }),

      setHiringNeeds: (needs) => set({ hiringNeeds: needs }),

      completeOnboarding: async () => {
        const { companyProfile, hiringNeeds } = get();
        const user = useAuthStore.getState().user;

        if (!user) {
          const error = 'You must be logged in to complete onboarding';
          set({ error });
          throw new Error(error);
        }

        if (!companyProfile || !hiringNeeds) {
          const error = 'Please complete all onboarding steps';
          set({ error });
          throw new Error(error);
        }

        set({ isLoading: true, error: null });

        try {
          const now = new Date().toISOString();
          const recruiterProfile: RecruiterProfile = {
            userId: user.uid,
            company: companyProfile as CompanyProfile,
            hiringNeeds: hiringNeeds as HiringNeeds,
            onboardingComplete: true,
            createdAt: now,
            updatedAt: now
          };

          // Save recruiter profile to Firestore
          await setDoc(doc(db, 'recruiter_profiles', user.uid), recruiterProfile);

          // Update user's onboarding status
          await updateDoc(doc(db, 'users', user.uid), {
            onboardingComplete: true
          });

          // Update auth store
          useAuthStore.getState().setOnboardingComplete();

          set({
            recruiterProfile,
            isOnboardingComplete: true,
            isLoading: false
          });
        } catch (error: any) {
          console.error('Failed to complete onboarding:', error);
          set({
            isLoading: false,
            error: error.message || 'Failed to complete onboarding'
          });
          throw error;
        }
      },

      resetOnboarding: () => set({
        onboardingStep: 1,
        companyProfile: null,
        hiringNeeds: null
      }),

      // Data fetching actions
      loadRecruiterProfile: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        set({ isLoading: true, error: null });

        try {
          const docRef = doc(db, 'recruiter_profiles', user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const profile = docSnap.data() as RecruiterProfile;
            set({
              recruiterProfile: profile,
              companyProfile: profile.company,
              hiringNeeds: profile.hiringNeeds,
              isOnboardingComplete: profile.onboardingComplete,
              isLoading: false
            });
          } else {
            set({ isLoading: false });
          }
        } catch (error: any) {
          console.error('Failed to load recruiter profile:', error);
          set({
            isLoading: false,
            error: error.message || 'Failed to load profile'
          });
        }
      },

      loadPostedJobs: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        set({ isLoading: true, error: null });

        try {
          const jobsRef = collection(db, 'jobs');
          const q = query(
            jobsRef,
            where('recruiterId', '==', user.uid),
            orderBy('createdAt', 'desc')
          );
          const querySnapshot = await getDocs(q);

          const jobs: JobPosting[] = [];
          querySnapshot.forEach((doc) => {
            jobs.push({ id: doc.id, ...doc.data() } as JobPosting);
          });

          set({ postedJobs: jobs, isLoading: false });
        } catch (error: any) {
          console.error('Failed to load posted jobs:', error);
          set({
            isLoading: false,
            error: error.message || 'Failed to load jobs'
          });
        }
      },

      loadApplications: async (jobId?: string) => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        set({ isLoading: true, error: null });

        try {
          const applicationsRef = collection(db, 'job_applications');
          let q;

          if (jobId) {
            q = query(
              applicationsRef,
              where('jobId', '==', jobId),
              orderBy('appliedAt', 'desc')
            );
          } else {
            // Get all applications for this recruiter's jobs
            const { postedJobs } = get();
            const jobIds = postedJobs.map(job => job.id);

            if (jobIds.length === 0) {
              set({ applications: [], isLoading: false });
              return;
            }

            q = query(
              applicationsRef,
              where('jobId', 'in', jobIds.slice(0, 10)), // Firestore 'in' limit
              orderBy('appliedAt', 'desc')
            );
          }

          const querySnapshot = await getDocs(q);

          const applications: JobApplication[] = [];
          querySnapshot.forEach((doc) => {
            applications.push({ id: doc.id, ...doc.data() } as JobApplication);
          });

          set({ applications, isLoading: false });
        } catch (error: any) {
          console.error('Failed to load applications:', error);
          set({
            isLoading: false,
            error: error.message || 'Failed to load applications'
          });
        }
      },

      loadAnalytics: async () => {
        const { postedJobs, applications } = get();

        const activeJobs = postedJobs.filter(job => job.status === 'active').length;
        const pendingApplications = applications.filter(app => app.status === 'pending').length;
        const shortlistedCandidates = applications.filter(app => app.status === 'shortlisted').length;
        const totalViews = postedJobs.reduce((sum, job) => sum + (job.views || 0), 0);

        const analytics: RecruiterAnalytics = {
          totalJobs: postedJobs.length,
          activeJobs,
          totalApplications: applications.length,
          pendingApplications,
          shortlistedCandidates,
          totalViews,
          avgApplicationsPerJob: postedJobs.length > 0
            ? Math.round(applications.length / postedJobs.length)
            : 0
        };

        set({ analytics });
      },

      loadTeamMembers: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        set({ isLoading: true, error: null });

        try {
          const teamRef = collection(db, 'recruiter_profiles', user.uid, 'team');
          const querySnapshot = await getDocs(teamRef);

          const members: TeamMember[] = [];
          querySnapshot.forEach((doc) => {
            members.push({ id: doc.id, ...doc.data() } as TeamMember);
          });

          set({ teamMembers: members, isLoading: false });
        } catch (error: any) {
          console.error('Failed to load team members:', error);
          set({
            isLoading: false,
            error: error.message || 'Failed to load team'
          });
        }
      },

      // Job management actions
      createJob: async (jobData) => {
        const user = useAuthStore.getState().user;
        if (!user) throw new Error('Not authenticated');

        set({ isLoading: true, error: null });

        try {
          const now = new Date().toISOString();
          const jobId = `job_${Date.now()}`;

          const job: JobPosting = {
            ...jobData,
            id: jobId,
            recruiterId: user.uid,
            views: 0,
            applicationsCount: 0,
            createdAt: now,
            updatedAt: now
          };

          // Remove undefined values (Firestore doesn't accept undefined)
          const cleanJob = Object.fromEntries(
            Object.entries(job).filter(([_, value]) => value !== undefined)
          );

          await setDoc(doc(db, 'jobs', jobId), cleanJob);

          set((state) => ({
            postedJobs: [job, ...state.postedJobs],
            isLoading: false
          }));

          return jobId;
        } catch (error: any) {
          console.error('Failed to create job:', error);
          set({
            isLoading: false,
            error: error.message || 'Failed to create job'
          });
          throw error;
        }
      },

      updateJob: async (jobId, updates) => {
        set({ isLoading: true, error: null });

        try {
          const updateData = {
            ...updates,
            updatedAt: new Date().toISOString()
          };

          await updateDoc(doc(db, 'jobs', jobId), updateData);

          set((state) => ({
            postedJobs: state.postedJobs.map(job =>
              job.id === jobId ? { ...job, ...updateData } : job
            ),
            isLoading: false
          }));
        } catch (error: any) {
          console.error('Failed to update job:', error);
          set({
            isLoading: false,
            error: error.message || 'Failed to update job'
          });
          throw error;
        }
      },

      deleteJob: async (jobId) => {
        set({ isLoading: true, error: null });

        try {
          // Soft delete by updating status
          await updateDoc(doc(db, 'jobs', jobId), {
            status: 'closed',
            updatedAt: new Date().toISOString()
          });

          set((state) => ({
            postedJobs: state.postedJobs.filter(job => job.id !== jobId),
            isLoading: false
          }));
        } catch (error: any) {
          console.error('Failed to delete job:', error);
          set({
            isLoading: false,
            error: error.message || 'Failed to delete job'
          });
          throw error;
        }
      },

      // Application management actions
      updateApplicationStatus: async (applicationId, status) => {
        set({ isLoading: true, error: null });

        try {
          await updateDoc(doc(db, 'job_applications', applicationId), {
            status,
            updatedAt: new Date().toISOString()
          });

          set((state) => ({
            applications: state.applications.map(app =>
              app.id === applicationId ? { ...app, status } : app
            ),
            isLoading: false
          }));
        } catch (error: any) {
          console.error('Failed to update application:', error);
          set({
            isLoading: false,
            error: error.message || 'Failed to update application'
          });
          throw error;
        }
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'aijobhub-recruiter',
      partialize: (state) => ({
        companyProfile: state.companyProfile,
        hiringNeeds: state.hiringNeeds,
        onboardingStep: state.onboardingStep,
        isOnboardingComplete: state.isOnboardingComplete
      })
    }
  )
);
