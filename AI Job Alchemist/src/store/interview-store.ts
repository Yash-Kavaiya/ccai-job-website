import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { InterviewQuestion } from '@/data/interview-questions';

export interface InterviewMessage {
  id: string;
  role: 'interviewer' | 'candidate';
  content: string;
  timestamp: Date;
  audioUrl?: string;
  isTyping?: boolean;
  questionId?: string;
  responseTime?: number; // in seconds
}

export interface InterviewMetrics {
  averageResponseTime: number;
  totalQuestions: number;
  questionsAnswered: number;
  conversationQuality: number; // 0-100
  technicalAccuracy: number; // 0-100
  communicationClarity: number; // 0-100
}

export interface InterviewSession {
  id: string;
  role: string;
  company: string;
  difficulty: 'entry' | 'mid' | 'senior' | 'principal';
  startTime: Date;
  endTime?: Date;
  status: 'setup' | 'active' | 'paused' | 'completed';
  messages: InterviewMessage[];
  currentQuestion?: InterviewQuestion;
  askedQuestionIds: string[];
  scores: {
    technical: number;
    communication: number;
    problemSolving: number;
    behavioral: number;
    overall: number;
  };
  feedback: {
    strengths: string[];
    improvements: string[];
    suggestions: string[];
  };
  metrics: InterviewMetrics;
  settings: {
    voiceEnabled: boolean;
    autoPlay: boolean;
    difficulty: string;
    duration: number; // in minutes
  };
}

export interface InterviewHistory {
  sessions: InterviewSession[];
  totalInterviews: number;
  averageScore: number;
  improvementTrend: number; // percentage change from last interview
}

interface InterviewStore {
  currentSession: InterviewSession | null;
  history: InterviewHistory;
  isRecording: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  lastTranscription: string;
  
  // Actions
  createSession: (config: {
    role: string;
    company: string;
    difficulty: 'entry' | 'mid' | 'senior' | 'principal';
    voiceEnabled: boolean;
  }) => InterviewSession;
  
  startSession: (sessionId: string) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  endSession: () => void;
  
  addMessage: (message: Omit<InterviewMessage, 'id' | 'timestamp'>) => void;
  updateMessage: (messageId: string, updates: Partial<InterviewMessage>) => void;
  
  setCurrentQuestion: (question: InterviewQuestion) => void;
  markQuestionAsked: (questionId: string) => void;
  
  updateScores: (scores: Partial<InterviewSession['scores']>) => void;
  updateFeedback: (feedback: Partial<InterviewSession['feedback']>) => void;
  updateMetrics: (metrics: Partial<InterviewMetrics>) => void;
  
  setRecording: (recording: boolean) => void;
  setPlaying: (playing: boolean) => void;
  setLoading: (loading: boolean) => void;
  setLastTranscription: (text: string) => void;
  
  // History management
  saveSession: (session: InterviewSession) => void;
  getSessionById: (id: string) => InterviewSession | null;
  calculateProgress: () => { improvement: number; trend: string };
  
  // Reset
  reset: () => void;
}

const initialHistory: InterviewHistory = {
  sessions: [],
  totalInterviews: 0,
  averageScore: 0,
  improvementTrend: 0,
};

