import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAIAgentsStore } from '@/store/ai-agents-store';
import { useAuthStore } from '@/store/auth-store';
import { elevenlabs } from '@/lib/devv-backend-stub';
import {
  MessageSquare,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Bot,
  User,
  Minimize2,
  Maximize2,
  X,
  RotateCcw,
  Loader2,
  Sparkles,
  Brain,
  History,
  Settings
} from 'lucide-react';

interface AIChatbotProps {
  isFloating?: boolean;
  onClose?: () => void;
  className?: string;
}

export default function AIChatbot({ isFloating = false, onClose, className = '' }: AIChatbotProps) {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const {
    currentChatSession,
    chatSessions,
    isTyping,
    startChatSession,
    sendMessage,
    endChatSession,
    clearTyping
  } = useAIAgentsStore();

  useEffect(() => {
    if (!currentChatSession && user) {
      startChatSession('AI Assistant Chat');
    }
  }, [user, currentChatSession, startChatSession]);

  useEffect(() => {
    scrollToBottom();
  }, [currentChatSession?.messages, isTyping]);

  useEffect(() => {
    // Cleanup audio on unmount
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        setCurrentAudio(null);
      }
    };
  }, [currentAudio]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentChatSession) return;

    const message = inputValue.trim();
    setInputValue('');
    
    try {
      await sendMessage(message, currentChatSession.id);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await handleVoiceInput(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: 'Recording Started',
        description: 'Speak your message clearly...',
      });

    } catch (error) {
      toast({
        title: 'Microphone Error',
        description: 'Could not access microphone. Please check permissions.',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleVoiceInput = async (audioBlob: Blob) => {
    try {
      // Convert blob to file for upload
      const audioFile = new File([audioBlob], 'voice-input.wav', { type: 'audio/wav' });
      
      // Upload audio file (would need to implement file upload first)
      // For now, simulate with a placeholder
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Transcribe audio to text
      const transcription = await elevenlabs.speechToText({
        audio_url: audioUrl
      });

      if (transcription.text.trim()) {
        setInputValue(transcription.text);
        toast({
          title: 'Voice Transcribed',
          description: 'Message ready to send!',
        });
      }

    } catch (error) {
      console.error('Voice input failed:', error);
      toast({
        title: 'Transcription Failed',
        description: 'Could not process voice input. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const speakMessage = async (text: string) => {
    if (!isVoiceEnabled) return;

    try {
      setIsSpeaking(true);
      
      // Stop any currently playing audio
      if (currentAudio) {
        currentAudio.pause();
        setCurrentAudio(null);
      }

      const response = await elevenlabs.textToSpeech({
        text: text,
        voice_id: '21m00Tcm4TlvDq8ikWAM', // Default voice
        stability: 0.7,
        similarity_boost: 0.8
      });

      const audio = new Audio(response.audio_url);
      setCurrentAudio(audio);
      
      audio.onended = () => {
        setIsSpeaking(false);
        setCurrentAudio(null);
      };
      
      audio.onerror = () => {
        setIsSpeaking(false);
        setCurrentAudio(null);
      };

      await audio.play();

    } catch (error) {
      console.error('Text-to-speech failed:', error);
      setIsSpeaking(false);
      toast({
        title: 'Speech Error',
        description: 'Could not generate speech. Please check your connection.',
        variant: 'destructive',
      });
    }
  };

  const stopSpeaking = () => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
      setIsSpeaking(false);
    }
  };

  const handleNewChat = () => {
    if (currentChatSession) {
      endChatSession(currentChatSession.id);
    }
    startChatSession();
    setInputValue('');
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const quickSuggestions = [
    "How can I improve my AI career prospects?",
    "What are the latest trends in AI jobs?",
    "Help me optimize my resume for ATS",
    "What skills should I learn for AI roles?",
    "How do I prepare for AI interviews?",
    "Show me networking opportunities"
  ];

  if (!user) {
    return (
      <Card className={`${className} ${isFloating ? 'fixed bottom-4 right-4 w-80 z-50' : ''}`}>
        <CardContent className="p-6 text-center">
          <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">AI Assistant</h3>
          <p className="text-sm text-muted-foreground">
            Please log in to chat with your AI career assistant
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} ${
      isFloating 
        ? `fixed bottom-4 right-4 z-50 transition-all duration-300 ${
            isMinimized ? 'w-64 h-16' : 'w-96 h-[600px]'
          }`
        : 'h-[600px]'
    }`}>
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Bot className="w-6 h-6 text-blue-500" />
              {isTyping && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">AI Assistant</CardTitle>
              <p className="text-xs text-muted-foreground">
                {isTyping ? 'Thinking...' : 'Online'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
              className="p-1"
            >
              {isVoiceEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleNewChat}
              className="p-1"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            
            {isFloating && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1"
                >
                  {isMinimized ? (
                    <Maximize2 className="w-4 h-4" />
                  ) : (
                    <Minimize2 className="w-4 h-4" />
                  )}
                </Button>
                
                {onClose && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onClose}
                    className="p-1"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="flex flex-col h-full p-0">
          {/* Messages Area */}
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-4 pb-4">
              {/* Welcome Message */}
              {(!currentChatSession?.messages || currentChatSession.messages.length === 0) && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-sm">
                          👋 Hi {user.name}! I'm your AI career assistant. I can help you with:
                        </p>
                        <ul className="text-sm mt-2 space-y-1 text-muted-foreground">
                          <li>• Career guidance and job search strategies</li>
                          <li>• Resume optimization and ATS tips</li>
                          <li>• Interview preparation and practice</li>
                          <li>• AI industry trends and insights</li>
                          <li>• Skill development recommendations</li>
                        </ul>
                      </div>
                      
                      {/* Quick Suggestions */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Quick questions:</p>
                        <div className="flex flex-wrap gap-2">
                          {quickSuggestions.slice(0, 3).map((suggestion, index) => (
                            <Button
                              key={index}
                              size="sm"
                              variant="outline"
                              className="text-xs h-auto py-1 px-2"
                              onClick={() => setInputValue(suggestion)}
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              {currentChatSession?.messages.map((message) => (
                <div key={message.id} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-blue-500 text-white'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className={`p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-4'
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatTime(message.timestamp)}
                      </span>
                      
                      {message.role === 'assistant' && isVoiceEnabled && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-xs"
                          onClick={() => speakMessage(message.content)}
                          disabled={isSpeaking}
                        >
                          {isSpeaking ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Volume2 className="w-3 h-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex items-center gap-1">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                      <span className="text-xs text-muted-foreground ml-2">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <Separator />

          {/* Input Area */}
          <div className="p-4 space-y-3">
            {/* Voice Controls */}
            {isVoiceEnabled && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Voice mode enabled</span>
                {isSpeaking && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={stopSpeaking}
                    className="h-6 px-2"
                  >
                    <VolumeX className="w-3 h-3 mr-1" />
                    Stop
                  </Button>
                )}
              </div>
            )}

            {/* Input Row */}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your AI career..."
                  disabled={isTyping}
                  className="resize-none"
                />
              </div>
              
              {/* Voice Input Button */}
              <Button
                size="sm"
                variant="outline"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isTyping}
                className={`px-3 ${isRecording ? 'bg-red-50 border-red-200' : ''}`}
              >
                {isRecording ? (
                  <MicOff className="w-4 h-4 text-red-500" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </Button>
              
              {/* Send Button */}
              <Button
                size="sm"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="px-3"
              >
                {isTyping ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Quick Actions */}
            {inputValue === '' && (
              <div className="flex flex-wrap gap-1">
                {quickSuggestions.slice(3, 6).map((suggestion, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant="ghost"
                    className="text-xs h-6 px-2 text-muted-foreground"
                    onClick={() => setInputValue(suggestion)}
                  >
                    {suggestion.split(' ').slice(0, 3).join(' ')}...
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}