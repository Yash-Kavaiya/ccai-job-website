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
  content_text?: string;
  skills: string[];
  experience_years: number;
  education: any[];
  analysis?: ResumeAnalysis;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
  isAnalyzing?: boolean;
  storage_skipped?: boolean;
}

interface ResumeStore {
  resumes: ResumeFile[];
  currentResume?: ResumeFile;
  isUploading: boolean;
  uploadError?: string;

  uploadResume: (file: File) => Promise<void>;
  saveResumeFromText: (text: string, name?: string) => Promise<void>;
  analyzeResume: (resumeId: string, resumeText?: string) => Promise<void>;
  getMatchText: (resumeId?: string) => string;
  setCurrentResume: (resumeId: string) => void;
  removeResume: (resumeId: string) => Promise<void>;
  fetchResumes: () => Promise<void>;
  clearError: () => void;
}

function mapStorageError(error: unknown): string {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code?: string }).code)
      : '';
  const message = error instanceof Error ? error.message : String(error || 'Upload failed');

  if (code === 'storage/quota-exceeded' || message.includes('quota-exceeded') || message.includes('Quota for bucket')) {
    return 'Firebase Storage quota for this project has been exceeded. Paste your resume text below to save analysis without file upload, or raise the Storage quota (Blaze plan).';
  }
  if (code === 'storage/unauthorized' || message.includes('storage/unauthorized')) {
    return 'You do not have permission to upload to Storage. Please sign in again and retry.';
  }
  if (code === 'storage/retry-limit-exceeded') {
    return 'Upload failed after multiple retries. Check your connection and try again.';
  }
  if (code === 'storage/canceled') {
    return 'Upload was canceled.';
  }
  if (code === 'storage/invalid-checksum') {
    return 'The uploaded file was corrupted in transit. Please try again.';
  }
  return message || 'Upload failed';
}

const COMMON_KEYWORDS = [
  'python', 'javascript', 'typescript', 'react', 'node', 'aws', 'docker',
  'kubernetes', 'sql', 'git', 'agile', 'java', 'go', 'rust', 'postgres',
];
const AI_KEYWORDS = [
  'machine learning', 'ai', 'tensorflow', 'pytorch', 'nlp', 'deep learning',
  'data science', 'llm', 'langchain', 'transformers', 'computer vision', 'mlops',
];

export function performContentAnalysis(content: string): ResumeAnalysis {
  const lower = content.toLowerCase();
  const matchedKeywords = COMMON_KEYWORDS.filter((k) => lower.includes(k));
  const matchedAiKeywords = AI_KEYWORDS.filter((k) => lower.includes(k));

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const hasEmail = /[^\s@]+@[^\s@]+\.[^\s@]+/.test(content);
  const hasPhone = /\+?\d[\d\s().-]{7,}\d/.test(content);
  const hasExperience = /experience|worked|engineer|developer|intern/i.test(content);
  const hasEducation = /university|college|bachelor|master|phd|b\.?s\.?|m\.?s\.?/i.test(content);

  let formatScore = 55;
  if (wordCount > 150) formatScore += 10;
  if (hasEmail) formatScore += 10;
  if (hasPhone) formatScore += 5;
  if (hasExperience) formatScore += 10;
  if (hasEducation) formatScore += 10;
  formatScore = Math.min(95, formatScore);

  const keywordBonus = matchedKeywords.length * 4;
  const aiBonus = matchedAiKeywords.length * 5;
  const atsScore = Math.min(95, 50 + keywordBonus + aiBonus + (hasExperience ? 5 : 0));

  const strengths: string[] = [];
  if (matchedKeywords.length) strengths.push(`Technical keywords found: ${matchedKeywords.slice(0, 5).join(', ')}`);
  if (matchedAiKeywords.length) strengths.push(`AI/ML signals: ${matchedAiKeywords.slice(0, 4).join(', ')}`);
  if (hasExperience) strengths.push('Experience section detected');
  if (!strengths.length) strengths.push('Resume content saved for matching');

  const weaknesses: string[] = [];
  if (!matchedAiKeywords.length) weaknesses.push('Add AI/ML keywords relevant to target roles');
  if (!hasEducation) weaknesses.push('Consider adding an education section');
  if (wordCount < 120) weaknesses.push('Resume looks short — expand with quantified achievements');

  return {
    ats_score: atsScore,
    keyword_matches: [...matchedKeywords, ...matchedAiKeywords],
    missing_keywords: COMMON_KEYWORDS.filter((k) => !matchedKeywords.includes(k)).slice(0, 5),
    suggestions: [
      'Mirror keywords from target job descriptions',
      'Include quantifiable achievements',
      'Use clear section headers (Experience, Skills, Education)',
      'Keep formatting consistent for ATS parsers',
    ],
    strengths,
    weaknesses,
    analyzed_at: new Date().toISOString(),
    formatScore,
    readabilityScore: Math.min(95, 60 + Math.min(30, Math.floor(wordCount / 40))),
    aiSpecificKeywords: matchedAiKeywords,
  };
}

