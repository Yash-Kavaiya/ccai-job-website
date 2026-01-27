import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Briefcase, Eye, Users, MoreVertical, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRecruiterStore } from '@/store/recruiter-store';
import type { JobPosting } from '@/types/recruiter';

const statusColors: Record<JobPosting['status'], string> = {
  draft: 'bg-gray-100 text-gray-800',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  closed: 'bg-red-100 text-red-800',
};

export function ManageJobsPage() {
  const navigate = useNavigate();
  const { postedJobs, isLoading, loadPostedJobs, updateJob, deleteJob } = useRecruiterStore();

  useEffect(() => {
    loadPostedJobs();
  }, [loadPostedJobs]);

  const handleStatusChange = async (jobId: string, status: JobPosting['status']) => {
    await updateJob(jobId, { status });
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Manage Jobs</h1>
            <p className="text-muted-foreground">View and manage your job postings</p>
          </div>
          <Button className="ai-gradient text-white" onClick={() => navigate('/recruiter/jobs/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Post New Job
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search jobs..." className="pl-10" />
          </div>
        </div>

        {postedJobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No jobs posted yet</h3>
              <p className="text-muted-foreground mb-4">Create your first job posting to start attracting candidates</p>
              <Button onClick={() => navigate('/recruiter/jobs/new')}>
                Post Your First Job
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {postedJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{job.title}</h3>
                        <Badge className={statusColors[job.status]}>
                          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-4">{job.location} • {job.jobType} • {job.remotePolicy}</p>
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {job.views} views
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {job.applicationsCount} applications
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/recruiter/jobs/${job.id}`)}>
                          Edit
                        </DropdownMenuItem>
                        {job.status === 'active' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'paused')}>
                            Pause
                          </DropdownMenuItem>
                        )}
                        {job.status === 'paused' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'active')}>
                            Activate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleStatusChange(job.id, 'closed')}
                        >
                          Close
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
