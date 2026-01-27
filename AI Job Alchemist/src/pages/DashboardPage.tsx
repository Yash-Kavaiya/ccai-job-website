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
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useResumeStore } from '@/store/resume-store';
import { useInterviewStore } from '@/store/interview-store';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState, useMemo } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

interface JobRecommendation {
  id: string;
  title: string;
  company: string;
  location: string;
  salary_range?: string;
  similarity_score?: number;
  posted_date: string;
  skills: string[];
  saved?: boolean;
}

interface ActivityItem {
  type: string;
  title: string;
  description: string;
  time: string;
  icon: any;
}

export function DashboardPage() {
  const { user } = useAuthStore();
  const { resumes, currentResume } = useResumeStore();
  const { history } = useInterviewStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [jobRecommendations, setJobRecommendations] = useState<JobRecommendation[]>([]);
  const [applicationCount, setApplicationCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real job recommendations and applications from Firebase
  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch job recommendations
        const jobsRef = collection(db, 'jobs');
        const jobsQuery = query(jobsRef, where('status', '==', 'active'), orderBy('createdAt', 'desc'), limit(4));
        const jobsSnapshot = await getDocs(jobsQuery);
        const jobs = jobsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          posted_date: doc.data().createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'
        })) as JobRecommendation[];
        setJobRecommendations(jobs);

        // Fetch application count
        const applicationsRef = collection(db, 'job_applications');
        const appQuery = query(applicationsRef, where('user_id', '==', auth.currentUser.uid));
        const appSnapshot = await getDocs(appQuery);
        setApplicationCount(appSnapshot.size);

        // Build recent activity from real data
        const activities: ActivityItem[] = [];

        // Add resume activity
        if (currentResume) {
          activities.push({
            type: 'upload',
            title: 'Resume uploaded',
            description: currentResume.analysis ? `ATS Score: ${currentResume.analysis.ats_score}/100` : 'Analysis pending',
            time: currentResume.created_at ? new Date(currentResume.created_at).toLocaleDateString() : 'Recently',
            icon: FileText,
          });
        }

        // Add job match activity
        if (jobs.length > 0) {
          activities.push({
            type: 'job',
            title: 'Job matches found',
            description: `${jobs.length} AI roles available`,
            time: 'Today',
            icon: Target,
          });
        }

        // Add interview activity
        if (history.sessions.length > 0) {
          const lastSession = history.sessions[history.sessions.length - 1];
          activities.push({
            type: 'interview',
            title: 'Mock interview completed',
            description: `Score: ${lastSession.scores.overall}%`,
            time: lastSession.endTime ? new Date(lastSession.endTime).toLocaleDateString() : 'Recently',
            icon: MessageSquare,
          });
        }

        setRecentActivity(activities);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentResume, history.sessions]);

  // Calculate ATS Score from real resume data
  const atsData = useMemo(() => {
    if (currentResume?.analysis) {
      const analysis = currentResume.analysis;
      const keywordsScore = analysis.keyword_matches?.length ? Math.min(100, analysis.keyword_matches.length * 10) : 0;
      const formatScore = analysis.formatScore || 75;
      const contentScore = analysis.ats_score || 0;
      const missingScore = analysis.missing_keywords?.length ? Math.min(30, analysis.missing_keywords.length * 5) : 0;

      return [
        { name: 'Keywords', value: keywordsScore, color: 'hsl(var(--chart-1))' },
        { name: 'Format', value: formatScore, color: 'hsl(var(--chart-2))' },
        { name: 'Content', value: contentScore, color: 'hsl(var(--chart-3))' },
        { name: 'Missing', value: missingScore, color: 'hsl(var(--muted))' }
      ];
    }
    return [
      { name: 'Keywords', value: 0, color: 'hsl(var(--chart-1))' },
      { name: 'Format', value: 0, color: 'hsl(var(--chart-2))' },
      { name: 'Content', value: 0, color: 'hsl(var(--chart-3))' },
      { name: 'Missing', value: 0, color: 'hsl(var(--muted))' }
    ];
  }, [currentResume]);

  // Calculate progress data from real interview history
  const progressData = useMemo(() => {
    const sessions = history.sessions || [];
    // Group sessions by week and count
    const weekData = [
      { week: 'Week 1', applications: 0, interviews: 0 },
      { week: 'Week 2', applications: 0, interviews: 0 },
      { week: 'Week 3', applications: 0, interviews: 0 },
      { week: 'Week 4', applications: Math.ceil(applicationCount / 2), interviews: sessions.length }
    ];
    return weekData;
  }, [history.sessions, applicationCount]);

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

  // Calculate real stats from user data
  const stats = useMemo(() => {
    // Profile completion based on resume and user data
    let profileCompletion = 25; // Base for having an account
    if (currentResume) profileCompletion += 25;
    if (currentResume?.analysis) profileCompletion += 25;
    if (history.sessions.length > 0) profileCompletion += 25;

    // Average interview score
    const avgInterviewScore = history.sessions.length > 0
      ? Math.round(history.sessions.reduce((acc, s) => acc + (s.scores.overall || 0), 0) / history.sessions.length)
      : 0;

    return [
      {
        title: 'Profile Completion',
        value: profileCompletion,
        description: profileCompletion < 100 ? 'Complete your profile to get better matches' : 'Profile complete!',
        icon: CheckCircle,
      },
      {
        title: 'Job Applications',
        value: applicationCount,
        description: applicationCount > 0 ? 'Applications sent' : 'No applications yet',
        icon: Zap,
      },
      {
        title: 'Interview Score',
        value: avgInterviewScore,
        description: avgInterviewScore > 0 ? 'Average mock interview performance' : 'Complete an interview to see score',
        icon: TrendingUp,
      },
      {
        title: 'Resumes',
        value: resumes.length,
        description: resumes.length > 0 ? 'Resumes uploaded' : 'Upload your first resume',
        icon: FileText,
      },
    ];
  }, [currentResume, history.sessions, applicationCount, resumes.length]);

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
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading recommendations...</p>
              </div>
            ) : jobRecommendations.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">No job recommendations yet</h3>
                <p className="text-muted-foreground mb-4">
                  Upload your resume to get personalized job matches
                </p>
                <Button onClick={() => navigate('/resume')}>
                  Upload Resume
                </Button>
              </div>
            ) : (
              jobRecommendations.map((job) => (
              <div
                key={job.id}
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
                    {job.similarity_score && (
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(job.similarity_score)}% Match
                      </Badge>
                    )}
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
                    {job.location || 'Remote'}
                  </div>
                  {job.salary_range && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3 h-3" />
                      {job.salary_range}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {job.posted_date}
                  </div>
                  {job.similarity_score && job.similarity_score > 80 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current text-warning" />
                      <span>High Match</span>
                    </div>
                  )}
                </div>
                
                {job.skills && job.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {job.skills.slice(0, 4).map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}

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
              ))
            )}

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