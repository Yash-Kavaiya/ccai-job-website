import { Briefcase, Users, Eye, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { RecruiterAnalytics } from '@/types/recruiter';

interface StatsOverviewProps {
  analytics: RecruiterAnalytics | null;
}

export function StatsOverview({ analytics }: StatsOverviewProps) {
  const stats = [
    {
      title: 'Active Jobs',
      value: analytics?.activeJobs || 0,
      total: analytics?.totalJobs || 0,
      icon: Briefcase,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Total Applications',
      value: analytics?.totalApplications || 0,
      subtext: `${analytics?.pendingApplications || 0} pending review`,
      icon: Users,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Total Views',
      value: analytics?.totalViews || 0,
      subtext: 'Across all job posts',
      icon: Eye,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Shortlisted',
      value: analytics?.shortlistedCandidates || 0,
      subtext: 'Candidates',
      icon: TrendingUp,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-bold">{stat.value}</span>
                  {stat.total !== undefined && stat.total > 0 && (
                    <span className="text-sm text-muted-foreground">
                      / {stat.total}
                    </span>
                  )}
                </div>
                {stat.subtext && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.subtext}
                  </p>
                )}
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
