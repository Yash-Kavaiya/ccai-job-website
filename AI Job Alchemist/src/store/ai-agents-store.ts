import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DevvAI, OpenRouterAI, table, email, elevenlabs } from '@devvai/devv-code-backend';
import { useAuthStore } from './auth-store';
import { useResumeStore } from './resume-store';
import { useJobMatchingStore } from './job-matching-store';

// AI Agent Types
export interface AIAgent {
  id: string;
  name: string;
  type: 'career-coach' | 'trend-analyzer' | 'networking-suggester' | 'auto-resume-builder' | 'chatbot';
  description: string;
  isActive: boolean;
  lastRun?: number;
  config: AgentConfig;
  metrics: AgentMetrics;
}

export interface AgentConfig {
  runInterval?: number; // minutes
  emailNotifications?: boolean;
  maxActions?: number;
  thresholds?: Record<string, number>;
  preferences?: Record<string, any>;
}

export interface AgentMetrics {
  totalRuns: number;
  successfulRuns: number;
  lastSuccessTime?: number;
  averageRunTime: number;
  actionsGenerated: number;
  userEngagement: number;
}

export interface AgentAction {
  id: string;
  agentId: string;
  type: 'job-suggestion' | 'skill-recommendation' | 'networking-connection' | 'resume-improvement' | 'trend-alert';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed' | 'dismissed';
  data: Record<string, any>;
  createdAt: number;
  expiresAt?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: {
    model?: string;
    tokens?: number;
    processingTime?: number;
  };
}

export interface TrendAnalysis {
  id: string;
  category: string;
  trend: string;
  impact: 'positive' | 'negative' | 'neutral';
  confidence: number;
  sources: string[];
  recommendations: string[];
  detectedAt: number;
}

export interface ScheduledEmail {
  id: string;
  type: 'daily-digest' | 'weekly-report' | 'trend-alert' | 'job-notification' | 'skill-reminder' | 'networking-prompt' | 'career-milestone';
  recipientEmail: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  scheduledFor: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  metadata: Record<string, any>;
  createdAt: number;
}

export interface EmailMetrics {
  totalSent: number;
  dailyDigestsSent: number;
  weeklyReportsSent: number;
  trendAlertsSent: number;
  jobNotificationsSent: number;
  openRate: number;
  clickRate: number;
  lastEmailSent: number;
}

export interface NetworkingSuggestion {
  id: string;
  platform: 'linkedin' | 'twitter' | 'github' | 'company-website';
  profileUrl: string;
  name: string;
  title: string;
  company: string;
  connectionReason: string;
  matchScore: number;
  commonSkills: string[];
  mutualConnections?: number;
}

export interface AIAgentsState {
  // Agent Management
  agents: AIAgent[];
  activeAgents: string[];

  // Agent Actions
  actions: AgentAction[];
  pendingActions: AgentAction[];
  completedActions: AgentAction[];

  // Chatbot
  chatSessions: ChatSession[];
  currentChatSession: ChatSession | null;
  isTyping: boolean;

  // Trend Analysis
  trends: TrendAnalysis[];
  trendAlerts: TrendAnalysis[];

  // Networking
  networkingSuggestions: NetworkingSuggestion[];

  // Auto Resume Builder
  resumeTemplates: any[];
  generatedResumes: any[];

  // Career Coaching
  careerGoals: string[];
  progressMetrics: Record<string, number>;
  coachingInsights: string[];

  // Agent Activity
  agentLogs: any[];
  isProcessing: boolean;
  lastUpdate: number;

  // Settings
  notificationSettings: {
    email: boolean;
    dailyDigest: boolean;
    weeklyReport: boolean;
    trendAlerts: boolean;
    jobSuggestions: boolean;
    skillRecommendations: boolean;
    networkingReminders: boolean;
    careerMilestones: boolean;
    urgentAlerts: boolean;
    digestTime: string; // 'morning' | 'evening'
    frequency: 'daily' | 'weekly' | 'biweekly';
  };

  // Email Scheduling
  emailScheduler: {
    lastDailyDigest: number;
    lastWeeklyReport: number;
    lastTrendAlert: number;
    lastJobAlert: number;
    pendingEmails: ScheduledEmail[];
    emailMetrics: EmailMetrics;
  };
}

export interface AIAgentsActions {
  // Agent Management
  initializeAgents: () => Promise<void>;
  activateAgent: (agentId: string) => Promise<void>;
  deactivateAgent: (agentId: string) => Promise<void>;
  updateAgentConfig: (agentId: string, config: Partial<AgentConfig>) => void;
  runAgent: (agentId: string) => Promise<void>;
  runAllActiveAgents: () => Promise<void>;

  // Actions Management
  createAction: (action: Omit<AgentAction, 'id'>) => void;
  updateActionStatus: (actionId: string, status: AgentAction['status']) => void;
  dismissAction: (actionId: string) => void;
  completeAction: (actionId: string) => void;

  // Chatbot
  startChatSession: (title?: string) => ChatSession;
  sendMessage: (content: string, sessionId?: string) => Promise<void>;
  getAIResponse: (messages: ChatMessage[], context?: any) => Promise<string>;
  endChatSession: (sessionId: string) => void;
  clearTyping: () => void;

  // Career Coach Agent
  generateCareerAdvice: () => Promise<void>;
  analyzeCareerProgress: () => Promise<void>;
  suggestJobOpportunities: () => Promise<void>;
  sendDailyCareerDigest: () => Promise<void>;

  // Trend Analyzer Agent
  analyzeTrends: () => Promise<void>;
  detectEmergingSkills: () => Promise<void>;
  generateTrendAlerts: () => Promise<void>;

  // Networking Suggester Agent
  analyzeNetworkingOpportunities: () => Promise<void>;
  generateConnectionSuggestions: () => Promise<void>;
  sendNetworkingReminders: () => Promise<void>;

  // Auto Resume Builder Agent
  generateTailoredResume: (jobDescription: string) => Promise<void>;
  optimizeResumeForATS: (resumeId: string) => Promise<void>;
  createResumeVariations: () => Promise<void>;

  // Email Notification Functions
  scheduleEmail: (email: Omit<ScheduledEmail, 'id' | 'createdAt'>) => void;
  sendScheduledEmails: () => Promise<void>;
  sendImmediateNotification: (type: ScheduledEmail['type'], data: any) => Promise<void>;
  sendWeeklyCareerReport: () => Promise<void>;
  sendTrendAlert: (trend: TrendAnalysis) => Promise<void>;
  sendJobOpportunityAlert: (jobs: any[]) => Promise<void>;
  sendSkillDevelopmentReminder: (skills: string[]) => Promise<void>;
  sendNetworkingPrompt: (suggestions: NetworkingSuggestion[]) => Promise<void>;
  sendCareerMilestoneEmail: (milestone: string, achievement: any) => Promise<void>;

  // Utilities
  updateSettings: (settings: Partial<AIAgentsState['notificationSettings']>) => void;
  clearActions: () => void;
  exportAgentData: () => any;
  importAgentData: (data: any) => void;
}

