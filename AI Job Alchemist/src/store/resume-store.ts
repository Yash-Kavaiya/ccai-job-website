import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth, db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, doc, setDoc, deleteDoc, getDocs, query, where, orderBy } from 'firebase/firestore';

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
  fetchResumes: () => Promise<void>;
  clearError: () => void;
}

// Simple ATS analysis based on common keywords
const performBasicAnalysis = (fileName: string): ResumeAnalysis => {
  // This is a basic analysis - in production, you'd use AI/ML service
  const commonKeywords = ['python', 'javascript', 'react', 'node', 'aws', 'docker', 'kubernetes', 'sql', 'git', 'agile'];
  const aiKeywords = ['machine learning', 'ai', 'tensorflow', 'pytorch', 'nlp', 'deep learning', 'data science'];

  // Simulate analysis based on file name patterns
  const lowerName = fileName.toLowerCase();
  const matchedKeywords = commonKeywords.filter(k => lowerName.includes(k.substring(0, 3)));
  const matchedAiKeywords = aiKeywords.filter(k => lowerName.includes(k.substring(0, 2)));

  const baseScore = 65;
  const keywordBonus = matchedKeywords.length * 5;
  const aiBonus = matchedAiKeywords.length * 3;
  const atsScore = Math.min(95, baseScore + keywordBonus + aiBonus);

  return {
    ats_score: atsScore,
    keyword_matches: [...matchedKeywords, ...matchedAiKeywords],
    missing_keywords: commonKeywords.filter(k => !matchedKeywords.includes(k)).slice(0, 5),
    suggestions: [
      'Add more specific technical skills',
      'Include quantifiable achievements',
      'Use action verbs to describe experience',
      'Ensure consistent formatting throughout'
    ],
    strengths: [
      'Resume uploaded successfully',
      'File format is compatible with ATS systems'
    ],
    weaknesses: [
      'Consider adding more industry-specific keywords',
      'Add a professional summary section'
    ],
    analyzed_at: new Date().toISOString(),
    formatScore: 75,
    readabilityScore: 80,
  };
};

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

          // Generate unique ID for the resume
          const resumeId = `${user.uid}_${Date.now()}`;

          // Upload file to Firebase Storage
          const storageRef = ref(storage, `resumes/${user.uid}/${resumeId}_${file.name}`);
          const snapshot = await uploadBytes(storageRef, file);
          const downloadURL = await getDownloadURL(snapshot.ref);

          // Perform basic analysis
          const analysis = performBasicAnalysis(file.name);

          // Create resume document
          const newResume: ResumeFile = {
            id: resumeId,
            user_id: user.uid,
            name: file.name,
            file_url: downloadURL,
            skills: analysis.keyword_matches,
            experience_years: 0,
            education: [],
            analysis,
            is_primary: get().resumes.length === 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          // Save to Firestore - filter out undefined values
          const resumeData = Object.fromEntries(
            Object.entries(newResume).filter(([_, value]) => value !== undefined)
          );
          delete resumeData.isAnalyzing; // Don't store this field
          await setDoc(doc(db, 'resumes', resumeId), resumeData);

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
          throw error;
        }
      },

      analyzeResume: async (resumeId: string) => {
        const { resumes } = get();
        const resume = resumes.find(r => r.id === resumeId);
        if (!resume) return;

        set(state => ({
          resumes: state.resumes.map(r =>
            r.id === resumeId ? { ...r, isAnalyzing: true } : r
          )
        }));

        try {
          // Perform analysis
          const analysis = performBasicAnalysis(resume.name);

          // Update in Firestore - filter out undefined values
          const updateData = {
            ...resume,
            analysis,
            updated_at: new Date().toISOString(),
          };
          delete (updateData as any).isAnalyzing;
          const cleanData = Object.fromEntries(
            Object.entries(updateData).filter(([_, value]) => value !== undefined)
          );
          await setDoc(doc(db, 'resumes', resumeId), cleanData, { merge: true });

          set(state => ({
            resumes: state.resumes.map(r =>
              r.id === resumeId ? {
                ...r,
                analysis,
                isAnalyzing: false
              } : r
            ),
            currentResume: state.currentResume?.id === resumeId
              ? { ...state.currentResume, analysis, isAnalyzing: false }
              : state.currentResume
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

      fetchResumes: async () => {
        try {
          const user = auth.currentUser;
          if (!user) return;

          const resumesRef = collection(db, 'resumes');
          const q = query(
            resumesRef,
            where('user_id', '==', user.uid),
            orderBy('created_at', 'desc')
          );

          const snapshot = await getDocs(q);
          const resumes = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
          })) as ResumeFile[];

          set({
            resumes,
            currentResume: resumes.find(r => r.is_primary) || resumes[0],
          });
        } catch (error) {
          console.error('Error fetching resumes:', error);
        }
      },

      removeResume: async (resumeId: string) => {
        try {
          const user = auth.currentUser;
          if (!user) throw new Error('User not authenticated');

          const { resumes } = get();
          const resume = resumes.find(r => r.id === resumeId);

          if (resume) {
            // Delete from Storage
            try {
              const storageRef = ref(storage, `resumes/${user.uid}/${resumeId}_${resume.name}`);
              await deleteObject(storageRef);
            } catch (storageError) {
              console.warn('Could not delete file from storage:', storageError);
            }

            // Delete from Firestore
            await deleteDoc(doc(db, 'resumes', resumeId));
          }

          set(state => ({
            resumes: state.resumes.filter(r => r.id !== resumeId),
            currentResume: state.currentResume?.id === resumeId ? undefined : state.currentResume
          }));
        } catch (error) {
          console.error('Delete failed:', error);
          throw error;
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