async function persistResume(resume: ResumeFile) {
  const resumeData = Object.fromEntries(
    Object.entries(resume).filter(([, value]) => value !== undefined)
  );
  delete resumeData.isAnalyzing;
  await setDoc(doc(db, 'resumes', resume.id), resumeData);
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

          const resumeId = `${user.uid}_${Date.now()}`;
          let contentText = '';
          if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
            contentText = await file.text();
          }

          let downloadURL = '';
          let storageSkipped = false;

          try {
            const storageRef = ref(storage, `resumes/${user.uid}/${resumeId}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            downloadURL = await getDownloadURL(snapshot.ref);
          } catch (storageError) {
            const friendly = mapStorageError(storageError);
            if (contentText.trim().length >= 40) {
              // TXT (or readable text) can still be saved without Storage
              storageSkipped = true;
              downloadURL = '';
              set({ uploadError: friendly });
            } else {
              throw new Error(friendly);
            }
          }

          const analysisSource = contentText.trim() || file.name;
          const analysis = performContentAnalysis(analysisSource);

          const newResume: ResumeFile = {
            id: resumeId,
            user_id: user.uid,
            name: file.name,
            file_url: downloadURL,
            content_text: contentText || undefined,
            skills: analysis.keyword_matches,
            experience_years: 0,
            education: [],
            analysis,
            is_primary: get().resumes.length === 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            storage_skipped: storageSkipped || undefined,
          };

          await persistResume(newResume);

          set((state) => ({
            resumes: [...state.resumes, newResume],
            currentResume: newResume,
            isUploading: false,
          }));
        } catch (error) {
          console.error('Upload error:', error);
          const friendly = error instanceof Error ? error.message : mapStorageError(error);
          set({
            isUploading: false,
            uploadError: friendly,
          });
          throw new Error(friendly);
        }
      },

      saveResumeFromText: async (text: string, name = 'pasted-resume.txt') => {
        set({ isUploading: true, uploadError: undefined });
        try {
          const user = auth.currentUser;
          if (!user) throw new Error('User not authenticated');

          const trimmed = text.trim();
          if (trimmed.length < 40) {
            throw new Error('Please paste at least a short resume (40+ characters).');
          }

          const resumeId = `${user.uid}_${Date.now()}`;
          const analysis = performContentAnalysis(trimmed);
          const newResume: ResumeFile = {
            id: resumeId,
            user_id: user.uid,
            name,
            file_url: '',
            content_text: trimmed,
            skills: analysis.keyword_matches,
            experience_years: 0,
            education: [],
            analysis,
            is_primary: get().resumes.length === 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            storage_skipped: true,
          };

          await persistResume(newResume);

          set((state) => ({
            resumes: [...state.resumes, newResume],
            currentResume: newResume,
            isUploading: false,
            uploadError: undefined,
          }));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to save resume text';
          set({ isUploading: false, uploadError: message });
          throw new Error(message);
        }
      },

      analyzeResume: async (resumeId: string, resumeText?: string) => {
        const { resumes } = get();
        const resume = resumes.find((r) => r.id === resumeId);
        if (!resume) return;

        set((state) => ({
          resumes: state.resumes.map((r) =>
            r.id === resumeId ? { ...r, isAnalyzing: true } : r
          ),
        }));

        try {
          const source = resumeText || resume.content_text || resume.name;
          const analysis = performContentAnalysis(source);

          const updateData: ResumeFile = {
            ...resume,
            analysis,
            skills: analysis.keyword_matches,
            content_text: resumeText || resume.content_text,
            updated_at: new Date().toISOString(),
          };
          delete (updateData as { isAnalyzing?: boolean }).isAnalyzing;
          await persistResume(updateData);

          set((state) => ({
            resumes: state.resumes.map((r) =>
              r.id === resumeId
                ? { ...r, analysis, skills: analysis.keyword_matches, content_text: updateData.content_text, isAnalyzing: false }
                : r
            ),
            currentResume:
              state.currentResume?.id === resumeId
                ? {
                    ...state.currentResume,
                    analysis,
                    skills: analysis.keyword_matches,
                    content_text: updateData.content_text,
                    isAnalyzing: false,
                  }
                : state.currentResume,
          }));
        } catch (error) {
          console.error('Analysis failed:', error);
          set((state) => ({
            resumes: state.resumes.map((r) =>
              r.id === resumeId ? { ...r, isAnalyzing: false } : r
            ),
          }));
        }
      },

      getMatchText: (resumeId?: string) => {
        const { resumes, currentResume } = get();
        const resume = resumeId
          ? resumes.find((r) => r.id === resumeId)
          : currentResume || resumes[0];
        if (!resume) return '';
        if (resume.content_text?.trim()) return resume.content_text;
        if (resume.skills?.length) {
          return `${resume.name}\nSkills: ${resume.skills.join(', ')}`;
        }
        return resume.name;
      },

      setCurrentResume: (resumeId: string) => {
        const { resumes } = get();
        const resume = resumes.find((r) => r.id === resumeId);
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
          const resumes = snapshot.docs.map((docSnap) => ({
            ...docSnap.data(),
            id: docSnap.id,
          })) as ResumeFile[];

          set({
            resumes,
            currentResume: resumes.find((r) => r.is_primary) || resumes[0],
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
          const resume = resumes.find((r) => r.id === resumeId);

          if (resume) {
            if (resume.file_url) {
              try {
                const storageRef = ref(storage, `resumes/${user.uid}/${resumeId}_${resume.name}`);
                await deleteObject(storageRef);
              } catch (storageError) {
                console.warn('Could not delete file from storage:', storageError);
              }
            }
            await deleteDoc(doc(db, 'resumes', resumeId));
          }

          set((state) => ({
            resumes: state.resumes.filter((r) => r.id !== resumeId),
            currentResume:
              state.currentResume?.id === resumeId ? undefined : state.currentResume,
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
