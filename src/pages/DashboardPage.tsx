import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { 
  FileText, 
  Search, 
  MessageSquare, 
  TrendingUp, 
  CheckCircle,
  Upload,
  Brain,
  Zap,
  Target,
  Users,
  Calendar,
  Star,
  MapPin,
  Building,
  Clock,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Bookmark,
  ExternalLink
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  // ATS Score Pie Chart Data
  const atsData = [
    { name: 'Keywords', value: 85, color: 'hsl(var(--chart-1))' },
    { name: 'Format', value: 90, color: 'hsl(var(--chart-2))' },
    { name: 'Content', value: 78, color: 'hsl(var(--chart-3))' },
    { name: 'Missing', value: 15, color: 'hsl(var(--muted))' }
  ];

  // Progress Tracker Data
  const progressData = [
    { week: 'Week 1', applications: 5, interviews: 1 },
    { week: 'Week 2', applications: 8, interviews: 2 },
    { week: 'Week 3', applications: 12, interviews: 3 },
    { week: 'Week 4', applications: 15, interviews: 5 }
  ];

  // Personalized Job Recommendations
  const jobRecommendations = [
    {
      title: 'Senior AI Engineer',
      company: 'Google',
      location: 'Mountain View, CA',
      salary: '$180K - $250K',
      similarity: 95,
      posted: '2 hours ago',
      tags: ['AI', 'TensorFlow', 'Python', 'MLOps'],
      saved: false
    },
    {
      title: 'Microsoft Copilot Developer',
      company: 'Microsoft',
      location: 'Seattle, WA',
      salary: '$160K - $220K',
      similarity: 92,
      posted: '5 hours ago',
      tags: ['Copilot', 'Azure', 'TypeScript', 'OpenAI'],
      saved: true
    },
    {
      title: 'ML Infrastructure Engineer',
      company: 'OpenAI',
      location: 'San Francisco, CA',
      salary: '$200K - $300K',
      similarity: 89,
      posted: '1 day ago',
      tags: ['MLOps', 'Kubernetes', 'AWS', 'Python'],
      saved: false
    },
    {
      title: 'Conversational AI Specialist',
      company: 'Amazon',
      location: 'Austin, TX',
      salary: '$150K - $200K',
      similarity: 87,
      posted: '2 days ago',
      tags: ['Lex', 'NLP', 'AWS', 'Node.js'],
      saved: false
    }
  ];

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'Upload Resume':
        navigate('/resume');
        break;
      case 'Search AI Jobs':
        navigate('/jobs');
        break;
      case 'Practice Interview':
        navigate('/interview');
        break;
      case 'Social Profile':
        navigate('/social');
        break;
      case 'AI Job Matching':
        navigate('/jobs');
        break;
    }
  };

  const quickActions = [
    {
      icon: Upload,
      title: 'Upload Resume',
      description: 'Get AI-powered ATS score and suggestions',
      badge: 'Start Here',
      badgeVariant: 'default' as const,
      action: () => handleQuickAction('Upload Resume'),
    },
    {
      icon: Search,
      title: 'Search AI Jobs',
      description: 'Find jobs matching your skills',
      badge: '200+ New',
      badgeVariant: 'secondary' as const,
      action: () => handleQuickAction('Search AI Jobs'),
    },
    {
      icon: MessageSquare,
      title: 'Practice Interview',
      description: 'AI-powered mock interviews',
      badge: 'Active',
      badgeVariant: 'default' as const,
      action: () => handleQuickAction('Practice Interview'),
    },
    {
      icon: Users,
      title: 'Social Profile',
      description: 'Share your professional profile',
      badge: 'Network',
      badgeVariant: 'secondary' as const,
      action: () => handleQuickAction('Social Profile'),
    },
  ];

  const recentActivity = [
    {
      type: 'upload',
      title: 'Resume uploaded',
      description: 'ATS Score: 85/100',
      time: '2 hours ago',
      icon: FileText,
    },
    {
      type: 'job',
      title: 'New job matches found',
      description: '12 AI roles at top companies',
      time: '4 hours ago',
      icon: Target,
    },
    {
      type: 'interview',
      title: 'Mock interview completed',
      description: 'Score: 92% - Excellent!',
      time: '1 day ago',
      icon: MessageSquare,
    },
  ];

  const stats = [
    {
      title: 'Profile Completion',
      value: 75,
      description: 'Complete your profile to get better matches',
      icon: CheckCircle,
    },
    {
      title: 'Job Applications',
      value: 12,
      description: 'Applications sent this month',
      icon: Zap,
    },
    {
      title: 'Interview Score',
      value: 92,
      description: 'Average mock interview performance',
      icon: TrendingUp,
    },
    {
      title: 'Network Connections',
      value: 45,
      description: 'AI professionals in your network',
      icon: Users,
    },
  ];

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-full">
      {/* Welcome Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">
          Welcome back, {user?.name || 'there'}! 👋
        </h1>
        <p className="text-muted-foreground">
          Your AI-powered career journey continues. Here's what's happening today.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Card 
            key={action.title} 
            className="hover:shadow-md transition-shadow cursor-pointer group"
            onClick={action.action}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <action.icon className="w-5 h-5 text-accent" />
                </div>
                <Badge variant={action.badgeVariant} className="text-xs">
                  {action.badge}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <h3 className="font-semibold mb-1">{action.title}</h3>
              <p className="text-sm text-muted-foreground">{action.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {stat.title === 'Profile Completion' || stat.title === 'Interview Score' 
                  ? `${stat.value}%` 
                  : stat.value
                }
              </div>
              {(stat.title === 'Profile Completion' || stat.title === 'Interview Score') && (
                <Progress value={stat.value} className="mb-2" />
              )}
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personalized Job Feed */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Personalized Job Recommendations
            </CardTitle>
            <CardDescription>
              AI-matched opportunities based on your profile and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {jobRecommendations.map((job, index) => (
              <div 
                key={index} 
                className="p-4 rounded-lg border hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => navigate('/jobs', { state: { selectedJob: job } })}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                      <Building className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-semibold group-hover:text-accent transition-colors">{job.title}</h4>
                      <p className="text-sm text-muted-foreground font-medium">{job.company}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {job.similarity}% Match
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast({
                          title: job.saved ? "Removed from saved jobs" : "Job saved",
                          description: job.saved ? `${job.title} removed from your saved jobs` : `${job.title} added to your saved jobs`,
                        });
                      }}
                    >
                      <Bookmark className={`w-4 h-4 ${job.saved ? 'fill-current text-accent' : ''}`} />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    {job.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-3 h-3" />
                    {job.salary}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {job.posted}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current text-warning" />
                    <span>High Match</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {job.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/jobs', { state: { selectedJob: job, autoApply: true } });
                    }}
                  >
                    Apply Now
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`https://jobs.google.com/search?q=${encodeURIComponent(job.title + ' ' + job.company)}`, '_blank');
                    }}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
            
            <div className="text-center pt-4">
              <Button variant="outline" onClick={() => navigate('/jobs')}>
                View All Recommendations
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ATS Score and Progress */}
        <div className="space-y-6">
          {/* ATS Score Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                ATS Score Breakdown
              </CardTitle>
              <CardDescription>
                Resume optimization analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-40 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={atsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {atsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {atsData.slice(0, 3).map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-sm" 
                        style={{ backgroundColor: item.color }}
                      />
                      {item.name}
                    </div>
                    <span className="font-medium">{item.value}%</span>
                  </div>
                ))}
              </div>
              <Button 
                className="w-full mt-4" 
                variant="outline" 
                onClick={() => navigate('/resume')}
              >
                Improve ATS Score
              </Button>
            </CardContent>
          </Card>

          {/* Progress Tracker */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Progress Tracker
              </CardTitle>
              <CardDescription>
                Your application activity over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-32 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="week" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="applications" 
                      stroke="hsl(var(--chart-1))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--chart-1))', strokeWidth: 2, r: 3 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="interviews" 
                      stroke="hsl(var(--chart-2))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--chart-2))', strokeWidth: 2, r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-chart-1">15</div>
                  <div className="text-xs text-muted-foreground">Applications</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-chart-2">5</div>
                  <div className="text-xs text-muted-foreground">Interviews</div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 text-sm">
                <div className="flex items-center gap-1 text-success">
                  <ArrowUp className="w-3 h-3" />
                  <span>25% increase</span>
                </div>
                <span className="text-muted-foreground">from last month</span>
              </div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="glass-card p-3 rounded-lg">
                <h4 className="font-medium text-sm mb-1">🎯 Top Skill Gap</h4>
                <p className="text-xs text-muted-foreground">
                  Add "LangChain" - found in 67% of target roles
                </p>
              </div>
              <div className="glass-card p-3 rounded-lg">
                <h4 className="font-medium text-sm mb-1">📈 Hot Trend</h4>
                <p className="text-xs text-muted-foreground">
                  AI Agent roles up 45% this month
                </p>
              </div>
              <div className="glass-card p-3 rounded-lg">
                <h4 className="font-medium text-sm mb-1">💡 Quick Win</h4>
                <p className="text-xs text-muted-foreground">
                  Update resume with missing keywords
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Feature Preview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-dashed border-2">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-6 h-6 text-muted-foreground" />
            </div>
            <CardTitle>Mock Interview System</CardTitle>
            <CardDescription>
              Practice with AI interviewers for roles at Google, Microsoft, and more
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              This feature will be available in a later phase
            </p>
            <Button variant="outline" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        <Card className="border-dashed border-2">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-muted-foreground" />
            </div>
            <CardTitle>One-Click Apply</CardTitle>
            <CardDescription>
              Apply to multiple jobs instantly with AI-optimized applications
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              This feature will be available in a later phase
            </p>
            <Button variant="outline" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}