export const useInterviewStore = create<InterviewStore>()(
  persist(
    (set, get) => ({
      currentSession: null,
      history: initialHistory,
      isRecording: false,
      isPlaying: false,
      isLoading: false,
      lastTranscription: '',

      createSession: (config) => {
        const session: InterviewSession = {
          id: `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          role: config.role,
          company: config.company,
          difficulty: config.difficulty,
          startTime: new Date(),
          status: 'setup',
          messages: [],
          askedQuestionIds: [],
          scores: {
            technical: 0,
            communication: 0,
            problemSolving: 0,
            behavioral: 0,
            overall: 0,
          },
          feedback: {
            strengths: [],
            improvements: [],
            suggestions: [],
          },
          metrics: {
            averageResponseTime: 0,
            totalQuestions: 0,
            questionsAnswered: 0,
            conversationQuality: 0,
            technicalAccuracy: 0,
            communicationClarity: 0,
          },
          settings: {
            voiceEnabled: config.voiceEnabled,
            autoPlay: true,
            difficulty: config.difficulty,
            duration: 30, // default 30 minutes
          },
        };

        set({ currentSession: session });
        return session;
      },

      startSession: (sessionId: string) => {
        set((state) => {
          if (state.currentSession?.id === sessionId) {
            return {
              currentSession: {
                ...state.currentSession,
                status: 'active',
                startTime: new Date(),
              },
            };
          }
          return state;
        });
      },

      pauseSession: () => {
        set((state) => {
          if (state.currentSession) {
            return {
              currentSession: {
                ...state.currentSession,
                status: 'paused',
              },
            };
          }
          return state;
        });
      },

      resumeSession: () => {
        set((state) => {
          if (state.currentSession) {
            return {
              currentSession: {
                ...state.currentSession,
                status: 'active',
              },
            };
          }
          return state;
        });
      },

      endSession: () => {
        set((state) => {
          if (state.currentSession) {
            const completedSession = {
              ...state.currentSession,
              status: 'completed' as const,
              endTime: new Date(),
            };

            // Calculate final metrics
            const messages = completedSession.messages;
            const candidateMessages = messages.filter(m => m.role === 'candidate');
            const avgResponseTime = candidateMessages.reduce((acc, m) => acc + (m.responseTime || 0), 0) / candidateMessages.length || 0;

            const updatedSession = {
              ...completedSession,
              metrics: {
                ...completedSession.metrics,
                averageResponseTime: avgResponseTime,
                questionsAnswered: candidateMessages.length,
              },
            };

            // Save to history
            const newHistory = {
              ...state.history,
              sessions: [updatedSession, ...state.history.sessions],
              totalInterviews: state.history.totalInterviews + 1,
            };

            // Calculate average score
            const totalScore = newHistory.sessions.reduce((acc, s) => acc + s.scores.overall, 0);
            newHistory.averageScore = totalScore / newHistory.sessions.length;

            // Calculate improvement trend
            if (newHistory.sessions.length >= 2) {
              const currentScore = newHistory.sessions[0].scores.overall;
              const previousScore = newHistory.sessions[1].scores.overall;
              newHistory.improvementTrend = ((currentScore - previousScore) / previousScore) * 100;
            }

            return {
              currentSession: updatedSession,
              history: newHistory,
            };
          }
          return state;
        });
      },

      addMessage: (message) => {
        const newMessage: InterviewMessage = {
          ...message,
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
        };

        set((state) => {
          if (state.currentSession) {
            return {
              currentSession: {
                ...state.currentSession,
                messages: [...state.currentSession.messages, newMessage],
              },
            };
          }
          return state;
        });
      },

      updateMessage: (messageId, updates) => {
        set((state) => {
          if (state.currentSession) {
            return {
              currentSession: {
                ...state.currentSession,
                messages: state.currentSession.messages.map(m =>
                  m.id === messageId ? { ...m, ...updates } : m
                ),
              },
            };
          }
          return state;
        });
      },

      setCurrentQuestion: (question) => {
        set((state) => {
          if (state.currentSession) {
            return {
              currentSession: {
                ...state.currentSession,
                currentQuestion: question,
              },
            };
          }
          return state;
        });
      },

      markQuestionAsked: (questionId) => {
        set((state) => {
          if (state.currentSession) {
            return {
              currentSession: {
                ...state.currentSession,
                askedQuestionIds: [...state.currentSession.askedQuestionIds, questionId],
              },
            };
          }
          return state;
        });
      },

      updateScores: (scores) => {
        set((state) => {
          if (state.currentSession) {
            const newScores = { ...state.currentSession.scores, ...scores };
            return {
              currentSession: {
                ...state.currentSession,
                scores: newScores,
              },
            };
          }
          return state;
        });
      },

      updateFeedback: (feedback) => {
        set((state) => {
          if (state.currentSession) {
            return {
              currentSession: {
                ...state.currentSession,
                feedback: {
                  ...state.currentSession.feedback,
                  ...feedback,
                },
              },
            };
          }
          return state;
        });
      },

      updateMetrics: (metrics) => {
        set((state) => {
          if (state.currentSession) {
            return {
              currentSession: {
                ...state.currentSession,
                metrics: {
                  ...state.currentSession.metrics,
                  ...metrics,
                },
              },
            };
          }
          return state;
        });
      },

      setRecording: (recording) => set({ isRecording: recording }),
      setPlaying: (playing) => set({ isPlaying: playing }),
      setLoading: (loading) => set({ isLoading: loading }),
      setLastTranscription: (text) => set({ lastTranscription: text }),

      saveSession: (session) => {
        set((state) => ({
          history: {
            ...state.history,
            sessions: [session, ...state.history.sessions.filter(s => s.id !== session.id)],
          },
        }));
      },

      getSessionById: (id) => {
        const state = get();
        return state.history.sessions.find(s => s.id === id) || null;
      },

      calculateProgress: () => {
        const state = get();
        const sessions = state.history.sessions;
        
        if (sessions.length < 2) {
          return { improvement: 0, trend: 'neutral' };
        }

        const recent = sessions.slice(0, 3);
        const older = sessions.slice(3, 6);

        const recentAvg = recent.reduce((acc, s) => acc + s.scores.overall, 0) / recent.length;
        const olderAvg = older.length > 0 ? older.reduce((acc, s) => acc + s.scores.overall, 0) / older.length : recentAvg;

        const improvement = ((recentAvg - olderAvg) / olderAvg) * 100;
        
        return {
          improvement,
          trend: improvement > 5 ? 'improving' : improvement < -5 ? 'declining' : 'stable',
        };
      },

      reset: () => {
        set({
          currentSession: null,
          isRecording: false,
          isPlaying: false,
          isLoading: false,
          lastTranscription: '',
        });
      },
    }),
    {
      name: 'interview-store',
      partialize: (state) => ({
        history: state.history,
      }),
    }
  )
);