import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useRecruiterStore } from '@/store/recruiter-store';
import { StatsOverview } from './StatsOverview';
import { RecentApplications } from './RecentApplications';
import { JobPerformance } from './JobPerformance';
import { QuickActions } from './QuickActions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

export function RecruiterDashboard() {
  const { user } = useAuthStore();
  const {
    postedJobs,
    applications,
    analytics,
    isLoading,
    loadPostedJobs,
    loadApplications,
    loadAnalytics,
    updateJob,
  } = useRecruiterStore();

  useEffect(() => {
    // Load all data on mount
    const loadData = async () => {
      await loadPostedJobs();
      await loadApplications();
    };
    loadData();
  }, [loadPostedJobs, loadApplications]);

  useEffect(() => {
    // Calculate analytics whenever jobs or applications change
    loadAnalytics();
  }, [postedJobs, applications, loadAnalytics]);

  const handlePauseJob = async (jobId: string) => {
    await updateJob(jobId, { status: 'paused' });
  };

  const handleCloseJob = async (jobId: string) => {
    await updateJob(jobId, { status: 'closed' });
  };

  if (isLoading && postedJobs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's an overview of your recruiting activity
          </p>
        </div>

        {/* Stats Overview */}
        <StatsOverview analytics={analytics} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            <JobPerformance
              jobs={postedJobs}
              onPauseJob={handlePauseJob}
              onCloseJob={handleCloseJob}
            />
            <RecentApplications applications={applications} />
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            <QuickActions />

            {/* AI Insights Card */}
            <div className="glass-card p-6 rounded-xl">
              <h3 className="font-semibold mb-4">AI Insights</h3>
              <div className="space-y-3">
                <div className="p-3 bg-primary/5 rounded-lg">
                  <p className="text-sm font-medium">Top Performing Job</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {postedJobs.length > 0
                      ? `"${postedJobs.sort((a, b) => b.applicationsCount - a.applicationsCount)[0]?.title}" is getting the most applications`
                      : 'Post your first job to see insights'}
                  </p>
                </div>
                <div className="p-3 bg-green-500/5 rounded-lg">
                  <p className="text-sm font-medium">Hiring Trend</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analytics && analytics.avgApplicationsPerJob > 5
                      ? 'Your jobs are attracting good candidate volume'
                      : 'Consider optimizing your job descriptions for better reach'}
                  </p>
                </div>
                <div className="p-3 bg-blue-500/5 rounded-lg">
                  <p className="text-sm font-medium">Recommendation</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {applications.filter(a => a.status === 'pending').length > 5
                      ? 'You have pending applications to review'
                      : 'Your application queue is up to date'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
