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
  MapPin,
  Building,
  Clock,
  DollarSign,
  Bookmark,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useResumeStore } from '@/store/resume-store';
import { useInterviewStore } from '@/store/interview-store';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState, useMemo } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { jobService } from '@/services/jobService';

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
  icon: typeof FileText;
}

function formatPostedDate(value: unknown): string {
  if (!value) return 'Recently';
  if (typeof value === 'string') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? 'Recently' : d.toLocaleDateString();
  }
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toLocaleDateString();
  }
  return 'Recently';
}

export function DashboardPage() {
  const { user } = useAuthStore();
  const { resumes, currentResume, fetchResumes } = useResumeStore();
  const { history } = useInterviewStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [jobRecommendations, setJobRecommendations] = useState<JobRecommendation[]>([]);
  const [applicationCount, setApplicationCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) {
        setIsLoading(false);
        return;
      }

      try {
        let jobs: JobRecommendation[] = [];
        try {
          const firebaseJobs = await jobService.getAllJobs(4);
          jobs = firebaseJobs.map((job) => ({
            id: job.id,
            title: job.title,
            company: job.company,
            location: job.location || 'Remote',
            salary_range:
              job.salary_min && job.salary_max
                ? `$${job.salary_min.toLocaleString()} – $${job.salary_max.toLocaleString()}`
                : undefined,
            posted_date: formatPostedDate(job.posted_at),
            skills: job.skills_required || [],
          }));
        } catch {
          // Fallback: try status/createdAt schema used by some older docs
          try {
            const jobsRef = collection(db, 'jobs');
            const jobsQuery = query(jobsRef, where('status', '==', 'active'), orderBy('createdAt', 'desc'), limit(4));
            const jobsSnapshot = await getDocs(jobsQuery);
            jobs = jobsSnapshot.docs.map((docSnap) => {
              const data = docSnap.data();
              return {
                id: docSnap.id,
                title: data.title || 'Untitled role',
                company: data.company || 'Company',
                location: data.location || 'Remote',
                salary_range: data.salary_range,
                posted_date: formatPostedDate(data.createdAt || data.posted_at),
                skills: data.skills || data.skills_required || [],
              } as JobRecommendation;
            });
          } catch (fallbackError) {
            console.error('Error fetching jobs:', fallbackError);
          }
        }
        setJobRecommendations(jobs);

        let apps = 0;
        try {
          const applicationsRef = collection(db, 'job_applications');
          const appQuery = query(applicationsRef, where('user_id', '==', auth.currentUser.uid));
          const appSnapshot = await getDocs(appQuery);
          apps = appSnapshot.size;
        } catch {
          try {
            const applicationsRef = collection(db, 'applications');
            const appQuery = query(applicationsRef, where('user_id', '==', auth.currentUser.uid));
            const appSnapshot = await getDocs(appQuery);
            apps = appSnapshot.size;
          } catch (appError) {
            console.error('Error fetching applications:', appError);
          }
        }
        setApplicationCount(apps);

        const activities: ActivityItem[] = [];

        if (currentResume) {
          activities.push({
            type: 'upload',
            title: 'Resume uploaded',
            description: currentResume.analysis
              ? `ATS Score: ${currentResume.analysis.ats_score}/100`
              : 'Analysis pending',
            time: currentResume.created_at
              ? new Date(currentResume.created_at).toLocaleDateString()
              : 'Recently',
            icon: FileText,
          });
        }

        if (jobs.length > 0) {
          activities.push({
            type: 'job',
            title: 'Open roles available',
            description: `${jobs.length} active role${jobs.length === 1 ? '' : 's'} loaded`,
            time: 'Today',
            icon: Target,
          });
        }

        if (history.sessions.length > 0) {
          const lastSession = history.sessions[history.sessions.length - 1];
          activities.push({
            type: 'interview',
            title: 'Mock interview completed',
            description: `Score: ${lastSession.scores.overall}%`,
            time: lastSession.endTime
              ? new Date(lastSession.endTime).toLocaleDateString()
              : 'Recently',
            icon: MessageSquare,
          });
        }

        if (apps > 0) {
          activities.push({
            type: 'application',
            title: 'Applications submitted',
            description: `${apps} application${apps === 1 ? '' : 's'} on record`,
            time: 'Recent',
            icon: Zap,
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

  const hasAtsAnalysis = Boolean(currentResume?.analysis);

  const atsData = useMemo(() => {
    if (!currentResume?.analysis) return [];
    const analysis = currentResume.analysis;
    const keywordsScore = analysis.keyword_matches?.length
      ? Math.min(100, analysis.keyword_matches.length * 10)
      : 0;
    const formatScore = typeof analysis.formatScore === 'number' ? analysis.formatScore : 0;
    const contentScore = analysis.ats_score || 0;
    const missingScore = analysis.missing_keywords?.length
      ? Math.min(30, analysis.missing_keywords.length * 5)
      : 0;

    return [
      { name: 'Keywords', value: keywordsScore, color: 'hsl(var(--chart-1))' },
      { name: 'Format', value: formatScore, color: 'hsl(var(--chart-2))' },
      { name: 'Content', value: contentScore, color: 'hsl(var(--chart-3))' },
      { name: 'Gaps', value: missingScore, color: 'hsl(var(--muted))' },
    ];
  }, [currentResume]);

  const progressData = useMemo(() => {
    const sessions = history.sessions || [];
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;

    return [3, 2, 1, 0].map((weeksAgo) => {
      const start = now - (weeksAgo + 1) * weekMs;
      const end = now - weeksAgo * weekMs;
      const interviews = sessions.filter((s) => {
        const t = s.endTime ? new Date(s.endTime).getTime() : 0;
        return t >= start && t < end;
      }).length;
      // Applications lack per-week timestamps in store; show total only on current week
      const applications = weeksAgo === 0 ? applicationCount : 0;
      return {
        week: weeksAgo === 0 ? 'This week' : `${weeksAgo}w ago`,
        applications,
        interviews,
      };
    }).reverse();
  }, [history.sessions, applicationCount]);

  const interviewCount = history.sessions.length;

  const aiInsights = useMemo(() => {
    const insights: { title: string; body: string }[] = [];
    if (currentResume?.analysis?.missing_keywords?.length) {
      const top = currentResume.analysis.missing_keywords[0];
      insights.push({
        title: 'Skill gap',
        body: `Consider adding “${top}” — missing from your resume vs common AI roles.`,
      });
    }
    if (jobRecommendations.length > 0) {
      insights.push({
        title: 'Open roles',
        body: `${jobRecommendations.length} active role${jobRecommendations.length === 1 ? '' : 's'} ready to review in Job Search.`,
      });
    }
    if (!currentResume) {
      insights.push({
        title: 'Next step',
        body: 'Upload a resume to unlock ATS scoring and personalized matching.',
      });
    } else if (currentResume.analysis) {
      insights.push({
        title: 'ATS tip',
        body: `Your current ATS score is ${currentResume.analysis.ats_score}/100. Improve keywords for better matches.`,
      });
    }
    if (insights.length === 0) {
      insights.push({
        title: 'Getting started',
        body: 'Search jobs or practice a mock interview to generate personalized insights.',
      });
    }
    return insights.slice(0, 3);
  }, [currentResume, jobRecommendations]);

  const quickActions = [
    {
      icon: Upload,
      title: 'Upload Resume',
      description: 'Get ATS score and suggestions',
      badge: resumes.length === 0 ? 'Start here' : `${resumes.length} on file`,
      badgeVariant: (resumes.length === 0 ? 'default' : 'secondary') as 'default' | 'secondary',
      action: () => navigate('/resume'),
    },
    {
      icon: Search,
      title: 'Search AI Jobs',
      description: 'Find roles matching your skills',
      badge: jobRecommendations.length > 0 ? `${jobRecommendations.length} open` : 'Browse',
      badgeVariant: 'secondary' as const,
      action: () => navigate('/jobs'),
    },
    {
      icon: MessageSquare,
      title: 'Practice Interview',
      description: 'AI-powered mock interviews',
      badge: interviewCount > 0 ? `${interviewCount} done` : 'Try it',
      badgeVariant: 'default' as const,
      action: () => navigate('/interview'),
    },
    {
      icon: Brain,
      title: 'AI Matching',
      description: 'Rank jobs against your resume',
      badge: 'Fast',
      badgeVariant: 'secondary' as const,
      action: () => navigate('/matching'),
    },
  ];

  const stats = useMemo(() => {
    let profileCompletion = 25;
    if (currentResume) profileCompletion += 25;
    if (currentResume?.analysis) profileCompletion += 25;
    if (history.sessions.length > 0) profileCompletion += 25;

    const avgInterviewScore =
      history.sessions.length > 0
        ? Math.round(
            history.sessions.reduce((acc, s) => acc + (s.scores.overall || 0), 0) /
              history.sessions.length
          )
        : 0;

    return [
      {
        title: 'Profile Completion',
        value: profileCompletion,
        description:
          profileCompletion < 100
            ? 'Complete your profile to get better matches'
            : 'Profile complete!',
        icon: CheckCircle,
        isPercent: true,
      },
      {
        title: 'Job Applications',
        value: applicationCount,
        description: applicationCount > 0 ? 'Applications sent' : 'No applications yet',
        icon: Zap,
        isPercent: false,
      },
      {
        title: 'Interview Score',
        value: avgInterviewScore,
        description:
          avgInterviewScore > 0
            ? 'Average mock interview performance'
            : 'Complete an interview to see score',
        icon: TrendingUp,
        isPercent: true,
      },
      {
        title: 'Resumes',
        value: resumes.length,
        description: resumes.length > 0 ? 'Resumes uploaded' : 'Upload your first resume',
        icon: FileText,
        isPercent: false,
      },
    ];
  }, [currentResume, history.sessions, applicationCount, resumes.length]);

  return (
    <div className="p-6 space-y-8 overflow-y-auto max-h-full animate-in fade-in-50 duration-300">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back{user?.name ? `, ${user.name}` : ''}
        </h1>
        <p className="text-muted-foreground">
          Your career workspace — stats and recommendations from your real activity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <button
            key={action.title}
            type="button"
            className="text-left rounded-xl border bg-card p-4 transition-all hover:border-accent/40 hover:shadow-sm group"
            onClick={action.action}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                <action.icon className="w-5 h-5 text-accent" />
              </div>
              <Badge variant={action.badgeVariant} className="text-xs">
                {action.badge}
              </Badge>
            </div>
            <h3 className="font-semibold mb-1">{action.title}</h3>
            <p className="text-sm text-muted-foreground">{action.description}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border/60 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {stat.isPercent ? `${stat.value}%` : stat.value}
              </div>
              {stat.isPercent && <Progress value={stat.value} className="mb-2" />}
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/60 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Job recommendations
            </CardTitle>
            <CardDescription>Active roles from your job board</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4" />
                <p className="text-muted-foreground">Loading recommendations…</p>
              </div>
            ) : jobRecommendations.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">No open roles yet</h3>
                <p className="text-muted-foreground mb-4">
                  Browse the job board or upload a resume for better matches.
                </p>
                <Button onClick={() => navigate('/jobs')}>Open Job Search</Button>
              </div>
            ) : (
              jobRecommendations.map((job) => (
                <div
                  key={job.id}
                  className="p-4 rounded-xl border hover:border-accent/40 transition-colors cursor-pointer group"
                  onClick={() => navigate('/jobs', { state: { selectedJob: job } })}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                        <Building className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <h4 className="font-semibold group-hover:text-accent transition-colors">
                          {job.title}
                        </h4>
                        <p className="text-sm text-muted-foreground font-medium">{job.company}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast({
                          title: 'Saved',
                          description: `${job.title} — open Saved Jobs to manage bookmarks`,
                        });
                        navigate('/jobs?tab=saved');
                      }}
                    >
                      <Bookmark className="w-4 h-4" />
                    </Button>
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
                      Apply
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/matching');
                      }}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}

            <div className="text-center pt-2">
              <Button variant="outline" onClick={() => navigate('/jobs')}>
                View all jobs
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/60 shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                ATS score
              </CardTitle>
              <CardDescription>From your current resume analysis</CardDescription>
            </CardHeader>
            <CardContent>
              {!hasAtsAnalysis ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  <p className="mb-4">No analysis yet. Upload a resume to see your ATS breakdown.</p>
                  <Button variant="outline" onClick={() => navigate('/resume')}>
                    Upload resume
                  </Button>
                </div>
              ) : (
                <>
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
                    Improve ATS score
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Activity
              </CardTitle>
              <CardDescription>Applications and interviews from your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-32 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="week" className="text-xs" />
                    <YAxis className="text-xs" allowDecimals={false} />
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
                  <div className="text-2xl font-bold text-chart-1">{applicationCount}</div>
                  <div className="text-xs text-muted-foreground">Applications</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-chart-2">{interviewCount}</div>
                  <div className="text-xs text-muted-foreground">Interviews</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiInsights.map((insight) => (
                <div key={insight.title} className="rounded-lg border bg-muted/30 p-3">
                  <h4 className="font-medium text-sm mb-1">{insight.title}</h4>
                  <p className="text-xs text-muted-foreground">{insight.body}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {recentActivity.length > 0 && (
        <Card className="border-border/60 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Recent activity
            </CardTitle>
            <CardDescription>Based on your resumes, interviews, and applications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.map((item, idx) => (
              <div
                key={`${item.type}-${idx}`}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-accent" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-medium text-sm">{item.title}</h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {item.time}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => navigate('/interview')}
          className="rounded-xl border p-6 text-left transition-all hover:border-accent/40 hover:shadow-sm"
        >
          <MessageSquare className="w-6 h-6 text-accent mb-3" />
          <h3 className="font-semibold mb-1">Mock interviews</h3>
          <p className="text-sm text-muted-foreground">
            Practice with AI interviewers and track your scores.
          </p>
        </button>
        <button
          type="button"
          onClick={() => navigate('/jobs?tab=apply')}
          className="rounded-xl border p-6 text-left transition-all hover:border-accent/40 hover:shadow-sm"
        >
          <Zap className="w-6 h-6 text-accent mb-3" />
          <h3 className="font-semibold mb-1">Quick apply</h3>
          <p className="text-sm text-muted-foreground">
            Apply to roles from your matched job list in one place.
          </p>
        </button>
      </div>
    </div>
  );
}
