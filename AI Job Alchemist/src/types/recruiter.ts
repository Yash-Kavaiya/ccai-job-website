// Company profile collected during onboarding
export interface CompanyProfile {
  name: string;
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  industry: string;
  website: string;
}

// Hiring needs collected during onboarding
export interface HiringNeeds {
  rolesHiring: string[];
  teamSize: number;
  urgency: 'immediate' | 'within_month' | 'within_quarter' | 'exploratory';
}

// Complete recruiter profile
export interface RecruiterProfile {
  userId: string;
  company: CompanyProfile;
  hiringNeeds: HiringNeeds;
  onboardingComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

// Job posting by recruiter
export interface JobPosting {
  id: string;
  recruiterId: string;
  title: string;
  description: string;
  requirements: string[];
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship';
  remotePolicy: 'remote' | 'hybrid' | 'onsite';
  status: 'draft' | 'active' | 'paused' | 'closed';
  views: number;
  applicationsCount: number;
  createdAt: string;
  updatedAt: string;
}

// Application from candidate
export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  resumeUrl?: string;
  coverLetter?: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'interview' | 'rejected' | 'hired';
  appliedAt: string;
  updatedAt: string;
}

// Recruiter analytics
export interface RecruiterAnalytics {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  pendingApplications: number;
  shortlistedCandidates: number;
  totalViews: number;
  avgApplicationsPerJob: number;
}

// Team member
export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'recruiter' | 'viewer';
  invitedAt: string;
  joinedAt?: string;
  status: 'pending' | 'active';
}

// Company size options for dropdown
export const companySizeOptions = [
  { value: 'startup', label: 'Startup (1-10 employees)' },
  { value: 'small', label: 'Small (11-50 employees)' },
  { value: 'medium', label: 'Medium (51-200 employees)' },
  { value: 'large', label: 'Large (201-1000 employees)' },
  { value: 'enterprise', label: 'Enterprise (1000+ employees)' },
] as const;

// Hiring urgency options for dropdown
export const hiringUrgencyOptions = [
  { value: 'immediate', label: 'Immediate (within 2 weeks)' },
  { value: 'within_month', label: 'Within a month' },
  { value: 'within_quarter', label: 'Within this quarter' },
  { value: 'exploratory', label: 'Exploratory (no rush)' },
] as const;

// Industry options for dropdown
export const industryOptions = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'E-commerce',
  'Manufacturing',
  'Media & Entertainment',
  'Consulting',
  'Real Estate',
  'Transportation',
  'Energy',
  'Other',
] as const;
