import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth } from '@/lib/firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface ResumeAnalysis {
  ats_score: number;
  keyword_matches: string[];
  missing_keywords: string[];
  suggestions: string[];
  strengths: string[];
  weaknesses: string[];
  analyzed_at: string;
  // Optional fields for frontend compat
  detailedScoring?: Record<string, number>;
  aiSpecificKeywords?: string[];
  industryRelevance?: number;
  keywordDensity?: Record<string, number>;
  sectionAnalysis?: Record<string, boolean>;
  formatScore?: number;
  readabilityScore?: number;
  improvementPriority?: any[];
  competitiveAnalysis?: any;
}

export interface ResumeFile {
  id: string;
  user_id: string;
  name: string;
  file_url: string;
  skills: string[];
  experience_years: number;
  education: any[];
  analysis?: ResumeAnalysis;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
  isAnalyzing?: boolean;
}

interface ResumeStore {
  resumes: ResumeFile[];
  currentResume?: ResumeFile;
  isUploading: boolean;
  uploadError?: string;

  // Actions
  uploadResume: (file: File) => Promise<void>;
  analyzeResume: (resumeId: string, resumeText?: string) => Promise<void>;
  setCurrentResume: (resumeId: string) => void;
  removeResume: (resumeId: string) => Promise<void>;
  clearError: () => void;
}

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set, get) => ({
      resumes: [],
      isUploading: false,

      uploadResume: async (file: File) => {
        set({ isUploading: true, uploadError: undefined });

        try {
          const user = auth.currentUser;
          if (!user) throw new Error('User not authenticated');

          const token = await user.getIdToken();

          const formData = new FormData();
          formData.append('file', file);
          formData.append('name', file.name);
          formData.append('is_primary', 'false');
          formData.append('auto_analyze', 'true');

          const response = await fetch(`${API_URL}/api/v1/resumes/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Upload failed');
          }

          const newResume: ResumeFile = await response.json();

          set(state => ({
            resumes: [...state.resumes, newResume],
            currentResume: newResume,
            isUploading: false,
          }));

        } catch (error) {
          console.error('Upload error:', error);
          set({
            isUploading: false,
            uploadError: error instanceof Error ? error.message : 'Upload failed'
          });
        }
      },

      analyzeResume: async (resumeId: string, resumeText?: string) => {
        const { resumes } = get();
        // Since backend handles analysis on upload, we might just need to re-fetch or trigger specific analysis
        // For now, let's implement the trigger endpoint if needed, or just warn if not implemented
        // But referencing the plan, we want to fix upload first.
        // Let's implement the real call to analyze endpoint if it exists

        const resume = resumes.find(r => r.id === resumeId);
        if (!resume) return;

        set(state => ({
          resumes: state.resumes.map(r =>
            r.id === resumeId ? { ...r, isAnalyzing: true } : r
          )
        }));

        try {
          const user = auth.currentUser;
          if (!user) throw new Error('User not authenticated');
          const token = await user.getIdToken();

          const response = await fetch(`${API_URL}/api/v1/resumes/${resumeId}/analyze`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({}) // Add job_keywords/description here if needed
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Analysis failed');
          }

          const analysisResult = await response.json();

          set(state => ({
            resumes: state.resumes.map(r =>
              r.id === resumeId ? {
                ...r,
                analysis: analysisResult,
                isAnalyzing: false
              } : r
            )
          }));

        } catch (error) {
          console.error('Analysis failed:', error);
          set(state => ({
            resumes: state.resumes.map(r =>
              r.id === resumeId ? { ...r, isAnalyzing: false } : r
            )
          }));
        }
      },

      setCurrentResume: (resumeId: string) => {
        const { resumes } = get();
        const resume = resumes.find(r => r.id === resumeId);
        set({ currentResume: resume });
      },

      removeResume: async (resumeId: string) => {
        try {
          const user = auth.currentUser;
          if (!user) throw new Error('User not authenticated');
          const token = await user.getIdToken();

          const response = await fetch(`${API_URL}/api/v1/resumes/${resumeId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            throw new Error('Failed to delete resume');
          }

          set(state => ({
            resumes: state.resumes.filter(r => r.id !== resumeId),
            currentResume: state.currentResume?.id === resumeId ? undefined : state.currentResume
          }));
        } catch (error) {
          console.error('Delete failed:', error);
          // Optimistic update fallback or error handling could go here
        }
      },

      clearError: () => {
        set({ uploadError: undefined });
      },
    }),
    {
      name: 'resume-store',
      partialize: (state) => ({
        resumes: state.resumes,
        currentResume: state.currentResume,
      }),
    }
  )
);