const defaultAgents: AIAgent[] = [
  {
    id: 'career-coach',
    name: 'Career Coach',
    type: 'career-coach',
    description: 'Monitors your career progress and provides personalized guidance, job suggestions, and daily insights.',
    isActive: true,
    config: {
      runInterval: 360, // 6 hours
      emailNotifications: true,
      maxActions: 5,
      thresholds: { minScore: 0.7, maxDailySuggestions: 3 }
    },
    metrics: {
      totalRuns: 0,
      successfulRuns: 0,
      averageRunTime: 0,
      actionsGenerated: 0,
      userEngagement: 0
    }
  },
  {
    id: 'trend-analyzer',
    name: 'Trend Analyzer',
    type: 'trend-analyzer',
    description: 'Scans industry sources for emerging AI trends, new technologies, and skill demands.',
    isActive: true,
    config: {
      runInterval: 720, // 12 hours
      emailNotifications: true,
      maxActions: 3,
      thresholds: { confidenceThreshold: 0.8 }
    },
    metrics: {
      totalRuns: 0,
      successfulRuns: 0,
      averageRunTime: 0,
      actionsGenerated: 0,
      userEngagement: 0
    }
  },
  {
    id: 'networking-suggester',
    name: 'Networking Assistant',
    type: 'networking-suggester',
    description: 'Identifies networking opportunities and suggests connections at top AI companies.',
    isActive: false,
    config: {
      runInterval: 1440, // 24 hours
      emailNotifications: false,
      maxActions: 10,
      thresholds: { matchScore: 0.6 }
    },
    metrics: {
      totalRuns: 0,
      successfulRuns: 0,
      averageRunTime: 0,
      actionsGenerated: 0,
      userEngagement: 0
    }
  },
  {
    id: 'auto-resume-builder',
    name: 'Resume Builder',
    type: 'auto-resume-builder',
    description: 'Automatically generates tailored resumes for specific job applications and optimizes for ATS.',
    isActive: false,
    config: {
      runInterval: 0, // On-demand only
      emailNotifications: false,
      maxActions: 1
    },
    metrics: {
      totalRuns: 0,
      successfulRuns: 0,
      averageRunTime: 0,
      actionsGenerated: 0,
      userEngagement: 0
    }
  },
  {
    id: 'chatbot',
    name: 'AI Assistant',
    type: 'chatbot',
    description: 'Site-wide intelligent assistant for answering questions and providing guidance.',
    isActive: true,
    config: {
      runInterval: 0, // Real-time
      emailNotifications: false,
      maxActions: 0
    },
    metrics: {
      totalRuns: 0,
      successfulRuns: 0,
      averageRunTime: 0,
      actionsGenerated: 0,
      userEngagement: 0
    }
  }
];

