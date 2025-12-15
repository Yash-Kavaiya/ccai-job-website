import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { DevvAI, OpenRouterAI, elevenlabs, upload } from '@devvai/devv-code-backend';
import { useInterviewStore } from '@/store/interview-store';
import { useAuthStore } from '@/store/auth-store';
import InterviewScheduler from '@/components/interview/InterviewScheduler';
import { getRandomQuestion, getQuestionsForRole, AI_INTERVIEW_QUESTIONS } from '@/data/interview-questions';
import {
  Mic,
  MicOff,
  Play,
  Pause,
  Square,
  Send,
  Bot,
  User,
  Clock,
  Star,
  Loader2,
  Volume2,
  VolumeX,
  RefreshCw,
  Target,
  TrendingUp,
  MessageSquare,
  Headphones,
  Brain,
  Zap,
  Timer,
  Award,
  BarChart3,
  Settings,
  Sparkles,
  Share2,
  Download,
  Bookmark,
  Activity,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Info,
  Gauge,
  Calendar,
  CalendarPlus
} from 'lucide-react';

export default function InterviewPage() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState('start');
  const [inputMessage, setInputMessage] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedModel, setSelectedModel] = useState('google/gemini-pro');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState('');
  const [questionStartTime, setQuestionStartTime] = useState<Date | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);

  // Store state
  const {
    currentSession,
    isRecording,
    isPlaying,
    isLoading,
    lastTranscription,
    history,
    createSession,
    startSession,
    endSession,
    addMessage,
    updateMessage,
    setCurrentQuestion,
    markQuestionAsked,
    updateScores,
    updateFeedback,
    updateMetrics,
    setRecording,
    setPlaying,
    setLoading,
    setLastTranscription,
    reset,
  } = useInterviewStore();

  // Audio recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const responseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const aiRoles = [
    'Machine Learning Engineer',
    'AI Research Scientist',
    'Data Scientist',
    'Computer Vision Engineer',
    'NLP Engineer',
    'MLOps Engineer',
    'AI Product Manager',
    'Conversational AI Developer',
    'Google CCAI Developer',
    'Microsoft Copilot Developer',
    'Amazon Lex Developer',
    'OpenAI Integration Specialist',
  ];

  const companies = [
    'Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'OpenAI',
    'Anthropic', 'Hugging Face', 'DeepMind', 'Tesla', 'NVIDIA', 'Startup'
  ];

  const difficulties = [
    { value: 'entry', label: 'Entry Level', description: 'Basic AI concepts and programming', color: 'text-green-600' },
    { value: 'mid', label: 'Mid Level', description: 'Practical ML projects and system design', color: 'text-blue-600' },
    { value: 'senior', label: 'Senior Level', description: 'Advanced algorithms and leadership', color: 'text-orange-600' },
    { value: 'principal', label: 'Principal/Staff', description: 'Research, strategy, and architecture', color: 'text-red-600' },
  ];

  const aiModels = [
    { value: 'google/gemini-pro', label: 'Google Gemini Pro', description: 'Advanced reasoning, best for technical interviews' },
    { value: 'anthropic/claude-3-5-sonnet', label: 'Claude 3.5 Sonnet', description: 'Excellent for behavioral questions' },
    { value: 'openai/gpt-4o', label: 'GPT-4o', description: 'Well-rounded for all interview types' },
    { value: 'default', label: 'DevvAI Default', description: 'Free model, good for practice sessions' },
  ];

  useEffect(() => {
    // Initialize audio element
    audioRef.current = new Audio();
    audioRef.current.onended = () => setPlaying(false);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (responseTimeoutRef.current) {
        clearTimeout(responseTimeoutRef.current);
      }
    };
  }, [setPlaying]);

  const generateInterviewerResponse = useCallback(async (userMessage: string, isFirstMessage = false) => {
    try {
      setLoading(true);
      setStreamingResponse('');

      if (!currentSession) {
        console.error('No current session available');
        return;
      }

      console.log('Generating AI response with model:', selectedModel);

      // Choose AI model based on selection
      const ai = selectedModel === 'default' ? new DevvAI() : new OpenRouterAI();

      // Get context-aware question if needed
      let questionContext = '';
      if (Math.random() < 0.7 || isFirstMessage) { // 70% chance to ask curated question
        const question = getRandomQuestion(
          currentSession.role,
          currentSession.difficulty,
          currentSession.company,
          currentSession.askedQuestionIds
        );

        if (question) {
          setCurrentQuestion(question);
          markQuestionAsked(question.id);
          questionContext = `Ask this specific question: "${question.question}"`;
          if (question.followups.length > 0 && Math.random() < 0.3) {
            questionContext += ` Potential follow-up: "${question.followups[0]}"`;
          }
        }
      }

      const conversationHistory = currentSession.messages.map(m => ({
        role: m.role === 'interviewer' ? 'assistant' as const : 'user' as const,
        content: m.content,
      }));

      // Enhanced system prompt with multi-model optimization
      const systemPrompt = `You are an expert AI interviewer conducting a ${currentSession.difficulty}-level interview for a ${currentSession.role} position at ${currentSession.company}.

INTERVIEW GUIDELINES:
- Use advanced reasoning for deep technical evaluation
- Ask follow-up questions that test understanding depth
- Maintain conversational flow while being thorough
- Adapt difficulty based on candidate responses
- Be encouraging but professionally challenging
- Provide constructive feedback and hints when appropriate

ROLE-SPECIFIC FOCUS:
${currentSession.role.includes('CCAI') ? '- Google Contact Center AI, Dialogflow, conversation design, customer experience' :
          currentSession.role.includes('Copilot') ? '- Microsoft 365 Copilot, GitHub Copilot, plugin development, AI assistance' :
            currentSession.role.includes('Lex') ? '- Amazon Lex, conversational AI, intent fulfillment, voice interfaces' :
              currentSession.role.includes('Computer Vision') ? '- CV algorithms, object detection, image processing, neural networks' :
                currentSession.role.includes('NLP') ? '- Natural language processing, transformers, BERT/GPT, language models' :
                  currentSession.role.includes('Research') ? '- AI research, publications, novel algorithms, theoretical foundations' :
                    '- General ML/AI concepts, system design, deployment, best practices'
        }

COMPANY CONTEXT - ${currentSession.company.toUpperCase()}:
${currentSession.company === 'Google' ? '- Focus on scale, innovation, research impact, technical excellence' :
          currentSession.company === 'Microsoft' ? '- Emphasize collaboration, growth mindset, inclusive innovation' :
            currentSession.company === 'Amazon' ? '- Customer obsession, ownership, bias for action, dive deep' :
              currentSession.company === 'Meta' ? '- Connect the world, move fast, be bold, focus on impact' :
                currentSession.company === 'OpenAI' ? '- AI safety, beneficial AGI, research excellence, ethical considerations' :
                  '- Startup mentality, innovation, rapid growth, technical challenges'
        }

DIFFICULTY LEVEL - ${currentSession.difficulty.toUpperCase()}:
${currentSession.difficulty === 'entry' ?
          '- Focus on fundamentals, basic concepts, learning mindset, potential\n- Encourage elaboration on projects and coursework\n- Guide through problem-solving process' :
          currentSession.difficulty === 'mid' ?
            '- Practical experience, hands-on projects, deployment challenges\n- System design basics, real-world problem solving\n- Trade-offs and optimization' :
            currentSession.difficulty === 'senior' ?
              '- Advanced technical depth, architecture decisions, team leadership\n- Complex system design, optimization strategies\n- Mentoring and technical direction' :
              '- Strategic thinking, research contributions, industry trends\n- Technical vision, organizational impact, innovation leadership'
        }

RESPONSE STYLE:
- Keep responses concise (2-3 sentences max)
- Ask one clear question at a time
- Build on previous answers naturally
- Show genuine interest in their reasoning
- Provide subtle encouragement and constructive feedback
- Use a professional but friendly tone

${questionContext ? `IMMEDIATE TASK: ${questionContext}` : 'Continue the natural conversation flow based on their response.'}

${isFirstMessage ? 'Start with a warm welcome, introduce yourself as an AI interviewer, and ask about their background.' : ''}`;

      // Create streaming response
      console.log('Creating AI chat completion...');
      const stream = await ai.chat.completions.create({
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: userMessage }
        ],
        temperature: 0.8, // Slightly creative for natural conversation
        max_tokens: 250,
        stream: true,
      });

      let fullResponse = '';

      // Add initial message for streaming
      const initialMessage = {
        role: 'interviewer' as const,
        content: '',
        isTyping: true,
      };
      addMessage(initialMessage);

      // Get the message ID to update it
      const messages = currentSession.messages;

      console.log('Processing streaming response...');
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          setStreamingResponse(fullResponse);

          // Update the message in real-time
          if (messages.length > 0) {
            updateMessage(messages[messages.length - 1].id, {
              content: fullResponse,
              isTyping: true,
            });
          }
        }
      }

      // Final update - remove typing indicator
      if (messages.length > 0) {
        updateMessage(messages[messages.length - 1].id, {
          content: fullResponse,
          isTyping: false,
        });
      }

      // Generate audio if voice enabled
      if (voiceEnabled && fullResponse) {
        try {
          const audio = await elevenlabs.textToSpeech({
            text: fullResponse,
            voice_id: "21m00Tcm4TlvDq8ikWAM", // Professional interview voice
            stability: 0.8,
            similarity_boost: 0.8,
          });

          if (messages.length > 0) {
            updateMessage(messages[messages.length - 1].id, {
              audioUrl: audio.audio_url,
            });
          }

          // Auto-play if enabled
          if (autoPlay && audioRef.current) {
            audioRef.current.src = audio.audio_url;
            audioRef.current.play();
            setPlaying(true);
          }
        } catch (error) {
          console.warn('TTS failed:', error);
        }
      }

      // Set up response timeout for better conversation flow
      responseTimeoutRef.current = setTimeout(() => {
        if (currentSession?.status === 'active') {
          toast({
            title: "💭 Take your time",
            description: "Think through your answer carefully - quality over speed!",
          });
        }
      }, 45000); // 45 second reminder

    } catch (error: any) {
      console.error('Interview AI Error:', error);
      console.error('Error details:', {
        message: error.message,
        model: selectedModel,
        session: currentSession?.id
      });

      // Provide more specific error messages
      let errorMessage = "Failed to generate response. Please try again.";

      if (error.message?.includes('rate limit') || error.message?.includes('9001')) {
        errorMessage = "Rate limit reached. Please wait a moment and try again, or use DevvAI Default model.";
      } else if (error.message?.includes('authentication') || error.message?.includes('unauthorized')) {
        errorMessage = "Authentication error. Please log in again.";
      } else if (error.message?.includes('model')) {
        errorMessage = "Model error. Try switching to DevvAI Default model.";
      }

      toast({
        title: "AI Response Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setStreamingResponse('');
    }
  }, [selectedModel, currentSession, addMessage, updateMessage, setCurrentQuestion, markQuestionAsked, setLoading, setPlaying, voiceEnabled, autoPlay, toast]);

  const startInterview = async () => {
    if (!isAuthenticated) {
      toast({
        title: "❌ Authentication Required",
        description: "Please log in to start an interview",
        variant: "destructive",
      });
      return;
    }

    if (!selectedRole || !selectedCompany || !selectedDifficulty || !selectedModel) {
      toast({
        title: "⚠️ Missing Information",
        description: "Please select role, company, difficulty, and AI model",
        variant: "destructive",
      });
      return;
    }

    console.log('Starting interview with:', {
      role: selectedRole,
      company: selectedCompany,
      difficulty: selectedDifficulty,
      model: selectedModel,
      voiceEnabled,
      user: user?.email
    });

    try {
      // Create new session with enhanced settings
      const session = createSession({
        role: selectedRole,
        company: selectedCompany,
        difficulty: selectedDifficulty as any,
        voiceEnabled,
      });

      startSession(session.id);
      setActiveTab('interview');

      toast({
        title: "🚀 Interview Started!",
        description: `${selectedRole} at ${selectedCompany} using ${aiModels.find(m => m.value === selectedModel)?.label}`,
      });

      // Start with interviewer introduction
      await generateInterviewerResponse(
        `I'm ready to begin the ${selectedDifficulty}-level ${selectedRole} interview at ${selectedCompany}. Let me know a bit about yourself and your background in AI.`,
        true
      );

      setQuestionStartTime(new Date());

    } catch (error) {
      console.error('Error starting interview:', error);
      toast({
        title: "Failed to Start Interview",
        description: "There was an error starting the interview. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentSession || isLoading) return;

    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current);
    }

    // Calculate response time
    const responseTime = questionStartTime
      ? (Date.now() - questionStartTime.getTime()) / 1000
      : 0;

    // Add user message
    addMessage({
      role: 'candidate',
      content: inputMessage,
      responseTime,
      questionId: currentSession.currentQuestion?.id,
    });

    const userMessage = inputMessage;
    setInputMessage('');
    setQuestionStartTime(new Date());

    // Generate AI response
    await generateInterviewerResponse(userMessage);
  };

  const startRecording = async () => {
    try {
      console.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      console.log('Microphone access granted, starting recording...');

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log('Recording stopped, processing audio blob:', audioBlob.size, 'bytes');
        await processAudioRecording(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // Capture every second for better quality
      setRecording(true);

      toast({
        title: "🎤 Recording Started",
        description: "Speak clearly and click stop when finished",
      });

    } catch (error: any) {
      console.error('Recording error:', error);
      toast({
        title: "Recording Failed",
        description: error.message || "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const processAudioRecording = async (audioBlob: Blob) => {
    try {
      setIsProcessingAudio(true);

      console.log('Processing audio recording, size:', audioBlob.size);

      toast({
        title: "🔄 Processing Audio",
        description: "Transcribing your speech...",
      });

      // Upload audio file
      const audioFile = new File([audioBlob], "interview_recording.webm", {
        type: "audio/webm"
      });

      console.log('Uploading audio file...');
      const uploadResult = await upload.uploadFile(audioFile);

      if (!upload.isErrorResponse(uploadResult)) {
        console.log('Audio uploaded successfully:', uploadResult.link);

        // Transcribe using ElevenLabs STT
        console.log('Starting speech-to-text transcription...');
        const transcription = await elevenlabs.speechToText({
          audio_url: uploadResult.link
        });

        console.log('Transcription result:', transcription);

        if (transcription.text && transcription.text.trim().length > 0) {
          setInputMessage(transcription.text);
          setLastTranscription(transcription.text);

          toast({
            title: "✅ Speech Transcribed Successfully",
            description: "Review your answer and click send when ready",
          });
        } else {
          throw new Error("No clear speech detected. Please try speaking more clearly.");
        }
      } else {
        console.error('Upload failed:', uploadResult);
        throw new Error("Failed to upload audio file: " + uploadResult.errMsg);
      }
    } catch (error: any) {
      console.error('Audio processing error:', error);
      let errorMessage = "Could not process audio. Please try again or type your answer.";

      if (error.message?.includes('upload')) {
        errorMessage = "Failed to upload audio. Check your connection.";
      } else if (error.message?.includes('transcription') || error.message?.includes('speech')) {
        errorMessage = "Transcription failed. Try speaking more clearly.";
      }

      toast({
        title: "🎤 Transcription Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessingAudio(false);
    }
  };

  const playAudio = (audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const handleEndInterview = async () => {
    if (!currentSession) return;

    setLoading(true);

    try {
      // Generate comprehensive evaluation using Google Gemini
      const ai = new OpenRouterAI();

      const conversationText = currentSession.messages.map(m =>
        `${m.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.content}`
      ).join('\n\n');

      const response = await ai.chat.completions.create({
        model: 'google/gemini-pro',
        messages: [
          {
            role: 'system',
            content: `You are an expert interview evaluator. Analyze this ${currentSession.difficulty}-level ${currentSession.role} interview comprehensively.

EVALUATION CRITERIA:
- Technical Knowledge: Understanding of AI/ML concepts, tools, frameworks
- Communication: Clarity, structure, professional delivery
- Problem Solving: Approach to challenges, analytical thinking
- Behavioral: Cultural fit, leadership, collaboration

SCORING: Rate each area 0-100 based on the difficulty level.
${currentSession.difficulty === 'entry' ? 'Focus on potential, learning ability, and fundamentals.' :
                currentSession.difficulty === 'mid' ? 'Focus on practical experience and project execution.' :
                  currentSession.difficulty === 'senior' ? 'Focus on technical depth and leadership capabilities.' :
                    'Focus on strategic thinking and industry expertise.'
              }

RESPONSE FORMAT (strict JSON):
{
  "scores": {
    "technical": 85,
    "communication": 90, 
    "problemSolving": 80,
    "behavioral": 88,
    "overall": 86
  },
  "feedback": {
    "strengths": ["Strong technical foundation", "Clear communication"],
    "improvements": ["Could elaborate more on system design", "Consider edge cases"],
    "suggestions": ["Study distributed systems", "Practice behavioral questions"]
  },
  "summary": "Brief overall assessment in 2-3 sentences"
}`
          },
          {
            role: 'user',
            content: `Interview Details:
Role: ${currentSession.role}
Company: ${currentSession.company}
Difficulty: ${currentSession.difficulty}
Duration: ${Math.floor((Date.now() - currentSession.startTime.getTime()) / 60000)} minutes

Conversation:
${conversationText}`
          }
        ],
        temperature: 0.1, // Low temperature for consistent evaluation
        max_tokens: 600,
      });

      const evaluation = response.choices[0].message.content;

      if (evaluation) {
        try {
          const parsed = JSON.parse(evaluation);

          updateScores(parsed.scores);
          updateFeedback(parsed.feedback);

          // Update metrics
          const candidateMessages = currentSession.messages.filter(m => m.role === 'candidate');
          const avgResponseTime = candidateMessages.reduce((acc, m) => acc + (m.responseTime || 0), 0) / candidateMessages.length || 0;

          updateMetrics({
            averageResponseTime: avgResponseTime,
            totalQuestions: currentSession.messages.filter(m => m.role === 'interviewer').length,
            questionsAnswered: candidateMessages.length,
            conversationQuality: parsed.scores.communication,
            technicalAccuracy: parsed.scores.technical,
            communicationClarity: parsed.scores.communication,
          });

          endSession();
          setActiveTab('results');

          toast({
            title: "Interview Complete! 🎉",
            description: `Overall Score: ${parsed.scores.overall}/100`,
          });

        } catch (parseError) {
          console.error('Failed to parse evaluation:', parseError);
          // Fallback evaluation
          updateScores({
            technical: 75,
            communication: 80,
            problemSolving: 70,
            behavioral: 75,
            overall: 75,
          });

          updateFeedback({
            strengths: ['Participated actively in the interview', 'Showed enthusiasm for AI'],
            improvements: ['Could provide more specific examples', 'Consider practicing more technical depth'],
            suggestions: ['Review key AI concepts', 'Practice explaining complex topics simply'],
          });

          endSession();
          setActiveTab('results');
        }
      }

    } catch (error: any) {
      console.error('Evaluation failed:', error);
      toast({
        title: "Evaluation Error",
        description: "Could not generate detailed feedback, but interview data saved.",
        variant: "destructive",
      });

      endSession();
      setActiveTab('results');
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = (message: any) => (
    <div key={message.id} className={`flex gap-3 ${message.role === 'candidate' ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === 'interviewer' ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white' : 'bg-gradient-to-br from-green-500 to-teal-600 text-white'
        }`}>
        {message.role === 'interviewer' ? <Brain className="h-4 w-4" /> : <User className="h-4 w-4" />}
      </div>

      <div className={`max-w-[80%] ${message.role === 'candidate' ? 'text-right' : ''}`}>
        <div className={`p-4 rounded-2xl shadow-sm ${message.role === 'interviewer'
            ? 'bg-muted/50 border border-muted'
            : 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground'
          }`}>
          <p className="text-sm leading-relaxed">
            {message.content}
            {message.isTyping && (
              <span className="inline-flex ml-1">
                <span className="animate-pulse">●</span>
                <span className="animate-pulse delay-100">●</span>
                <span className="animate-pulse delay-200">●</span>
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <span>{message.timestamp?.toLocaleTimeString()}</span>
          {message.responseTime && (
            <Badge variant="outline" className="text-xs">
              {message.responseTime.toFixed(1)}s
            </Badge>
          )}
          {message.audioUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => playAudio(message.audioUrl!)}
              className="h-6 w-6 p-0"
            >
              <Volume2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold">AI Mock Interview</h1>
          {isAuthenticated && (
            <Badge variant="outline" className="gap-1 ml-auto">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Authenticated
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          Practice with Google Gemini-powered interviews, curated questions, and real-time voice interaction
        </p>

        {!isAuthenticated && (
          <div className="mt-4 p-4 border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Authentication Required</span>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              Please log in to access AI interview features and voice interaction.
            </p>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 p-1">
          <TabsTrigger value="start" className="gap-2">
            <Target className="h-4 w-4" />
            Setup
          </TabsTrigger>
          <TabsTrigger value="interview" className="gap-2" disabled={!currentSession}>
            <MessageSquare className="h-4 w-4" />
            Interview
          </TabsTrigger>
          <TabsTrigger value="results" className="gap-2" disabled={!currentSession?.endTime}>
            <Award className="h-4 w-4" />
            Results
          </TabsTrigger>
          <TabsTrigger value="scheduler" className="gap-2">
            <Calendar className="h-4 w-4" />
            Scheduler
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="start" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Interview Configuration
                  </CardTitle>
                  <CardDescription>
                    Set up your AI-powered mock interview with advanced settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">AI Role</label>
                      <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                        <SelectContent>
                          {aiRoles.map(role => (
                            <SelectItem key={role} value={role}>{role}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Target Company</label>
                      <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select company" />
                        </SelectTrigger>
                        <SelectContent>
                          {companies.map(company => (
                            <SelectItem key={company} value={company}>{company}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium">Difficulty Level</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {difficulties.map(diff => (
                        <Card
                          key={diff.value}
                          className={`cursor-pointer transition-all hover:shadow-md ${selectedDifficulty === diff.value ? 'ring-2 ring-primary shadow-md' : ''
                            }`}
                          onClick={() => setSelectedDifficulty(diff.value)}
                        >
                          <CardContent className="p-4">
                            <div className={`font-medium flex items-center gap-2`}>
                              <div className={`w-2 h-2 rounded-full ${diff.value === 'entry' ? 'bg-green-500' :
                                  diff.value === 'mid' ? 'bg-blue-500' :
                                    diff.value === 'senior' ? 'bg-orange-500' : 'bg-red-500'
                                }`}></div>
                              {diff.label}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">{diff.description}</div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium">AI Interview Model</label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select AI model" />
                      </SelectTrigger>
                      <SelectContent>
                        {aiModels.map(model => (
                          <SelectItem key={model.value} value={model.value}>
                            <div className="flex flex-col">
                              <span className="font-medium">{model.label}</span>
                              <span className="text-xs text-muted-foreground">{model.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Voice Interaction</label>
                        <p className="text-xs text-muted-foreground">Enable speech-to-text and text-to-speech</p>
                      </div>
                      <Switch checked={voiceEnabled} onCheckedChange={setVoiceEnabled} />
                    </div>

                    {voiceEnabled && (
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <label className="text-sm font-medium">Auto-play AI Responses</label>
                          <p className="text-xs text-muted-foreground">Automatically play interviewer responses</p>
                        </div>
                        <Switch checked={autoPlay} onCheckedChange={setAutoPlay} />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Button
                      onClick={startInterview}
                      className="w-full gap-2"
                      size="lg"
                      disabled={!selectedRole || !selectedCompany || !selectedDifficulty || !selectedModel}
                    >
                      <Play className="h-4 w-4" />
                      Start AI Interview
                    </Button>

                    {process.env.NODE_ENV === 'development' && (
                      <Button
                        onClick={async () => {
                          console.log('Testing AI connection...');
                          try {
                            const testAI = selectedModel === 'default' ? new DevvAI() : new OpenRouterAI();
                            const response = await testAI.chat.completions.create({
                              model: selectedModel,
                              messages: [{ role: 'user', content: 'Hello, this is a test.' }],
                              max_tokens: 50,
                            });
                            console.log('AI test successful:', response);
                            toast({
                              title: "✅ AI Test Successful",
                              description: "AI model is working correctly",
                            });
                          } catch (error: any) {
                            console.error('AI test failed:', error);
                            toast({
                              title: "❌ AI Test Failed",
                              description: error.message,
                              variant: "destructive",
                            });
                          }
                        }}
                        variant="outline"
                        className="w-full gap-2"
                        size="sm"
                      >
                        <Brain className="h-4 w-4" />
                        Test AI Connection
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    AI Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Sparkles className="h-5 w-5 text-blue-500" />
                    <div className="text-sm">
                      <div className="font-medium">Google Gemini AI</div>
                      <div className="text-muted-foreground">Advanced conversational intelligence</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Headphones className="h-5 w-5 text-green-500" />
                    <div className="text-sm">
                      <div className="font-medium">Voice Interaction</div>
                      <div className="text-muted-foreground">Speech-to-text & text-to-speech</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Target className="h-5 w-5 text-purple-500" />
                    <div className="text-sm">
                      <div className="font-medium">Curated Questions</div>
                      <div className="text-muted-foreground">{AI_INTERVIEW_QUESTIONS.length}+ role-specific questions</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {history.totalInterviews > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Your Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Total Interviews</span>
                        <Badge variant="secondary">{history.totalInterviews}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Average Score</span>
                        <Badge variant="default">{history.averageScore.toFixed(0)}/100</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Improvement Trend</span>
                        <Badge variant={history.improvementTrend > 0 ? "default" : "secondary"}>
                          {history.improvementTrend > 0 ? '+' : ''}{history.improvementTrend.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="interview" className="space-y-6">
          {currentSession && (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Brain className="h-5 w-5 text-primary" />
                        {currentSession.role} Interview
                      </CardTitle>
                      <CardDescription>
                        {currentSession.company} • {currentSession.difficulty} level • Google Gemini AI
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Timer className="h-4 w-4" />
                        {Math.floor((Date.now() - currentSession.startTime.getTime()) / 60000)}m
                      </div>
                      <Badge variant="outline">
                        {currentSession.messages.filter(m => m.role === 'candidate').length} responses
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="flex-1">
                <CardContent className="p-0">
                  <div className="h-96 overflow-y-auto p-6 space-y-6">
                    {currentSession.messages.map(renderMessage)}

                    {streamingResponse && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          <Brain className="h-4 w-4" />
                        </div>
                        <div className="max-w-[80%]">
                          <div className="p-4 rounded-2xl shadow-sm bg-muted/50 border border-muted">
                            <p className="text-sm leading-relaxed">
                              {streamingResponse}
                              <span className="inline-flex ml-1">
                                <span className="animate-pulse">●</span>
                                <span className="animate-pulse delay-100">●</span>
                                <span className="animate-pulse delay-200">●</span>
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {isLoading && !streamingResponse && (
                      <div className="flex justify-center">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating response...
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Type your answer here or use voice input..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      disabled={isLoading}
                      rows={3}
                      className="resize-none"
                    />

                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {voiceEnabled && (
                          <Button
                            variant={isRecording ? "destructive" : "outline"}
                            onClick={isRecording ? stopRecording : startRecording}
                            disabled={isLoading || isProcessingAudio}
                            className="gap-2"
                          >
                            {isRecording ? (
                              <>
                                <Square className="h-4 w-4" />
                                Stop Recording
                              </>
                            ) : isProcessingAudio ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Mic className="h-4 w-4" />
                                Voice Answer
                              </>
                            )}
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          onClick={handleEndInterview}
                          disabled={isLoading}
                          className="gap-2"
                        >
                          <Square className="h-4 w-4" />
                          End Interview
                        </Button>

                        <Badge variant="outline" className="text-xs">
                          {currentSession?.messages.filter(m => m.role === 'candidate').length || 0} responses
                        </Badge>
                      </div>

                      <Button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || isLoading}
                        className="gap-2"
                        size="lg"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Send Answer
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {currentSession?.endTime && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-primary" />
                        Interview Results
                      </CardTitle>
                      <CardDescription>
                        {currentSession.role} at {currentSession.company} •
                        Duration: {Math.floor(((currentSession.endTime?.getTime() || 0) - currentSession.startTime.getTime()) / 60000)} minutes •
                        Model: {aiModels.find(m => m.value === selectedModel)?.label || 'Unknown'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Share2 className="h-4 w-4" />
                            Share
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Share Interview Results</DialogTitle>
                            <DialogDescription>
                              Share your mock interview performance with potential employers or for portfolio purposes.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg">
                              <div className="text-3xl font-bold text-primary mb-2">
                                {currentSession.scores.overall}/100
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {currentSession.role} Interview Score
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button className="flex-1 gap-2">
                                <Download className="h-4 w-4" />
                                Download Report
                              </Button>
                              <Button variant="outline" className="flex-1 gap-2">
                                <Bookmark className="h-4 w-4" />
                                Save to Portfolio
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Badge variant="secondary" className="gap-1">
                        <Gauge className="h-3 w-3" />
                        {currentSession.scores.overall}/100
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Performance Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(currentSession.scores).map(([category, score]) => (
                      <div key={category}>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="capitalize font-medium flex items-center gap-2">
                            {category === 'technical' && <Brain className="h-4 w-4 text-blue-500" />}
                            {category === 'communication' && <MessageSquare className="h-4 w-4 text-green-500" />}
                            {category === 'problemSolving' && <Target className="h-4 w-4 text-orange-500" />}
                            {category === 'behavioral' && <User className="h-4 w-4 text-purple-500" />}
                            {category === 'overall' && <Award className="h-4 w-4 text-yellow-500" />}
                            {category.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{score}/100</span>
                            {score >= 90 ? <CheckCircle className="h-4 w-4 text-green-500" /> :
                              score >= 70 ? <AlertCircle className="h-4 w-4 text-yellow-500" /> :
                                <Info className="h-4 w-4 text-red-500" />}
                          </div>
                        </div>
                        <Progress
                          value={score}
                          className="h-3"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Interview Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {currentSession.messages.filter(m => m.role === 'candidate').length}
                        </div>
                        <div className="text-sm text-muted-foreground">Responses Given</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {currentSession.metrics.averageResponseTime.toFixed(1)}s
                        </div>
                        <div className="text-sm text-muted-foreground">Avg Response Time</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {currentSession.messages.filter(m => m.role === 'interviewer').length}
                        </div>
                        <div className="text-sm text-muted-foreground">Questions Asked</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {Math.floor(currentSession.metrics.conversationQuality || 0)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Conversation Quality</div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        AI Assessment Summary
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Great interview performance! You demonstrated strong technical knowledge and communication skills.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Strengths Identified
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {(currentSession.feedback?.strengths || []).map((strength, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                          <span>{strength}</span>
                        </li>
                      ))}
                      {(!currentSession.feedback?.strengths || currentSession.feedback.strengths.length === 0) && (
                        <li className="text-sm text-muted-foreground italic">
                          Strengths assessment will be available after interview completion.
                        </li>
                      )}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                      Areas for Improvement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {(currentSession.feedback?.improvements || []).map((improvement, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                          <span>{improvement}</span>
                        </li>
                      ))}
                      {(!currentSession.feedback?.improvements || currentSession.feedback.improvements.length === 0) && (
                        <li className="text-sm text-muted-foreground italic">
                          Improvement suggestions will be available after interview completion.
                        </li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    AI-Powered Career Suggestions
                  </CardTitle>
                  <CardDescription>
                    Personalized recommendations to advance your AI career
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(currentSession.feedback?.suggestions || []).map((suggestion, index) => (
                      <div key={index} className="p-4 border rounded-lg bg-muted/20">
                        <div className="flex items-start gap-2">
                          <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{suggestion}</span>
                        </div>
                      </div>
                    ))}
                    {(!currentSession.feedback?.suggestions || currentSession.feedback.suggestions.length === 0) && (
                      <div className="col-span-2 text-center py-8 text-muted-foreground">
                        <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Career suggestions will be generated after interview completion.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-center gap-4 pt-4">
                <Button variant="outline" className="gap-2" onClick={() => setActiveTab('start')}>
                  <RefreshCw className="h-4 w-4" />
                  Practice Again
                </Button>
                <Button className="gap-2" onClick={() => setActiveTab('history')}>
                  <BarChart3 className="h-4 w-4" />
                  View Progress
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Interview History
              </CardTitle>
              <CardDescription>
                Track your progress and improvement over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {history.sessions.length > 0 ? (
                <div className="space-y-4">
                  {history.sessions.slice(0, 5).map((session) => (
                    <div key={session.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-medium">{session.role}</div>
                          <div className="text-sm text-muted-foreground">
                            {session.company} • {session.difficulty} level
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">{session.scores.overall}</div>
                          <div className="text-xs text-muted-foreground">Overall Score</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{session.startTime.toLocaleDateString()}</span>
                        <span>
                          {Math.floor(((session.endTime?.getTime() || 0) - session.startTime.getTime()) / 60000)}m duration
                        </span>
                        <span>{session.messages.filter(m => m.role === 'candidate').length} responses</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No interview history yet. Complete your first interview to see results here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduler" className="space-y-6">
          <InterviewScheduler />
        </TabsContent>
      </Tabs>
    </div>
  );
}