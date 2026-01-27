import { useNavigate } from 'react-router-dom';
import { Briefcase, Eye, Users, ChevronRight, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { JobPosting } from '@/types/recruiter';

interface JobPerformanceProps {
  jobs: JobPosting[];
  onPauseJob?: (jobId: string) => void;
  onCloseJob?: (jobId: string) => void;
}

const statusColors: Record<JobPosting['status'], string> = {
  draft: 'bg-gray-100 text-gray-800',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  closed: 'bg-red-100 text-red-800',
};

export function JobPerformance({ jobs, onPauseJob, onCloseJob }: JobPerformanceProps) {
  const navigate = useNavigate();

  const activeJobs = jobs.filter(job => job.status === 'active').slice(0, 4);

  if (activeJobs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Job Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No active jobs</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate('/recruiter/jobs/new')}
            >
              Post Your First Job
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="w-5 h-5" />
          Job Performance
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => navigate('/recruiter/jobs')}>
          View All
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activeJobs.map((job) => {
            const maxApplications = Math.max(...jobs.map(j => j.applicationsCount), 1);
            const applicationProgress = (job.applicationsCount / maxApplications) * 100;

            return (
              <div
                key={job.id}
                className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{job.title}</h4>
                    <p className="text-sm text-muted-foreground">{job.location}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[job.status]}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/recruiter/jobs/${job.id}`)}>
                          Edit Job
                        </DropdownMenuItem>
                        {job.status === 'active' && onPauseJob && (
                          <DropdownMenuItem onClick={() => onPauseJob(job.id)}>
                            Pause Job
                          </DropdownMenuItem>
                        )}
                        {onCloseJob && (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => onCloseJob(job.id)}
                          >
                            Close Job
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    <span>{job.views} views</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{job.applicationsCount} applications</span>
                  </div>
                </div>

                <div className="mt-3">
                  <Progress value={applicationProgress} className="h-2" />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
