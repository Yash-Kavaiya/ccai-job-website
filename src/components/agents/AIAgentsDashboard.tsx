import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAIAgentsStore } from '@/store/ai-agents-store';
import {
  Bot,
  Brain,
  TrendingUp,
  Users,
  FileText,
  MessageSquare,
  Settings,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Star,
  Activity,
  Mail,
  BarChart3,
  Lightbulb,
  Network
} from 'lucide-react';

export default function AIAgentsDashboard() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('overview');
  
  const {
    agents,
    activeAgents,
    actions,
    pendingActions,
    completedActions,
    trends,
    networkingSuggestions,
    progressMetrics,
    coachingInsights,
    isProcessing,
    notificationSettings,
    emailScheduler,
    initializeAgents,
    activateAgent,
    deactivateAgent,
    runAgent,
    runAllActiveAgents,
    updateActionStatus,
    dismissAction,
    completeAction,
    updateSettings,
    sendDailyCareerDigest,
    sendWeeklyCareerReport,
    sendScheduledEmails
  } = useAIAgentsStore();

  useEffect(() => {
    initializeAgents();
  }, [initializeAgents]);

  const getAgentIcon = (type: string) => {
    switch (type) {
      case 'career-coach': return <Bot className="w-5 h-5" />;
      case 'trend-analyzer': return <TrendingUp className="w-5 h-5" />;
      case 'networking-suggester': return <Users className="w-5 h-5" />;
      case 'auto-resume-builder': return <FileText className="w-5 h-5" />;
      case 'chatbot': return <MessageSquare className="w-5 h-5" />;
      default: return <Brain className="w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleAgentToggle = async (agentId: string, isActive: boolean) => {
    try {
      if (isActive) {
        await activateAgent(agentId);
        toast({
          title: 'Agent Activated',
          description: 'The agent has been activated and will start running automatically.',
        });
      } else {
        await deactivateAgent(agentId);
        toast({
          title: 'Agent Deactivated',
          description: 'The agent has been deactivated and stopped.',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update agent status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleRunAgent = async (agentId: string) => {
    try {
      await runAgent(agentId);
      toast({
        title: 'Agent Running',
        description: 'The agent is now processing and will update shortly.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to run agent. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleActionComplete = (actionId: string) => {
    completeAction(actionId);
    toast({
      title: 'Action Completed',
      description: 'Thank you for the feedback! This helps improve our recommendations.',
    });
  };

  const handleActionDismiss = (actionId: string) => {
    dismissAction(actionId);
    toast({
      title: 'Action Dismissed',
      description: 'This recommendation has been dismissed.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Agents</h1>
          <p className="text-muted-foreground">
            Autonomous AI assistants working on your career advancement
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={runAllActiveAgents}
            disabled={isProcessing}
            variant="outline"
          >
            {isProcessing ? (
              <Activity className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            Run All Agents
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Agents</p>
                <p className="text-2xl font-bold">{activeAgents.length}</p>
              </div>
              <Bot className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Actions</p>
                <p className="text-2xl font-bold">{pendingActions.length}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed Today</p>
                <p className="text-2xl font-bold">
                  {completedActions.filter(a => 
                    Date.now() - a.createdAt < 24 * 60 * 60 * 1000
                  ).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Insights Generated</p>
                <p className="text-2xl font-bold">{coachingInsights.length}</p>
              </div>
              <Lightbulb className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Career Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Career Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Profile Completeness</span>
                    <span>{Math.round(progressMetrics.profileCompleteness || 0)}%</span>
                  </div>
                  <Progress value={progressMetrics.profileCompleteness || 0} />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Job Match Quality</span>
                    <span>{Math.round(progressMetrics.jobMatchQuality || 0)}%</span>
                  </div>
                  <Progress value={progressMetrics.jobMatchQuality || 0} />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Application Progress</span>
                    <span>{Math.round(progressMetrics.applicationProgress || 0)}%</span>
                  </div>
                  <Progress value={progressMetrics.applicationProgress || 0} />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Skill Alignment</span>
                    <span>{Math.round(progressMetrics.skillAlignment || 0)}%</span>
                  </div>
                  <Progress value={progressMetrics.skillAlignment || 0} />
                </div>
              </CardContent>
            </Card>

            {/* Recent Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent AI Actions</CardTitle>
                <CardDescription>Latest recommendations from your AI agents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingActions.slice(0, 4).map((action) => (
                    <div key={action.id} className="flex items-start justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`text-xs ${getPriorityColor(action.priority)}`}>
                            {action.priority}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(action.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="font-medium text-sm">{action.title}</p>
                        <p className="text-xs text-muted-foreground">{action.description}</p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleActionComplete(action.id)}
                        >
                          <CheckCircle className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleActionDismiss(action.id)}
                        >
                          <XCircle className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {pendingActions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No pending actions</p>
                      <p className="text-xs">Your AI agents will generate recommendations soon</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Latest Career Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coachingInsights.slice(0, 6).map((insight, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-blue-50/50">
                    <div className="flex items-start gap-3">
                      <Star className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                      <p className="text-sm">{insight}</p>
                    </div>
                  </div>
                ))}
                
                {coachingInsights.length === 0 && (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    <Lightbulb className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No insights generated yet</p>
                    <p className="text-xs">Run the Career Coach agent to get personalized advice</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {agents.map((agent) => (
              <Card key={agent.id} className={agent.isActive ? 'border-green-200 bg-green-50/20' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getAgentIcon(agent.type)}
                      <div>
                        <CardTitle className="text-lg">{agent.name}</CardTitle>
                        <CardDescription>{agent.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={agent.isActive}
                        onCheckedChange={(checked) => handleAgentToggle(agent.id, checked)}
                      />
                      {agent.isActive && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRunAgent(agent.id)}
                          disabled={isProcessing}
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Agent Status */}
                    <div className="flex items-center justify-between text-sm">
                      <span>Status:</span>
                      <Badge variant={agent.isActive ? 'default' : 'secondary'}>
                        {agent.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Runs</p>
                        <p className="font-semibold">{agent.metrics.totalRuns}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Success Rate</p>
                        <p className="font-semibold">
                          {agent.metrics.totalRuns > 0 
                            ? Math.round((agent.metrics.successfulRuns / agent.metrics.totalRuns) * 100)
                            : 0}%
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Actions Generated</p>
                        <p className="font-semibold">{agent.metrics.actionsGenerated}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last Run</p>
                        <p className="font-semibold">
                          {agent.lastRun 
                            ? new Date(agent.lastRun).toLocaleDateString()
                            : 'Never'
                          }
                        </p>
                      </div>
                    </div>
                    
                    {/* Configuration */}
                    {agent.config.runInterval && agent.config.runInterval > 0 && (
                      <div className="flex items-center justify-between text-sm pt-2 border-t">
                        <span>Run Interval:</span>
                        <span>{agent.config.runInterval} minutes</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">AI Agent Actions</h3>
            <Badge variant="outline">{pendingActions.length} Pending</Badge>
          </div>
          
          <div className="space-y-4">
            {actions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Bot className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Actions Yet</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    Your AI agents will start generating personalized recommendations once they analyze your profile and activity.
                  </p>
                  <Button 
                    className="mt-4" 
                    onClick={runAllActiveAgents}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Activity className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    Run Agents Now
                  </Button>
                </CardContent>
              </Card>
            ) : (
              actions.map((action) => (
                <Card key={action.id} className={
                  action.status === 'pending' ? 'border-l-4 border-l-blue-500' :
                  action.status === 'completed' ? 'border-l-4 border-l-green-500' :
                  action.status === 'dismissed' ? 'opacity-60' : ''
                }>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={`${getPriorityColor(action.priority)}`}>
                            {action.priority}
                          </Badge>
                          <Badge variant="outline">
                            {action.type.replace('-', ' ')}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(action.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <h4 className="font-semibold mb-1">{action.title}</h4>
                        <p className="text-muted-foreground mb-3">{action.description}</p>
                        
                        {action.data && Object.keys(action.data).length > 0 && (
                          <div className="bg-muted p-3 rounded-lg text-sm">
                            <details>
                              <summary className="cursor-pointer font-medium">View Details</summary>
                              <pre className="mt-2 whitespace-pre-wrap">
                                {JSON.stringify(action.data, null, 2)}
                              </pre>
                            </details>
                          </div>
                        )}
                      </div>
                      
                      {action.status === 'pending' && (
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            onClick={() => handleActionComplete(action.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleActionDismiss(action.id)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Dismiss
                          </Button>
                        </div>
                      )}
                      
                      {action.status === 'completed' && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                      
                      {action.status === 'dismissed' && (
                        <Badge variant="secondary">
                          <XCircle className="w-3 h-3 mr-1" />
                          Dismissed
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Career Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Career Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {coachingInsights.map((insight, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <p className="text-sm">{insight}</p>
                    </div>
                  ))}
                  
                  {coachingInsights.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Lightbulb className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No career insights yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Networking Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="w-5 h-5" />
                  Networking Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {networkingSuggestions.slice(0, 5).map((suggestion) => (
                    <div key={suggestion.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{suggestion.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {suggestion.title} at {suggestion.company}
                          </p>
                          <p className="text-xs mt-1">{suggestion.connectionReason}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {Math.round(suggestion.matchScore * 100)}% match
                            </Badge>
                            {suggestion.mutualConnections && (
                              <span className="text-xs text-muted-foreground">
                                {suggestion.mutualConnections} mutual connections
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {networkingSuggestions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Network className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No networking suggestions yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                AI Industry Trends
              </CardTitle>
              <CardDescription>
                Latest trends and insights from AI industry analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trends.map((trend) => (
                  <div key={trend.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{trend.category}</Badge>
                        <Badge 
                          className={
                            trend.impact === 'positive' ? 'bg-green-100 text-green-800' :
                            trend.impact === 'negative' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }
                        >
                          {trend.impact}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {Math.round(trend.confidence * 100)}% confidence
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(trend.detectedAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <h4 className="font-semibold mb-2">{trend.trend}</h4>
                    
                    {trend.recommendations.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-1">Recommendations:</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {trend.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start gap-1">
                              <span>•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
                
                {trends.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Trends Analyzed Yet</h3>
                    <p className="max-w-md mx-auto">
                      Activate the Trend Analyzer agent to start monitoring AI industry trends and emerging opportunities.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Notification Settings
              </CardTitle>
              <CardDescription>
                Configure proactive email notifications from your AI career agents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Master Email Toggle</p>
                  <p className="text-sm text-muted-foreground">
                    Enable/disable all email notifications globally
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.email}
                  onCheckedChange={(checked) => updateSettings({ email: checked })}
                />
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Daily Career Digest</p>
                    <p className="text-sm text-muted-foreground">
                      Daily progress & job matches
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.dailyDigest}
                    onCheckedChange={(checked) => updateSettings({ dailyDigest: checked })}
                    disabled={!notificationSettings.email}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Weekly Career Report</p>
                    <p className="text-sm text-muted-foreground">
                      Comprehensive weekly insights
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.weeklyReport}
                    onCheckedChange={(checked) => updateSettings({ weeklyReport: checked })}
                    disabled={!notificationSettings.email}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Trend Alerts</p>
                    <p className="text-sm text-muted-foreground">
                      AI industry developments
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.trendAlerts}
                    onCheckedChange={(checked) => updateSettings({ trendAlerts: checked })}
                    disabled={!notificationSettings.email}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Job Opportunities</p>
                    <p className="text-sm text-muted-foreground">
                      High-match job alerts
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.jobSuggestions}
                    onCheckedChange={(checked) => updateSettings({ jobSuggestions: checked })}
                    disabled={!notificationSettings.email}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Skill Development</p>
                    <p className="text-sm text-muted-foreground">
                      Learning recommendations
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.skillRecommendations}
                    onCheckedChange={(checked) => updateSettings({ skillRecommendations: checked })}
                    disabled={!notificationSettings.email}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Networking Prompts</p>
                    <p className="text-sm text-muted-foreground">
                      Strategic connection suggestions
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.networkingReminders}
                    onCheckedChange={(checked) => updateSettings({ networkingReminders: checked })}
                    disabled={!notificationSettings.email}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Career Milestones</p>
                    <p className="text-sm text-muted-foreground">
                      Achievement celebrations
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.careerMilestones}
                    onCheckedChange={(checked) => updateSettings({ careerMilestones: checked })}
                    disabled={!notificationSettings.email}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Urgent Alerts</p>
                    <p className="text-sm text-muted-foreground">
                      Time-sensitive opportunities
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.urgentAlerts}
                    onCheckedChange={(checked) => updateSettings({ urgentAlerts: checked })}
                    disabled={!notificationSettings.email}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium mb-2">Digest Timing</p>
                  <div className="flex gap-2">
                    <Button
                      variant={notificationSettings.digestTime === 'morning' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateSettings({ digestTime: 'morning' })}
                    >
                      Morning (8 AM)
                    </Button>
                    <Button
                      variant={notificationSettings.digestTime === 'evening' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateSettings({ digestTime: 'evening' })}
                    >
                      Evening (6 PM)
                    </Button>
                  </div>
                </div>
                
                <div>
                  <p className="font-medium mb-2">Frequency</p>
                  <div className="flex gap-2">
                    <Button
                      variant={notificationSettings.frequency === 'daily' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateSettings({ frequency: 'daily' })}
                    >
                      Daily
                    </Button>
                    <Button
                      variant={notificationSettings.frequency === 'weekly' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateSettings({ frequency: 'weekly' })}
                    >
                      Weekly
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email Metrics Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Email Activity
              </CardTitle>
              <CardDescription>
                Track your email notification engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{emailScheduler?.emailMetrics?.totalSent || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Sent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{emailScheduler?.emailMetrics?.dailyDigestsSent || 0}</div>
                  <div className="text-sm text-muted-foreground">Daily Digests</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{emailScheduler?.emailMetrics?.weeklyReportsSent || 0}</div>
                  <div className="text-sm text-muted-foreground">Weekly Reports</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{emailScheduler?.emailMetrics?.trendAlertsSent || 0}</div>
                  <div className="text-sm text-muted-foreground">Trend Alerts</div>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Pending Emails</span>
                  <span className="font-medium">{emailScheduler?.pendingEmails?.filter(e => e.status === 'pending').length || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Last Email Sent</span>
                  <span className="font-medium">
                    {emailScheduler?.emailMetrics?.lastEmailSent 
                      ? new Date(emailScheduler.emailMetrics.lastEmailSent).toLocaleDateString()
                      : 'Never'
                    }
                  </span>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await sendDailyCareerDigest();
                      toast({
                        title: 'Daily Digest Sent',
                        description: 'Your daily career digest has been sent to your email.',
                      });
                    } catch (error) {
                      toast({
                        title: 'Error',
                        description: 'Failed to send daily digest.',
                        variant: 'destructive',
                      });
                    }
                  }}
                  disabled={!notificationSettings.email || !notificationSettings.dailyDigest}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Daily Digest
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await sendWeeklyCareerReport();
                      toast({
                        title: 'Weekly Report Sent',
                        description: 'Your weekly career report has been sent to your email.',
                      });
                    } catch (error) {
                      toast({
                        title: 'Error',
                        description: 'Failed to send weekly report.',
                        variant: 'destructive',
                      });
                    }
                  }}
                  disabled={!notificationSettings.email || !notificationSettings.weeklyReport}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Send Weekly Report
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await sendScheduledEmails();
                      toast({
                        title: 'Scheduled Emails Processed',
                        description: 'All pending emails have been processed.',
                      });
                    } catch (error) {
                      toast({
                        title: 'Error',
                        description: 'Failed to process scheduled emails.',
                        variant: 'destructive',
                      });
                    }
                  }}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Process Scheduled
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}