import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import AIAgentsDashboard from '@/components/agents/AIAgentsDashboard';
import AIChatbot from '@/components/agents/AIChatbot';
import { useAuthStore } from '@/store/auth-store';
import { useAIAgentsStore } from '@/store/ai-agents-store';
import {
  Bot,
  Brain,
  Sparkles,
  MessageSquare,
  TrendingUp,
  Users,
  FileText,
  Zap,
  Shield,
  Clock,
  Target,
  BarChart3,
  Lightbulb,
  Network,
  Mail,
  Settings,
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  Star,
  Workflow,
  Cpu,
  Database,
  Globe,
  Mic,
  Volume2
} from 'lucide-react';

export default function AIAgentsPage() {
  const { user } = useAuthStore();
  const { agents, activeAgents, pendingActions, completedActions } = useAIAgentsStore();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showChatbot, setShowChatbot] = useState(false);

  const agentFeatures = [
    {
      icon: <Bot className="w-8 h-8 text-blue-500" />,
      title: 'Career Coach Agent',
      description: 'Monitors your career progress and provides personalized guidance, job suggestions, and daily insights.',
      features: [
        'Daily career progress analysis',
        'Personalized job recommendations',
        'Skill development roadmaps',
        'Email digest with insights',
        'Goal tracking and milestones'
      ],
      isActive: activeAgents.includes('career-coach'),
      automationLevel: 'High',
      updateFrequency: '6 hours'
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-green-500" />,
      title: 'Trend Analyzer Agent',
      description: 'Scans industry sources for emerging AI trends, new technologies, and skill demands.',
      features: [
        'Real-time industry trend monitoring',
        'Emerging skills identification',
        'Market opportunity analysis',
        'Technology adoption predictions',
        'Competitive intelligence gathering'
      ],
      isActive: activeAgents.includes('trend-analyzer'),
      automationLevel: 'High',
      updateFrequency: '12 hours'
    },
    {
      icon: <Users className="w-8 h-8 text-purple-500" />,
      title: 'Networking Assistant',
      description: 'Identifies networking opportunities and suggests connections at top AI companies.',
      features: [
        'LinkedIn profile analysis',
        'Strategic connection suggestions',
        'Industry event recommendations',
        'Mutual connection identification',
        'Networking follow-up reminders'
      ],
      isActive: activeAgents.includes('networking-suggester'),
      automationLevel: 'Medium',
      updateFrequency: '24 hours'
    },
    {
      icon: <FileText className="w-8 h-8 text-orange-500" />,
      title: 'Auto Resume Builder',
      description: 'Automatically generates tailored resumes for specific job applications and optimizes for ATS.',
      features: [
        'Job-specific resume optimization',
        'ATS compatibility enhancement',
        'Multi-format resume generation',
        'Keyword optimization',
        'A/B testing for variations'
      ],
      isActive: activeAgents.includes('auto-resume-builder'),
      automationLevel: 'On-demand',
      updateFrequency: 'As needed'
    },
    {
      icon: <MessageSquare className="w-8 h-8 text-indigo-500" />,
      title: 'AI Assistant Chatbot',
      description: 'Site-wide intelligent assistant for answering questions and providing guidance.',
      features: [
        'Natural conversation flow',
        'Context-aware responses',
        'Voice interaction support',
        'Multi-modal communication',
        '24/7 availability'
      ],
      isActive: activeAgents.includes('chatbot'),
      automationLevel: 'Real-time',
      updateFrequency: 'Instant'
    }
  ];

  const capabilities = [
    {
      icon: <Brain className="w-6 h-6 text-blue-500" />,
      title: 'Advanced AI Models',
      description: 'Powered by Google Gemini, Claude-3-Sonnet, and custom models for specialized tasks.'
    },
    {
      icon: <Database className="w-6 h-6 text-green-500" />,
      title: 'Real-time Data Processing',
      description: 'Continuous analysis of job markets, industry trends, and user behavior patterns.'
    },
    {
      icon: <Shield className="w-6 h-6 text-purple-500" />,
      title: 'Privacy-First Design',
      description: 'All data processing follows GDPR compliance with user consent and anonymization.'
    },
    {
      icon: <Zap className="w-6 h-6 text-yellow-500" />,
      title: 'Automated Workflows',
      description: 'End-to-end automation from job discovery to application submission.'
    },
    {
      icon: <Globe className="w-6 h-6 text-teal-500" />,
      title: 'Multi-Source Integration',
      description: 'Aggregates data from LinkedIn, Indeed, company websites, and industry reports.'
    },
    {
      icon: <Volume2 className="w-6 h-6 text-red-500" />,
      title: 'Voice & Speech AI',
      description: 'ElevenLabs integration for voice interactions and speech synthesis.'
    }
  ];

  const useCases = [
    {
      title: 'Daily Career Optimization',
      description: 'Agents analyze your profile overnight and deliver personalized recommendations each morning.',
      steps: ['Profile analysis', 'Market scanning', 'Opportunity matching', 'Insight generation', 'Email delivery']
    },
    {
      title: 'Proactive Job Discovery',
      description: 'Automatically finds and ranks job opportunities based on your skills and preferences.',
      steps: ['Multi-source crawling', 'Quality filtering', 'Relevance scoring', 'Duplicate removal', 'User notification']
    },
    {
      title: 'Intelligent Networking',
      description: 'Identifies high-value connections and provides conversation starters.',
      steps: ['Profile matching', 'Connection analysis', 'Relevance scoring', 'Outreach templates', 'Follow-up reminders']
    },
    {
      title: 'Adaptive Resume Creation',
      description: 'Generates custom resume versions for each application automatically.',
      steps: ['Job description analysis', 'Skill alignment', 'Keyword optimization', 'Format selection', 'ATS testing']
    }
  ];

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <Bot className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">AI Agents</h3>
              <p className="text-muted-foreground mb-4">
                Please log in to access your autonomous AI career assistants
              </p>
              <Button>Login to Continue</Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="relative">
              <Bot className="w-12 h-12 text-blue-500" />
              <Sparkles className="w-6 h-6 text-yellow-500 absolute -top-1 -right-1" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Agents Platform
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Autonomous AI assistants working 24/7 to accelerate your AI career. 
            From proactive job discovery to personalized coaching, let AI do the heavy lifting.
          </p>
          
          <div className="flex items-center justify-center gap-6 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{activeAgents.length}</div>
              <div className="text-sm text-muted-foreground">Active Agents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{pendingActions.length}</div>
              <div className="text-sm text-muted-foreground">Pending Actions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{completedActions.length}</div>
              <div className="text-sm text-muted-foreground">Completed Today</div>
            </div>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="agents">AI Agents</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
            <TabsTrigger value="use-cases">Use Cases</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Workflow className="w-5 h-5" />
                  Autonomous AI Features
                </CardTitle>
                <CardDescription>
                  Advanced AI agents that work independently to boost your career prospects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {agentFeatures.map((feature, index) => (
                    <div key={index} className="space-y-4 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        {feature.icon}
                        <Badge variant={feature.isActive ? 'default' : 'secondary'}>
                          {feature.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold mb-2">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {feature.description}
                        </p>
                      </div>
                      
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Automation:</span>
                          <span className="font-medium">{feature.automationLevel}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Updates:</span>
                          <span className="font-medium">{feature.updateFrequency}</span>
                        </div>
                      </div>
                      
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        {feature.features.slice(0, 3).map((feat, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                            {feat}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold mb-1">Talk to AI Assistant</h3>
                      <p className="text-sm text-muted-foreground">
                        Get instant career guidance
                      </p>
                    </div>
                    <MessageSquare className="w-8 h-8 text-blue-500" />
                  </div>
                  <Button 
                    className="w-full mt-4" 
                    onClick={() => setShowChatbot(true)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Start Chat
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold mb-1">Run All Agents</h3>
                      <p className="text-sm text-muted-foreground">
                        Trigger full analysis cycle
                      </p>
                    </div>
                    <PlayCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <Button className="w-full mt-4" variant="outline">
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Run Now
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold mb-1">Agent Settings</h3>
                      <p className="text-sm text-muted-foreground">
                        Configure notifications
                      </p>
                    </div>
                    <Settings className="w-8 h-8 text-purple-500" />
                  </div>
                  <Button className="w-full mt-4" variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI Agents Tab */}
          <TabsContent value="agents" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {agentFeatures.map((agent, index) => (
                <Card key={index} className={agent.isActive ? 'border-green-200 bg-green-50/20' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {agent.icon}
                        <div>
                          <CardTitle className="text-lg">{agent.title}</CardTitle>
                          <CardDescription>{agent.description}</CardDescription>
                        </div>
                      </div>
                      <Badge variant={agent.isActive ? 'default' : 'secondary'}>
                        {agent.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Automation Level</p>
                          <p className="font-semibold">{agent.automationLevel}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Update Frequency</p>
                          <p className="font-semibold">{agent.updateFrequency}</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-2">Key Features:</p>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          {agent.features.map((feature, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          variant={agent.isActive ? 'outline' : 'default'}
                          className="flex-1"
                        >
                          {agent.isActive ? 'Configure' : 'Activate'}
                        </Button>
                        {agent.isActive && (
                          <Button size="sm" variant="outline">
                            <PlayCircle className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <AIAgentsDashboard />
          </TabsContent>

          {/* Capabilities Tab */}
          <TabsContent value="capabilities" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="w-5 h-5" />
                  AI Platform Capabilities
                </CardTitle>
                <CardDescription>
                  Advanced technologies powering your autonomous AI agents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {capabilities.map((capability, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center gap-3">
                        {capability.icon}
                        <h3 className="font-semibold">{capability.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {capability.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Technical Architecture */}
            <Card>
              <CardHeader>
                <CardTitle>Technical Architecture</CardTitle>
                <CardDescription>
                  How our AI agents work together to optimize your career
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <Database className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                      <h4 className="font-semibold mb-1">Data Layer</h4>
                      <p className="text-xs text-muted-foreground">
                        Real-time job market data, user profiles, and industry trends
                      </p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Brain className="w-8 h-8 mx-auto mb-2 text-green-500" />
                      <h4 className="font-semibold mb-1">AI Processing</h4>
                      <p className="text-xs text-muted-foreground">
                        Multi-model AI analysis with context-aware decision making
                      </p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Zap className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                      <h4 className="font-semibold mb-1">Action Layer</h4>
                      <p className="text-xs text-muted-foreground">
                        Automated workflows and human-in-the-loop validation
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Privacy & Security</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• GDPR-compliant data processing with user consent</li>
                      <li>• Encrypted data transmission and storage</li>
                      <li>• Anonymized analytics and trend analysis</li>
                      <li>• Rate limiting and API abuse prevention</li>
                      <li>• Human oversight for critical career decisions</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Use Cases Tab */}
          <TabsContent value="use-cases" className="space-y-6">
            <div className="space-y-6">
              {useCases.map((useCase, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-500" />
                      {useCase.title}
                    </CardTitle>
                    <CardDescription>{useCase.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                      {useCase.steps.map((step, stepIndex) => (
                        <React.Fragment key={stepIndex}>
                          <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg whitespace-nowrap">
                            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                              {stepIndex + 1}
                            </div>
                            <span className="text-sm font-medium">{step}</span>
                          </div>
                          {stepIndex < useCase.steps.length - 1 && (
                            <div className="text-muted-foreground">→</div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Success Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Success Metrics
                </CardTitle>
                <CardDescription>
                  How AI agents improve your career outcomes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">3x</div>
                    <div className="text-sm text-muted-foreground">More job matches</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">85%</div>
                    <div className="text-sm text-muted-foreground">ATS pass rate</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-1">2h</div>
                    <div className="text-sm text-muted-foreground">Time saved daily</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 mb-1">95%</div>
                    <div className="text-sm text-muted-foreground">User satisfaction</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Floating Chatbot */}
        {showChatbot && (
          <AIChatbot
            isFloating={true}
            onClose={() => setShowChatbot(false)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}