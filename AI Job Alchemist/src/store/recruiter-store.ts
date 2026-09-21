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
        const user = useAuthStore.getState().user;
        if (!user) throw new Error('Not authenticated');

        const { companyProfile, hiringNeeds } = get();
        if (!companyProfile || !hiringNeeds) {
          throw new Error('Incomplete onboarding data');
        }

        set({ isLoading: true, error: null });

        try {
          const now = new Date().toISOString();
          const profile: RecruiterProfile = {
            userId: user.uid,
            company: companyProfile as CompanyProfile,
            hiringNeeds: hiringNeeds as HiringNeeds,
            onboardingComplete: true,
            createdAt: now,
            updatedAt: now
          };

          await setDoc(doc(db, 'recruiter_profiles', user.uid), profile);

          // Update user document to mark onboarding complete
          await updateDoc(doc(db, 'users', user.uid), {
            onboardingComplete: true,
            companyProfile: profile.company,
            updatedAt: now
          });

          set({
            recruiterProfile: profile,
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
          const profileDoc = await getDoc(doc(db, 'recruiter_profiles', user.uid));

          if (profileDoc.exists()) {
            const profile = profileDoc.data() as RecruiterProfile;
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
          const jobsQuery = query(
            collection(db, 'jobs'),
            where('recruiterId', '==', user.uid),
            orderBy('createdAt', 'desc')
          );

          const querySnapshot = await getDocs(jobsQuery);
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

      loadApplications: async (jobId) => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        set({ isLoading: true, error: null });

        try {
          let applicationsQuery;

          if (jobId) {
            applicationsQuery = query(
              collection(db, 'applications'),
              where('jobId', '==', jobId),
              orderBy('appliedAt', 'desc')
            );
          } else {
            // Get all applications for recruiter's jobs
            const { postedJobs } = get();
            const jobIds = postedJobs.map(j => j.id);

            if (jobIds.length === 0) {
              set({ applications: [], isLoading: false });
              return;
            }

            applicationsQuery = query(
              collection(db, 'applications'),
              where('jobId', 'in', jobIds.slice(0, 10)), // Firestore 'in' limit is 10
              orderBy('appliedAt', 'desc')
            );
          }

          const querySnapshot = await getDocs(applicationsQuery);
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

        const activeJobs = postedJobs.filter(j => j.status === 'active');
        const pendingApplications = applications.filter(a => a.status === 'pending');
        const shortlistedCandidates = applications.filter(a =>
          a.status === 'shortlisted' || a.status === 'interview'
        );
        const totalViews = postedJobs.reduce((sum, j) => sum + (j.views || 0), 0);

        const analytics: RecruiterAnalytics = {
          totalJobs: postedJobs.length,
          activeJobs: activeJobs.length,
          totalApplications: applications.length,
          pendingApplications: pendingApplications.length,
          shortlistedCandidates: shortlistedCandidates.length,
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
            members.push({ id: doc.id, ...(doc.data() as any) } as TeamMember);
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
          const now = new Date();
          const jobId = `job_${Date.now()}`;
          const { companyProfile, recruiterProfile } = get();
          const companyName =
            companyProfile?.name ||
            recruiterProfile?.company?.name ||
            'Company Name';

          // Map frontend job data to backend-compatible format
          const job: JobPosting = {
            ...jobData,
            id: jobId,
            recruiterId: user.uid,
            views: 0,
            applicationsCount: 0,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString()
          };

          // Create backend-compatible job document
          const firestoreJob = {
            id: jobId,
            title: job.title,
            company: companyName,
            description: job.description,
            location: job.location,
            salary_min: job.salaryMin,
            salary_max: job.salaryMax,
            job_type: job.jobType?.replace('-', '_') || 'full_time', // Convert 'full-time' to 'full_time'
            skills_required: job.requirements || [],
            experience_level: 'Mid-Level',
            source: 'manual',
            source_url: `${window.location.origin}/jobs/${jobId}`,
            company_logo_url: '',
            posted_at: now,
            expires_at: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            is_active: job.status === 'active',
            embedding_id: null,
            // Keep recruiter-specific fields
            recruiterId: user.uid,
            views: 0,
            applicationsCount: 0,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            remotePolicy: job.remotePolicy,
            status: job.status
          };

          // Remove undefined values (Firestore doesn't accept undefined)
          const cleanJob = Object.fromEntries(
            Object.entries(firestoreJob).filter(([_, value]) => value !== undefined)
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
          await updateDoc(doc(db, 'jobs', jobId), {
            ...updates,
            updatedAt: new Date().toISOString()
          });

          set((state) => ({
            postedJobs: state.postedJobs.map(job =>
              job.id === jobId ? { ...job, ...updates } : job
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
          await updateDoc(doc(db, 'jobs', jobId), {
            status: 'closed',
            is_active: false,
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

      updateApplicationStatus: async (applicationId, status) => {
        set({ isLoading: true, error: null });

        try {
          await updateDoc(doc(db, 'applications', applicationId), {
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
      name: 'recruiter-storage',
      partialize: (state) => ({
        onboardingStep: state.onboardingStep,
        companyProfile: state.companyProfile,
        hiringNeeds: state.hiringNeeds,
        isOnboardingComplete: state.isOnboardingComplete
      })
    }
  )
);