export const useAIAgentsStore = create<AIAgentsState & AIAgentsActions>()(
  persist(
    (set, get) => ({
      // Initial State
      agents: defaultAgents,
      activeAgents: ['career-coach', 'trend-analyzer', 'chatbot'],
      actions: [],
      pendingActions: [],
      completedActions: [],
      chatSessions: [],
      currentChatSession: null,
      isTyping: false,
      trends: [],
      trendAlerts: [],
      networkingSuggestions: [],
      resumeTemplates: [],
      generatedResumes: [],
      careerGoals: [],
      progressMetrics: {},
      coachingInsights: [],
      agentLogs: [],
      isProcessing: false,
      lastUpdate: Date.now(),
      notificationSettings: {
        email: true,
        dailyDigest: true,
        weeklyReport: true,
        trendAlerts: true,
        jobSuggestions: true,
        skillRecommendations: true,
        networkingReminders: true,
        careerMilestones: true,
        urgentAlerts: true,
        digestTime: 'morning',
        frequency: 'daily'
      },

      emailScheduler: {
        lastDailyDigest: 0,
        lastWeeklyReport: 0,
        lastTrendAlert: 0,
        lastJobAlert: 0,
        pendingEmails: [],
        emailMetrics: {
          totalSent: 0,
          dailyDigestsSent: 0,
          weeklyReportsSent: 0,
          trendAlertsSent: 0,
          jobNotificationsSent: 0,
          openRate: 0,
          clickRate: 0,
          lastEmailSent: 0
        }
      },

      // Agent Management
      initializeAgents: async () => {
        const state = get();
        if (state.agents.length === 0) {
          set({ agents: defaultAgents });
        }

        // Start periodic agent runs
        state.activeAgents.forEach(agentId => {
          const agent = state.agents.find(a => a.id === agentId);
          if (agent && agent.config.runInterval && agent.config.runInterval > 0) {
            setInterval(() => {
              get().runAgent(agentId);
            }, agent.config.runInterval * 60 * 1000);
          }
        });
      },

      activateAgent: async (agentId: string) => {
        const state = get();
        const agent = state.agents.find(a => a.id === agentId);
        if (!agent) return;

        set({
          agents: state.agents.map(a =>
            a.id === agentId ? { ...a, isActive: true } : a
          ),
          activeAgents: [...state.activeAgents, agentId].filter((id, index, arr) =>
            arr.indexOf(id) === index
          )
        });

        // Initial run for the activated agent
        await get().runAgent(agentId);
      },

      deactivateAgent: async (agentId: string) => {
        const state = get();
        set({
          agents: state.agents.map(a =>
            a.id === agentId ? { ...a, isActive: false } : a
          ),
          activeAgents: state.activeAgents.filter(id => id !== agentId)
        });
      },

      updateAgentConfig: (agentId: string, config: Partial<AgentConfig>) => {
        const state = get();
        set({
          agents: state.agents.map(agent =>
            agent.id === agentId
              ? { ...agent, config: { ...agent.config, ...config } }
              : agent
          )
        });
      },

      runAgent: async (agentId: string) => {
        const state = get();
        const agent = state.agents.find(a => a.id === agentId);
        if (!agent || !agent.isActive) return;

        const startTime = Date.now();
        set({ isProcessing: true });

        try {
          switch (agent.type) {
            case 'career-coach':
              await get().generateCareerAdvice();
              await get().analyzeCareerProgress();
              await get().suggestJobOpportunities();
              break;
            case 'trend-analyzer':
              await get().analyzeTrends();
              await get().detectEmergingSkills();
              break;
            case 'networking-suggester':
              await get().analyzeNetworkingOpportunities();
              await get().generateConnectionSuggestions();
              break;
            case 'auto-resume-builder':
              await get().createResumeVariations();
              break;
          }

          // Update agent metrics
          const runTime = Date.now() - startTime;
          set({
            agents: state.agents.map(a =>
              a.id === agentId
                ? {
                  ...a,
                  lastRun: Date.now(),
                  metrics: {
                    ...a.metrics,
                    totalRuns: a.metrics.totalRuns + 1,
                    successfulRuns: a.metrics.successfulRuns + 1,
                    lastSuccessTime: Date.now(),
                    averageRunTime: (a.metrics.averageRunTime + runTime) / 2
                  }
                }
                : a
            )
          });

        } catch (error) {
          console.error(`Agent ${agentId} run failed:`, error);
        } finally {
          set({ isProcessing: false, lastUpdate: Date.now() });
        }
      },

      runAllActiveAgents: async () => {
        const state = get();
        for (const agentId of state.activeAgents) {
          await get().runAgent(agentId);
        }
      },

      // Action Management
      createAction: (action: Omit<AgentAction, 'id'>) => {
        const state = get();
        const newAction: AgentAction = {
          ...action,
          id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };

        set({
          actions: [...state.actions, newAction],
          pendingActions: [...state.pendingActions, newAction]
        });

        // Update agent metrics
        const agent = state.agents.find(a => a.id === action.agentId);
        if (agent) {
          set({
            agents: state.agents.map(a =>
              a.id === action.agentId
                ? {
                  ...a,
                  metrics: {
                    ...a.metrics,
                    actionsGenerated: a.metrics.actionsGenerated + 1
                  }
                }
                : a
            )
          });
        }
      },

      updateActionStatus: (actionId: string, status: AgentAction['status']) => {
        const state = get();
        set({
          actions: state.actions.map(action =>
            action.id === actionId ? { ...action, status } : action
          ),
          pendingActions: state.pendingActions.filter(a =>
            a.id !== actionId || status === 'pending'
          ),
          completedActions: status === 'completed'
            ? [...state.completedActions, state.actions.find(a => a.id === actionId)!]
            : state.completedActions.filter(a => a.id !== actionId)
        });
      },

      dismissAction: (actionId: string) => {
        get().updateActionStatus(actionId, 'dismissed');
      },

      completeAction: (actionId: string) => {
        get().updateActionStatus(actionId, 'completed');
      },

      // Chatbot Implementation
      startChatSession: (title?: string) => {
        const state = get();
        const session: ChatSession = {
          id: `chat-${Date.now()}`,
          title: title || `Chat ${state.chatSessions.length + 1}`,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isActive: true
        };

        set({
          chatSessions: [...state.chatSessions, session],
          currentChatSession: session
        });

        return session;
      },

      sendMessage: async (content: string, sessionId?: string) => {
        const state = get();
        const session = sessionId
          ? state.chatSessions.find(s => s.id === sessionId)
          : state.currentChatSession;

        if (!session) return;

        const userMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          role: 'user',
          content,
          timestamp: Date.now()
        };

        // Add user message
        set({
          chatSessions: state.chatSessions.map(s =>
            s.id === session.id
              ? { ...s, messages: [...s.messages, userMessage], updatedAt: Date.now() }
              : s
          ),
          isTyping: true
        });

        // Get AI response
        try {
          const updatedSession = get().chatSessions.find(s => s.id === session.id)!;
          const response = await get().getAIResponse(updatedSession.messages);

          const assistantMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: response,
            timestamp: Date.now()
          };

          set({
            chatSessions: get().chatSessions.map(s =>
              s.id === session.id
                ? { ...s, messages: [...s.messages, assistantMessage], updatedAt: Date.now() }
                : s
            ),
            isTyping: false
          });

        } catch (error) {
          console.error('Failed to get AI response:', error);
          set({ isTyping: false });
        }
      },

      getAIResponse: async (messages: ChatMessage[], context?: any) => {
        try {
          const ai = new OpenRouterAI();

          // Build context-aware system message
          const authStore = useAuthStore.getState();
          const resumeStore = useResumeStore.getState();
          const jobStore = useJobMatchingStore.getState();

          const systemMessage = `You are an AI career assistant for AIJobHub, specializing in AI and tech careers. 

CONTEXT:
- User: ${authStore.user?.name || 'User'} (${authStore.user?.email || 'unknown'})
- Profile: ${resumeStore.currentResume ? 'Has resume uploaded' : 'No resume yet'}
- Job Matches: ${jobStore.matches.length} potential matches found
- Recent Activity: ${jobStore.searchHistory.slice(-3).join(', ')}

CAPABILITIES:
- Career guidance and AI industry insights
- Resume and job application advice  
- Interview preparation and tips
- Skill development recommendations
- Networking strategies for AI professionals
- Industry trend analysis and predictions

PERSONALITY: Professional, knowledgeable, encouraging, and focused on actionable advice.
RESPONSE STYLE: Concise but comprehensive, use bullet points for lists, include specific examples when relevant.`;

          const response = await ai.chat.completions.create({
            model: 'anthropic/claude-3-sonnet',
            messages: [
              { role: 'system', content: systemMessage },
              ...messages.map(msg => ({
                role: msg.role as any,
                content: msg.content
              }))
            ],
            temperature: 0.7,
            max_tokens: 800
          });

          return response.choices[0].message.content || 'I apologize, but I encountered an issue generating a response. Please try again.';

        } catch (error) {
          console.error('AI response error:', error);
          return 'I apologize, but I\'m currently experiencing technical difficulties. Please try again in a moment, or contact support if the issue persists.';
        }
      },

      endChatSession: (sessionId: string) => {
        const state = get();
        set({
          chatSessions: state.chatSessions.map(s =>
            s.id === sessionId ? { ...s, isActive: false } : s
          ),
          currentChatSession: state.currentChatSession?.id === sessionId ? null : state.currentChatSession
        });
      },

      clearTyping: () => {
        set({ isTyping: false });
      },

      // Career Coach Agent Implementation
      generateCareerAdvice: async () => {
        try {
          const authStore = useAuthStore.getState();
          const resumeStore = useResumeStore.getState();
          const jobStore = useJobMatchingStore.getState();

          if (!authStore.isAuthenticated) return;

          const ai = new OpenRouterAI();

          const prompt = `Based on the user's profile data, generate 3-5 personalized career advancement recommendations:

USER PROFILE:
- Resume Status: ${resumeStore.currentResume ? 'Uploaded and analyzed' : 'Not uploaded'}
- Job Matches: ${jobStore.matches.length} potential opportunities found
- Recent Searches: ${jobStore.searchHistory.slice(-5).join(', ')}
- Application Status: ${jobStore.matches.filter(m => m.application_status === 'applied').length} applications tracked

Generate specific, actionable advice for advancing in AI careers. Focus on:
1. Skill development opportunities
2. Career progression strategies
3. Networking recommendations
4. Industry positioning advice
5. Immediate next steps

Format as JSON with: { "insights": ["insight1", "insight2", ...] }`;

          const response = await ai.chat.completions.create({
            model: 'anthropic/claude-3-sonnet',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 600
          });

          const result = JSON.parse(response.choices[0].message.content || '{"insights": []}');

          set({
            coachingInsights: result.insights || []
          });

          // Create action for user
          get().createAction({
            agentId: 'career-coach',
            type: 'skill-recommendation',
            title: 'New Career Insights Available',
            description: `I've analyzed your profile and generated ${result.insights.length} personalized recommendations for your AI career growth.`,
            priority: 'medium',
            status: 'pending',
            data: { insights: result.insights },
            createdAt: Date.now()
          });

          // Send immediate notification for high-priority insights
          if (result.insights.length >= 3) {
            await get().sendImmediateNotification('skill-reminder', { skills: result.insights.slice(0, 3) });
          }

        } catch (error) {
          console.error('Career advice generation failed:', error);
        }
      },

      analyzeCareerProgress: async () => {
        try {
          const resumeStore = useResumeStore.getState();
          const jobStore = useJobMatchingStore.getState();

          const metrics = {
            profileCompleteness: resumeStore.currentResume ? 85 : 20,
            jobMatchQuality: jobStore.matches.length > 0
              ? jobStore.matches.reduce((acc, m) => acc + m.similarity_score, 0) / jobStore.matches.length * 100
              : 0,
            applicationProgress: Math.min(jobStore.matches.filter(m => m.application_status === 'applied').length * 10, 100),
            skillAlignment: resumeStore.currentResume?.analysis?.ats_score || 0,
            networkingScore: 45 // Placeholder - would integrate with networking data
          };

          set({ progressMetrics: metrics });

          // Generate progress alert if needed
          if (metrics.profileCompleteness < 60) {
            get().createAction({
              agentId: 'career-coach',
              type: 'resume-improvement',
              title: 'Complete Your Profile',
              description: 'Your profile is only ' + metrics.profileCompleteness + '% complete. Upload a resume and fill out missing information to improve your job matching.',
              priority: 'high',
              status: 'pending',
              data: { currentScore: metrics.profileCompleteness },
              createdAt: Date.now()
            });
          }

        } catch (error) {
          console.error('Career progress analysis failed:', error);
        }
      },

      suggestJobOpportunities: async () => {
        try {
          const jobStore = useJobMatchingStore.getState();
          const topMatches = jobStore.matches
            .filter(m => m.similarity_score > 0.7)
            .slice(0, 3);

          if (topMatches.length > 0) {
            get().createAction({
              agentId: 'career-coach',
              type: 'job-suggestion',
              title: `${topMatches.length} High-Quality Job Matches Found`,
              description: `I found ${topMatches.length} jobs that are excellent matches for your profile. The top match has a ${Math.round(topMatches[0].similarity_score * 100)}% compatibility score.`,
              priority: 'high',
              status: 'pending',
              data: { matches: topMatches },
              createdAt: Date.now(),
              expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
            });

            // Send immediate job opportunity alert
            await get().sendJobOpportunityAlert(topMatches);
          }

        } catch (error) {
          console.error('Job opportunity suggestion failed:', error);
        }
      },

      sendDailyCareerDigest: async () => {
        try {
          const authStore = useAuthStore.getState();
          const state = get();

          if (!authStore.isAuthenticated || !state.notificationSettings.dailyDigest) return;

          // Check if daily digest was already sent today
          const now = Date.now();
          const oneDayAgo = now - (24 * 60 * 60 * 1000);
          if (state.emailScheduler.lastDailyDigest > oneDayAgo) return;

          const pendingActions = state.pendingActions.length;
          const insights = state.coachingInsights.slice(0, 3);
          const progress = state.progressMetrics;
          const jobStore = useJobMatchingStore.getState();
          const resumeStore = useResumeStore.getState();

          // Get recent job matches
          const recentMatches = jobStore.matches
            .filter(m => m.similarity_score > 0.7)
            .slice(0, 3);

          // Get trend alerts
          const recentTrends = state.trendAlerts.slice(0, 2);

          const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; background: white; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
                .content { padding: 30px; }
                .section { background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #667eea; }
                .progress-bar { background: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden; margin: 10px 0; }
                .progress-fill { background: linear-gradient(90deg, #10b981, #059669); height: 100%; border-radius: 4px; }
                .job-card { background: white; padding: 15px; border-radius: 8px; margin: 10px 0; border: 1px solid #e5e7eb; }
                .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; text-decoration: none; border-radius: 8px; margin: 10px 5px; }
                .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; }
                .metric { display: inline-block; margin: 10px 20px; text-align: center; }
                .metric-value { font-size: 24px; font-weight: bold; color: #667eea; display: block; }
                .metric-label { font-size: 12px; color: #6b7280; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🚀 Your Daily AI Career Update</h1>
                  <p>${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                
                <div class="content">
                  <div class="section">
                    <h2>📊 Career Progress Dashboard</h2>
                    <div style="display: flex; justify-content: space-around; flex-wrap: wrap;">
                      <div class="metric">
                        <span class="metric-value">${progress.profileCompleteness || 0}%</span>
                        <span class="metric-label">Profile Complete</span>
                      </div>
                      <div class="metric">
                        <span class="metric-value">${Math.round(progress.jobMatchQuality || 0)}%</span>
                        <span class="metric-label">Match Quality</span>
                      </div>
                      <div class="metric">
                        <span class="metric-value">${pendingActions}</span>
                        <span class="metric-label">Action Items</span>
                      </div>
                      <div class="metric">
                        <span class="metric-value">${recentMatches.length}</span>
                        <span class="metric-label">New Matches</span>
                      </div>
                    </div>
                  </div>

                  ${insights.length > 0 ? `
                    <div class="section">
                      <h2>💡 Today's Career Insights</h2>
                      <ul>
                        ${insights.map(insight => `<li style="margin: 8px 0;">${insight}</li>`).join('')}
                      </ul>
                    </div>
                  ` : ''}

                  ${recentMatches.length > 0 ? `
                    <div class="section">
                      <h2>🎯 Top Job Matches (${recentMatches.length})</h2>
                      ${recentMatches.map(match => `
                        <div class="job-card">
                          <h4 style="margin: 0 0 5px 0; color: #1e40af;">${match.job_title}</h4>
                          <p style="margin: 0 0 5px 0; color: #6b7280;">${match.company}</p>
                          <span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">
                            ${Math.round(match.similarity_score * 100)}% Match
                          </span>
                        </div>
                      `).join('')}
                    </div>
                  ` : ''}

                  ${recentTrends.length > 0 ? `
                    <div class="section">
                      <h2>📈 AI Industry Trends</h2>
                      ${recentTrends.map(trend => `
                        <div style="margin: 10px 0; padding: 10px; background: white; border-radius: 6px;">
                          <strong>${trend.category}:</strong> ${trend.trend}
                          <span style="float: right; color: ${trend.impact === 'positive' ? '#10b981' : trend.impact === 'negative' ? '#ef4444' : '#6b7280'};">
                            ${trend.impact === 'positive' ? '📈' : trend.impact === 'negative' ? '📉' : '➡️'}
                          </span>
                        </div>
                      `).join('')}
                    </div>
                  ` : ''}

                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://aijobhub.com/dashboard" class="button">View Full Dashboard</a>
                    <a href="https://aijobhub.com/jobs" class="button">Explore Jobs</a>
                  </div>
                </div>

                <div class="footer">
                  <p>AIJobHub Career Coach | Powered by Advanced AI</p>
                  <p>
                    <a href="https://aijobhub.com/settings" style="color: #667eea;">Notification Settings</a> | 
                    <a href="https://aijobhub.com/unsubscribe" style="color: #667eea;">Unsubscribe</a>
                  </p>
                </div>
              </div>
            </body>
            </html>
          `;

          const textContent = `
🚀 Your Daily AI Career Update - ${new Date().toLocaleDateString()}

📊 CAREER PROGRESS
• Profile Completeness: ${progress.profileCompleteness || 0}%
• Job Match Quality: ${Math.round(progress.jobMatchQuality || 0)}%
• Pending Actions: ${pendingActions}
• New Matches: ${recentMatches.length}

${insights.length > 0 ? `💡 TODAY'S INSIGHTS
${insights.map(insight => `• ${insight}`).join('\n')}` : ''}

${recentMatches.length > 0 ? `🎯 TOP JOB MATCHES
${recentMatches.map(match => `• ${match.job_title} at ${match.company} (${Math.round(match.similarity_score * 100)}% match)`).join('\n')}` : ''}

View your full dashboard: https://aijobhub.com/dashboard
          `;

          await email.sendEmail({
            from: 'career-coach@aijobhub.com',
            to: [authStore.user!.email],
            subject: `🚀 Your Daily AI Career Update - ${recentMatches.length} New Matches`,
            html: htmlContent,
            text: textContent,
            tags: [
              { name: 'type', value: 'daily-digest' },
              { name: 'agent', value: 'career-coach' },
              { name: 'user_id', value: authStore.user!.email },
              { name: 'matches', value: recentMatches.length.toString() }
            ]
          });

          // Update metrics
          set({
            emailScheduler: {
              ...state.emailScheduler,
              lastDailyDigest: now,
              emailMetrics: {
                ...state.emailScheduler.emailMetrics,
                totalSent: state.emailScheduler.emailMetrics.totalSent + 1,
                dailyDigestsSent: state.emailScheduler.emailMetrics.dailyDigestsSent + 1,
                lastEmailSent: now
              }
            }
          });

        } catch (error) {
          console.error('Daily digest email failed:', error);
        }
      },

      // Trend Analyzer Agent Implementation
      analyzeTrends: async () => {
        try {
          const ai = new OpenRouterAI();

          // Simulate trend analysis (in real implementation, would use web search)
          const trendPrompt = `Analyze current AI industry trends for 2024. Identify:

1. Emerging AI technologies and frameworks
2. In-demand skills and certifications  
3. Growing market segments
4. Career opportunities and job market shifts
5. Technology adoption patterns

Focus on actionable insights for AI professionals. Format as JSON:
{
  "trends": [
    {
      "category": "technology|skills|market|career",
      "trend": "trend description",
      "impact": "positive|negative|neutral", 
      "confidence": 0.0-1.0,
      "recommendations": ["rec1", "rec2"]
    }
  ]
}`;

          const response = await ai.chat.completions.create({
            model: 'anthropic/claude-3-sonnet',
            messages: [{ role: 'user', content: trendPrompt }],
            temperature: 0.6,
            max_tokens: 800
          });

          const result = JSON.parse(response.choices[0].message.content || '{"trends": []}');

          const trends: TrendAnalysis[] = result.trends.map((t: any, index: number) => ({
            id: `trend-${Date.now()}-${index}`,
            category: t.category,
            trend: t.trend,
            impact: t.impact,
            confidence: t.confidence,
            sources: ['AI Industry Analysis', 'Market Research'],
            recommendations: t.recommendations,
            detectedAt: Date.now()
          }));

          set({
            trends: [...get().trends, ...trends],
            trendAlerts: trends.filter(t => t.confidence > 0.8)
          });

          // Create high-confidence trend alerts
          const highConfidenceTrends = trends.filter(t => t.confidence > 0.8);
          highConfidenceTrends.forEach(async (trend) => {
            get().createAction({
              agentId: 'trend-analyzer',
              type: 'trend-alert',
              title: `New Trend Alert: ${trend.category}`,
              description: trend.trend,
              priority: trend.impact === 'positive' ? 'high' : 'medium',
              status: 'pending',
              data: { trend },
              createdAt: Date.now()
            });

            // Send immediate trend alert for critical trends
            if (trend.confidence > 0.9 || trend.impact === 'positive') {
              await get().sendTrendAlert(trend);
            }
          });

        } catch (error) {
          console.error('Trend analysis failed:', error);
        }
      },

      detectEmergingSkills: async () => {
        try {
          const ai = new OpenRouterAI();

          const skillsPrompt = `Based on current AI job market trends, identify the top 10 emerging skills that AI professionals should learn in 2024-2025:

Include:
- Technical skills (frameworks, tools, languages)
- Soft skills (communication, leadership)
- Domain expertise (healthcare AI, fintech AI, etc.)
- Certifications and credentials

For each skill, provide:
- Skill name
- Category (technical/soft/domain/certification)
- Demand level (high/medium/low)
- Learning difficulty (beginner/intermediate/advanced)
- Recommended resources

Format as JSON: {"skills": [{"name": "", "category": "", "demand": "", "difficulty": "", "resources": []}]}`;

          const response = await ai.chat.completions.create({
            model: 'anthropic/claude-3-sonnet',
            messages: [{ role: 'user', content: skillsPrompt }],
            temperature: 0.6,
            max_tokens: 1000
          });

          const result = JSON.parse(response.choices[0].message.content || '{"skills": []}');

          get().createAction({
            agentId: 'trend-analyzer',
            type: 'skill-recommendation',
            title: 'Emerging Skills Report Available',
            description: `I've identified ${result.skills.length} emerging skills you should consider learning to stay competitive in the AI job market.`,
            priority: 'medium',
            status: 'pending',
            data: { skills: result.skills },
            createdAt: Date.now()
          });

        } catch (error) {
          console.error('Emerging skills detection failed:', error);
        }
      },

      generateTrendAlerts: async () => {
        const state = get();
        const recentTrends = state.trends.filter(t =>
          Date.now() - t.detectedAt < 24 * 60 * 60 * 1000 && t.confidence > 0.7
        );

        if (recentTrends.length > 0 && state.notificationSettings.trendAlerts) {
          // Would send email notifications for important trends
        }
      },

      // Networking Suggester Agent Implementation
      analyzeNetworkingOpportunities: async () => {
        try {
          // Simulate networking analysis (would integrate with LinkedIn API in real implementation)
          const suggestions: NetworkingSuggestion[] = [
            {
              id: `net-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              platform: 'linkedin' as const,
              profileUrl: 'linkedin.com/in/ai-expert',
              name: 'Sarah Chen',
              title: 'Senior AI Engineer',
              company: 'Google',
              connectionReason: 'Works on similar Conversational AI projects',
              matchScore: 0.85,
              commonSkills: ['TensorFlow', 'Natural Language Processing', 'Cloud AI'],
              mutualConnections: 3
            },
            {
              id: `net-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              platform: 'linkedin' as const,
              profileUrl: 'linkedin.com/in/ml-lead',
              name: 'David Rodriguez',
              title: 'ML Team Lead',
              company: 'Microsoft',
              connectionReason: 'Alumni from same university, works on Azure AI',
              matchScore: 0.78,
              commonSkills: ['Machine Learning', 'Python', 'Azure'],
              mutualConnections: 7
            }
          ];

          set({
            networkingSuggestions: [...get().networkingSuggestions, ...suggestions]
          });

          get().createAction({
            agentId: 'networking-suggester',
            type: 'networking-connection',
            title: `${suggestions.length} New Networking Opportunities`,
            description: `I found ${suggestions.length} potential connections at top AI companies who share similar interests and backgrounds.`,
            priority: 'medium',
            status: 'pending',
            data: { suggestions },
            createdAt: Date.now()
          });

          // Send networking prompt email
          await get().sendNetworkingPrompt(suggestions);

        } catch (error) {
          console.error('Networking analysis failed:', error);
        }
      },

      generateConnectionSuggestions: async () => {
        // This would analyze user's profile and suggest strategic connections
      },

      sendNetworkingReminders: async () => {
        // This would send periodic reminders to connect with suggested people
      },

      // Auto Resume Builder Agent Implementation
      generateTailoredResume: async (jobDescription: string) => {
        try {
          const resumeStore = useResumeStore.getState();
          if (!resumeStore.currentResume) return;

          const ai = new OpenRouterAI();

          const prompt = `Create a tailored resume version based on this job description:

JOB DESCRIPTION:
${jobDescription}

CURRENT RESUME DATA:
${JSON.stringify(resumeStore.currentResume.analysis, null, 2)}

Generate optimizations for:
1. Skills section - highlight relevant skills
2. Experience descriptions - emphasize matching responsibilities  
3. Keywords - include job-specific terms
4. Summary - tailor to role requirements

Format as JSON with optimized sections.`;

          const response = await ai.chat.completions.create({
            model: 'anthropic/claude-3-sonnet',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 1000
          });

          const optimizedResume = response.choices[0].message.content;

          set({
            generatedResumes: [...get().generatedResumes, {
              id: `resume-${Date.now()}`,
              jobDescription,
              optimizedContent: optimizedResume,
              createdAt: Date.now()
            }]
          });

          get().createAction({
            agentId: 'auto-resume-builder',
            type: 'resume-improvement',
            title: 'Tailored Resume Generated',
            description: 'I\'ve created a customized version of your resume optimized for the specific job you\'re targeting.',
            priority: 'high',
            status: 'pending',
            data: { resumeContent: optimizedResume },
            createdAt: Date.now()
          });

        } catch (error) {
          console.error('Resume generation failed:', error);
        }
      },

      optimizeResumeForATS: async (resumeId: string) => {
        // ATS optimization logic
      },

      createResumeVariations: async () => {
        // Create multiple resume versions for different job types
      },

      // ====================================
      // EMAIL NOTIFICATION FUNCTIONS
      // ====================================

      scheduleEmail: (email: Omit<ScheduledEmail, 'id' | 'createdAt'>) => {
        const state = get();
        const newEmail: ScheduledEmail = {
          ...email,
          id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: Date.now()
        };

        set({
          emailScheduler: {
            ...state.emailScheduler,
            pendingEmails: [...state.emailScheduler.pendingEmails, newEmail]
          }
        });
      },

      sendScheduledEmails: async () => {
        const state = get();
        const now = Date.now();
        const emailsToSend = state.emailScheduler.pendingEmails.filter(
          email => email.scheduledFor <= now && email.status === 'pending'
        );

        for (const scheduledEmail of emailsToSend) {
          try {
            await email.sendEmail({
              from: 'notifications@aijobhub.com',
              to: [scheduledEmail.recipientEmail],
              subject: scheduledEmail.subject,
              html: scheduledEmail.htmlContent,
              text: scheduledEmail.textContent,
              tags: [
                { name: 'type', value: scheduledEmail.type },
                { name: 'priority', value: scheduledEmail.priority },
                { name: 'scheduled', value: 'true' }
              ]
            });

            // Mark as sent
            set({
              emailScheduler: {
                ...state.emailScheduler,
                pendingEmails: state.emailScheduler.pendingEmails.map(e =>
                  e.id === scheduledEmail.id ? { ...e, status: 'sent' as const } : e
                ),
                emailMetrics: {
                  ...state.emailScheduler.emailMetrics,
                  totalSent: state.emailScheduler.emailMetrics.totalSent + 1,
                  lastEmailSent: now
                }
              }
            });

          } catch (error) {
            console.error(`Failed to send scheduled email ${scheduledEmail.id}:`, error);
            // Mark as failed
            set({
              emailScheduler: {
                ...state.emailScheduler,
                pendingEmails: state.emailScheduler.pendingEmails.map(e =>
                  e.id === scheduledEmail.id ? { ...e, status: 'failed' as const } : e
                )
              }
            });
          }
        }
      },

      sendImmediateNotification: async (type: ScheduledEmail['type'], data: any) => {
        try {
          const authStore = useAuthStore.getState();
          const state = get();

          if (!authStore.isAuthenticated || !state.notificationSettings.email) return;

          let subject = '';
          let htmlContent = '';
          let textContent = '';

          switch (type) {
            case 'trend-alert':
              subject = `🚨 AI Trend Alert: ${data.trend.category}`;
              await get().sendTrendAlert(data.trend);
              return;
            case 'job-notification':
              subject = `🎯 ${data.jobs.length} New High-Match AI Jobs Found`;
              await get().sendJobOpportunityAlert(data.jobs);
              return;
            case 'skill-reminder':
              subject = `📚 Skill Development Reminder: ${data.skills.join(', ')}`;
              await get().sendSkillDevelopmentReminder(data.skills);
              return;
            default:
              return;
          }

          await email.sendEmail({
            from: 'alerts@aijobhub.com',
            to: [authStore.user!.email],
            subject,
            html: htmlContent,
            text: textContent,
            tags: [
              { name: 'type', value: type },
              { name: 'priority', value: 'high' },
              { name: 'immediate', value: 'true' }
            ]
          });

        } catch (error) {
          console.error('Immediate notification failed:', error);
        }
      },

      sendWeeklyCareerReport: async () => {
        try {
          const authStore = useAuthStore.getState();
          const state = get();

          if (!authStore.isAuthenticated || !state.notificationSettings.weeklyReport) return;

          const now = Date.now();
          const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
          if (state.emailScheduler.lastWeeklyReport > oneWeekAgo) return;

          const jobStore = useJobMatchingStore.getState();
          const resumeStore = useResumeStore.getState();

          // Calculate weekly metrics
          const weeklyMetrics = {
            jobsViewed: jobStore.searchHistory.length,
            newMatches: jobStore.matches.filter(m => m.created_at && new Date(m.created_at).getTime() > oneWeekAgo).length,
            applicationsSubmitted: jobStore.matches.filter(m => m.application_status === 'applied').length,
            profileViews: Math.floor(Math.random() * 50) + 10, // Simulated
            trendsTracked: state.trends.filter(t => t.detectedAt > oneWeekAgo).length,
            skillsImproved: resumeStore.currentResume?.analysis?.suggestions?.length || 0
          };

          const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
                .container { max-width: 650px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
                .content { padding: 40px 30px; }
                .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin: 30px 0; }
                .metric-card { background: linear-gradient(135deg, #f8fafc, #e2e8f0); padding: 20px; border-radius: 12px; text-align: center; border: 2px solid #e5e7eb; }
                .metric-value { font-size: 28px; font-weight: bold; color: #667eea; display: block; margin-bottom: 5px; }
                .metric-label { font-size: 14px; color: #6b7280; font-weight: 500; }
                .section { margin: 30px 0; }
                .section-title { color: #1e40af; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 20px; }
                .achievement { background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #10b981; }
                .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; text-decoration: none; border-radius: 8px; margin: 10px 10px 10px 0; font-weight: 500; }
                .footer { background: #f9fafb; padding: 30px; text-align: center; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>📊 Weekly Career Report</h1>
                  <p>Your AI career progress summary</p>
                  <p style="opacity: 0.9; font-size: 14px;">${new Date(oneWeekAgo).toLocaleDateString()} - ${new Date().toLocaleDateString()}</p>
                </div>
                
                <div class="content">
                  <div class="section">
                    <h2 class="section-title">🎯 This Week's Achievements</h2>
                    <div class="metric-grid">
                      <div class="metric-card">
                        <span class="metric-value">${weeklyMetrics.newMatches}</span>
                        <span class="metric-label">New Job Matches</span>
                      </div>
                      <div class="metric-card">
                        <span class="metric-value">${weeklyMetrics.applicationsSubmitted}</span>
                        <span class="metric-label">Applications</span>
                      </div>
                      <div class="metric-card">
                        <span class="metric-value">${weeklyMetrics.profileViews}</span>
                        <span class="metric-label">Profile Views</span>
                      </div>
                      <div class="metric-card">
                        <span class="metric-value">${weeklyMetrics.trendsTracked}</span>
                        <span class="metric-label">Trends Tracked</span>
                      </div>
                    </div>
                  </div>

                  <div class="section">
                    <h2 class="section-title">🚀 Progress Highlights</h2>
                    ${weeklyMetrics.newMatches > 0 ? `<div class="achievement">🎯 Found ${weeklyMetrics.newMatches} new high-quality job matches</div>` : ''}
                    ${weeklyMetrics.applicationsSubmitted > 0 ? `<div class="achievement">📝 Submitted ${weeklyMetrics.applicationsSubmitted} job applications</div>` : ''}
                    ${weeklyMetrics.trendsTracked > 0 ? `<div class="achievement">📈 Tracked ${weeklyMetrics.trendsTracked} new AI industry trends</div>` : ''}
                    ${weeklyMetrics.profileViews > 20 ? `<div class="achievement">👁️ Your profile gained ${weeklyMetrics.profileViews} views this week</div>` : ''}
                  </div>

                  <div class="section">
                    <h2 class="section-title">📈 Next Week's Focus</h2>
                    <ul>
                      <li>Apply to at least 3 high-match positions</li>
                      <li>Update your resume with trending AI skills</li>
                      <li>Connect with 2 new AI professionals on LinkedIn</li>
                      <li>Complete one skill development course</li>
                    </ul>
                  </div>

                  <div style="text-align: center; margin: 40px 0;">
                    <a href="https://aijobhub.com/dashboard" class="button">View Dashboard</a>
                    <a href="https://aijobhub.com/jobs" class="button">Explore New Jobs</a>
                  </div>
                </div>

                <div class="footer">
                  <p><strong>AIJobHub Weekly Report</strong></p>
                  <p>Keep pushing forward in your AI career journey! 🚀</p>
                  <p style="font-size: 12px; margin-top: 20px;">
                    <a href="https://aijobhub.com/settings">Settings</a> | 
                    <a href="https://aijobhub.com/unsubscribe">Unsubscribe</a>
                  </p>
                </div>
              </div>
            </body>
            </html>
          `;

          const textContent = `
📊 WEEKLY CAREER REPORT

🎯 This Week's Achievements:
• ${weeklyMetrics.newMatches} new job matches found
• ${weeklyMetrics.applicationsSubmitted} applications submitted  
• ${weeklyMetrics.profileViews} profile views
• ${weeklyMetrics.trendsTracked} AI trends tracked

📈 Next Week's Focus:
• Apply to at least 3 high-match positions
• Update resume with trending AI skills
• Connect with 2 new AI professionals
• Complete one skill development course

View your dashboard: https://aijobhub.com/dashboard
          `;

          await email.sendEmail({
            from: 'reports@aijobhub.com',
            to: [authStore.user!.email],
            subject: `📊 Your Weekly AI Career Report: ${weeklyMetrics.newMatches} New Matches`,
            html: htmlContent,
            text: textContent,
            tags: [
              { name: 'type', value: 'weekly-report' },
              { name: 'agent', value: 'career-coach' },
              { name: 'matches', value: weeklyMetrics.newMatches.toString() }
            ]
          });

          // Update metrics
          set({
            emailScheduler: {
              ...state.emailScheduler,
              lastWeeklyReport: now,
              emailMetrics: {
                ...state.emailScheduler.emailMetrics,
                totalSent: state.emailScheduler.emailMetrics.totalSent + 1,
                weeklyReportsSent: state.emailScheduler.emailMetrics.weeklyReportsSent + 1,
                lastEmailSent: now
              }
            }
          });

        } catch (error) {
          console.error('Weekly report email failed:', error);
        }
      },

      sendTrendAlert: async (trend: TrendAnalysis) => {
        try {
          const authStore = useAuthStore.getState();
          const state = get();

          if (!authStore.isAuthenticated || !state.notificationSettings.trendAlerts) return;

          const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; background: white; }
                .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; }
                .content { padding: 30px; }
                .alert-box { background: ${trend.impact === 'positive' ? '#ecfdf5' : trend.impact === 'negative' ? '#fef2f2' : '#f8fafc'}; 
                           border: 2px solid ${trend.impact === 'positive' ? '#10b981' : trend.impact === 'negative' ? '#ef4444' : '#6b7280'}; 
                           padding: 20px; border-radius: 12px; margin: 20px 0; }
                .confidence-bar { background: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden; margin: 10px 0; }
                .confidence-fill { background: linear-gradient(90deg, #f59e0b, #d97706); height: 100%; border-radius: 4px; width: ${trend.confidence * 100}%; }
                .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; text-decoration: none; border-radius: 8px; margin: 10px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🚨 AI Trend Alert</h1>
                  <p>Important industry development detected</p>
                </div>
                
                <div class="content">
                  <div class="alert-box">
                    <h2>${trend.impact === 'positive' ? '📈' : trend.impact === 'negative' ? '📉' : '➡️'} ${trend.category.toUpperCase()}</h2>
                    <p><strong>${trend.trend}</strong></p>
                    
                    <div style="margin: 15px 0;">
                      <span style="font-size: 14px; color: #6b7280;">Confidence Level</span>
                      <div class="confidence-bar">
                        <div class="confidence-fill"></div>
                      </div>
                      <span style="font-size: 14px; color: #6b7280;">${Math.round(trend.confidence * 100)}%</span>
                    </div>
                  </div>

                  <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>💡 Recommended Actions:</h3>
                    <ul>
                      ${trend.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                  </div>

                  <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
                    <p><strong>💰 Career Impact:</strong> ${trend.impact === 'positive' ? 'This trend could create new opportunities in your field' : trend.impact === 'negative' ? 'Stay ahead by adapting to these changes' : 'Monitor this development for future opportunities'}</p>
                  </div>

                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://aijobhub.com/trends" class="button">View All Trends</a>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `;

          const textContent = `
🚨 AI TREND ALERT: ${trend.category.toUpperCase()}

${trend.impact === 'positive' ? '📈' : trend.impact === 'negative' ? '📉' : '➡️'} ${trend.trend}

Confidence: ${Math.round(trend.confidence * 100)}%

💡 Recommended Actions:
${trend.recommendations.map(rec => `• ${rec}`).join('\n')}

View all trends: https://aijobhub.com/trends
          `;

          await email.sendEmail({
            from: 'trends@aijobhub.com',
            to: [authStore.user!.email],
            subject: `🚨 AI Trend Alert: ${trend.category} - ${trend.impact === 'positive' ? 'Opportunity' : 'Important Update'}`,
            html: htmlContent,
            text: textContent,
            tags: [
              { name: 'type', value: 'trend-alert' },
              { name: 'category', value: trend.category },
              { name: 'impact', value: trend.impact },
              { name: 'confidence', value: Math.round(trend.confidence * 100).toString() }
            ]
          });

          // Update metrics
          set({
            emailScheduler: {
              ...state.emailScheduler,
              lastTrendAlert: Date.now(),
              emailMetrics: {
                ...state.emailScheduler.emailMetrics,
                totalSent: state.emailScheduler.emailMetrics.totalSent + 1,
                trendAlertsSent: state.emailScheduler.emailMetrics.trendAlertsSent + 1,
                lastEmailSent: Date.now()
              }
            }
          });

        } catch (error) {
          console.error('Trend alert email failed:', error);
        }
      },

      sendJobOpportunityAlert: async (jobs: any[]) => {
        try {
          const authStore = useAuthStore.getState();
          const state = get();

          if (!authStore.isAuthenticated || !state.notificationSettings.jobSuggestions || jobs.length === 0) return;

          const topJobs = jobs.slice(0, 5);

          const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; background: white; }
                .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; }
                .content { padding: 30px; }
                .job-card { background: #f8fafc; padding: 20px; border-radius: 12px; margin: 15px 0; border-left: 4px solid #10b981; }
                .job-title { color: #1e40af; font-size: 18px; font-weight: bold; margin: 0 0 5px 0; }
                .job-company { color: #6b7280; margin: 0 0 10px 0; }
                .match-badge { background: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
                .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #10b981, #059669); color: white; text-decoration: none; border-radius: 8px; margin: 5px; }
                .urgent { background: linear-gradient(135deg, #ef4444, #dc2626) !important; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎯 New Job Opportunities</h1>
                  <p>${jobs.length} high-match AI positions found for you</p>
                </div>
                
                <div class="content">
                  <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                    <h2>🚀 ${jobs.length} New Matches Found!</h2>
                    <p>These positions align perfectly with your AI expertise and career goals.</p>
                  </div>

                  ${topJobs.map(job => `
                    <div class="job-card">
                      <div class="job-title">${job.job_title || job.title}</div>
                      <div class="job-company">${job.company} • ${job.location || 'Remote'}</div>
                      <p style="color: #374151; font-size: 14px; margin: 10px 0;">${(job.description || '').substring(0, 150)}...</p>
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
                        <span class="match-badge">${Math.round((job.similarity_score || job.match_score || 0.8) * 100)}% Match</span>
                        <div>
                          <a href="https://aijobhub.com/jobs/${job.id}" class="button" style="font-size: 12px; padding: 8px 16px;">View Details</a>
                          <a href="https://aijobhub.com/apply/${job.id}" class="button urgent" style="font-size: 12px; padding: 8px 16px;">Quick Apply</a>
                        </div>
                      </div>
                    </div>
                  `).join('')}

                  ${jobs.length > 5 ? `
                    <div style="text-align: center; background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <p><strong>+${jobs.length - 5} more opportunities available</strong></p>
                      <a href="https://aijobhub.com/jobs" class="button">View All Jobs</a>
                    </div>
                  ` : ''}

                  <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                    <p><strong>⚡ Pro Tip:</strong> Apply within 24 hours to increase your chances of getting noticed by recruiters!</p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `;

          const textContent = `
🎯 NEW JOB OPPORTUNITIES - ${jobs.length} High-Match Positions

${topJobs.map(job => `
• ${job.job_title || job.title} at ${job.company}
  ${Math.round((job.similarity_score || job.match_score || 0.8) * 100)}% Match
  Apply: https://aijobhub.com/apply/${job.id}
`).join('')}

${jobs.length > 5 ? `+${jobs.length - 5} more opportunities available` : ''}

View all jobs: https://aijobhub.com/jobs
          `;

          await email.sendEmail({
            from: 'jobs@aijobhub.com',
            to: [authStore.user!.email],
            subject: `🎯 ${jobs.length} New High-Match AI Jobs Found - Apply Now!`,
            html: htmlContent,
            text: textContent,
            tags: [
              { name: 'type', value: 'job-notification' },
              { name: 'job_count', value: jobs.length.toString() },
              { name: 'top_match', value: Math.round((topJobs[0]?.similarity_score || 0.8) * 100).toString() }
            ]
          });

          // Update metrics
          set({
            emailScheduler: {
              ...state.emailScheduler,
              lastJobAlert: Date.now(),
              emailMetrics: {
                ...state.emailScheduler.emailMetrics,
                totalSent: state.emailScheduler.emailMetrics.totalSent + 1,
                jobNotificationsSent: state.emailScheduler.emailMetrics.jobNotificationsSent + 1,
                lastEmailSent: Date.now()
              }
            }
          });

        } catch (error) {
          console.error('Job opportunity alert failed:', error);
        }
      },

      sendSkillDevelopmentReminder: async (skills: string[]) => {
        try {
          const authStore = useAuthStore.getState();
          const state = get();

          if (!authStore.isAuthenticated || !state.notificationSettings.skillRecommendations) return;

          const skillResources = skills.map(skill => ({
            skill,
            courses: [`Advanced ${skill}`, `${skill} Certification`, `Practical ${skill}`],
            difficulty: ['Beginner', 'Intermediate', 'Advanced'][Math.floor(Math.random() * 3)],
            demand: ['High', 'Very High', 'Critical'][Math.floor(Math.random() * 3)]
          }));

          const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; background: white; }
                .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; }
                .content { padding: 30px; }
                .skill-card { background: #f8fafc; padding: 20px; border-radius: 12px; margin: 15px 0; border-left: 4px solid #8b5cf6; }
                .demand-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin: 5px 5px 5px 0; }
                .high-demand { background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; }
                .medium-demand { background: #fef3c7; color: #d97706; border: 1px solid #fcd34d; }
                .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; text-decoration: none; border-radius: 8px; margin: 5px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>📚 Skill Development Reminder</h1>
                  <p>Time to level up your AI expertise</p>
                </div>
                
                <div class="content">
                  <div style="background: #f3e8ff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                    <h2>🚀 ${skills.length} Skills Ready for Development</h2>
                    <p>Based on current market trends and your career goals</p>
                  </div>

                  ${skillResources.map(skillData => `
                    <div class="skill-card">
                      <h3 style="color: #7c3aed; margin: 0 0 10px 0;">${skillData.skill}</h3>
                      
                      <div style="margin: 10px 0;">
                        <span class="demand-badge ${skillData.demand === 'Critical' || skillData.demand === 'Very High' ? 'high-demand' : 'medium-demand'}">
                          ${skillData.demand} Demand
                        </span>
                        <span class="demand-badge medium-demand">${skillData.difficulty} Level</span>
                      </div>
                      
                      <p style="color: #6b7280; margin: 10px 0;">Recommended Learning Paths:</p>
                      <ul style="margin: 0;">
                        ${skillData.courses.map(course => `<li>${course}</li>`).join('')}
                      </ul>
                      
                      <div style="margin-top: 15px;">
                        <a href="https://aijobhub.com/learn/${skillData.skill.toLowerCase().replace(/\s+/g, '-')}" class="button" style="font-size: 12px; padding: 8px 16px;">Start Learning</a>
                      </div>
                    </div>
                  `).join('')}

                  <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
                    <p><strong>💡 Learning Tip:</strong> Focus on one skill at a time and dedicate 30 minutes daily for consistent progress!</p>
                  </div>

                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://aijobhub.com/skills" class="button">View All Skills</a>
                    <a href="https://aijobhub.com/learning-path" class="button">Create Learning Path</a>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `;

          await email.sendEmail({
            from: 'learning@aijobhub.com',
            to: [authStore.user!.email],
            subject: `📚 Time to Level Up: ${skills.length} AI Skills Development Reminder`,
            html: htmlContent,
            tags: [
              { name: 'type', value: 'skill-reminder' },
              { name: 'skill_count', value: skills.length.toString() }
            ]
          });

        } catch (error) {
          console.error('Skill development reminder failed:', error);
        }
      },

      sendNetworkingPrompt: async (suggestions: NetworkingSuggestion[]) => {
        try {
          const authStore = useAuthStore.getState();
          const state = get();

          if (!authStore.isAuthenticated || !state.notificationSettings.networkingReminders) return;

          const topSuggestions = suggestions.slice(0, 3);

          const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; background: white; }
                .header { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; padding: 30px; text-align: center; }
                .content { padding: 30px; }
                .person-card { background: #f8fafc; padding: 20px; border-radius: 12px; margin: 15px 0; border-left: 4px solid #06b6d4; }
                .match-score { background: #06b6d4; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
                .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #06b6d4, #0891b2); color: white; text-decoration: none; border-radius: 8px; margin: 5px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🤝 Networking Suggestions</h1>
                  <p>Strategic connections for your AI career</p>
                </div>
                
                <div class="content">
                  <div style="background: #ecfeff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                    <h2>🎯 ${suggestions.length} Strategic Connections Found</h2>
                    <p>These professionals share your interests and could advance your career</p>
                  </div>

                  ${topSuggestions.map(person => `
                    <div class="person-card">
                      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                        <div>
                          <h3 style="color: #0891b2; margin: 0;">${person.name}</h3>
                          <p style="color: #6b7280; margin: 0;">${person.title} at ${person.company}</p>
                        </div>
                        <span class="match-score">${Math.round(person.matchScore * 100)}% Match</span>
                      </div>
                      
                      <p style="color: #374151; font-size: 14px; margin: 10px 0;">${person.connectionReason}</p>
                      
                      <div style="margin: 10px 0;">
                        <strong>Common Skills:</strong> ${person.commonSkills.join(', ')}
                      </div>
                      
                      ${person.mutualConnections ? `<div style="color: #6b7280; font-size: 12px; margin: 10px 0;">${person.mutualConnections} mutual connections</div>` : ''}
                      
                      <div style="margin-top: 15px;">
                        <a href="${person.profileUrl}" class="button" style="font-size: 12px; padding: 8px 16px;">View Profile</a>
                        <a href="https://aijobhub.com/connect/${person.id}" class="button" style="font-size: 12px; padding: 8px 16px;">Connect</a>
                      </div>
                    </div>
                  `).join('')}

                  <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                    <p><strong>💡 Networking Tip:</strong> Personalize your connection message by mentioning shared skills or mutual interests!</p>
                  </div>

                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://aijobhub.com/networking" class="button">View All Suggestions</a>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `;

          await email.sendEmail({
            from: 'networking@aijobhub.com',
            to: [authStore.user!.email],
            subject: `🤝 ${suggestions.length} Strategic AI Professional Connections Found`,
            html: htmlContent,
            tags: [
              { name: 'type', value: 'networking-prompt' },
              { name: 'suggestion_count', value: suggestions.length.toString() }
            ]
          });

        } catch (error) {
          console.error('Networking prompt failed:', error);
        }
      },

      sendCareerMilestoneEmail: async (milestone: string, achievement: any) => {
        try {
          const authStore = useAuthStore.getState();
          const state = get();

          if (!authStore.isAuthenticated || !state.notificationSettings.careerMilestones) return;

          const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; background: white; }
                .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 40px 30px; text-align: center; }
                .content { padding: 40px 30px; }
                .celebration { background: linear-gradient(135deg, #fef3c7, #fed7aa); padding: 30px; border-radius: 12px; text-align: center; margin: 20px 0; }
                .achievement-stats { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; text-decoration: none; border-radius: 8px; margin: 10px; font-weight: 500; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎉 Congratulations!</h1>
                  <p>You've reached a career milestone</p>
                </div>
                
                <div class="content">
                  <div class="celebration">
                    <h2 style="color: #d97706; margin: 0 0 15px 0;">🏆 ${milestone}</h2>
                    <p style="font-size: 18px; margin: 0;">Amazing progress on your AI career journey!</p>
                  </div>

                  <div class="achievement-stats">
                    <h3>📊 Your Achievement Stats:</h3>
                    <ul>
                      ${Object.entries(achievement).map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`).join('')}
                    </ul>
                  </div>

                  <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
                    <p><strong>🚀 What's Next:</strong> Keep building momentum! Your consistent effort is paying off in your AI career development.</p>
                  </div>

                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://aijobhub.com/achievements" class="button">View All Achievements</a>
                    <a href="https://aijobhub.com/share-achievement" class="button">Share Success</a>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `;

          await email.sendEmail({
            from: 'achievements@aijobhub.com',
            to: [authStore.user!.email],
            subject: `🎉 Milestone Achieved: ${milestone}`,
            html: htmlContent,
            tags: [
              { name: 'type', value: 'career-milestone' },
              { name: 'milestone', value: milestone }
            ]
          });

        } catch (error) {
          console.error('Career milestone email failed:', error);
        }
      },

      // Utility Functions
      updateSettings: (settings: Partial<AIAgentsState['notificationSettings']>) => {
        const state = get();
        set({
          notificationSettings: { ...state.notificationSettings, ...settings }
        });
      },

      clearActions: () => {
        set({
          actions: [],
          pendingActions: [],
          completedActions: []
        });
      },

      exportAgentData: () => {
        const state = get();
        return {
          agents: state.agents,
          actions: state.actions,
          trends: state.trends,
          networkingSuggestions: state.networkingSuggestions,
          settings: state.notificationSettings
        };
      },

      importAgentData: (data: any) => {
        set({
          agents: data.agents || [],
          actions: data.actions || [],
          trends: data.trends || [],
          networkingSuggestions: data.networkingSuggestions || [],
          notificationSettings: data.settings || get().notificationSettings
        });
      }
    }),
    {
      name: 'ai-agents-storage',
      partialize: (state) => ({
        agents: state.agents,
        actions: state.actions,
        pendingActions: state.pendingActions,
        completedActions: state.completedActions,
        chatSessions: state.chatSessions,
        trends: state.trends,
        networkingSuggestions: state.networkingSuggestions,
        generatedResumes: state.generatedResumes,
        careerGoals: state.careerGoals,
        progressMetrics: state.progressMetrics,
        coachingInsights: state.coachingInsights,
        notificationSettings: state.notificationSettings,
        emailScheduler: state.emailScheduler
      })
    }
  )
);