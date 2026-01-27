import { useNavigate } from 'react-router-dom';
import { PlusCircle, Users, Calendar, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Post a Job',
      description: 'Create a new job listing',
      icon: PlusCircle,
      onClick: () => navigate('/recruiter/jobs/new'),
      variant: 'default' as const,
      className: 'ai-gradient text-white',
    },
    {
      title: 'Search Candidates',
      description: 'Find matching talent',
      icon: Search,
      onClick: () => navigate('/recruiter/candidates'),
      variant: 'outline' as const,
    },
    {
      title: 'Review Applications',
      description: 'Check pending applications',
      icon: Users,
      onClick: () => navigate('/recruiter/applications'),
      variant: 'outline' as const,
    },
    {
      title: 'Schedule Interview',
      description: 'Set up interviews',
      icon: Calendar,
      onClick: () => navigate('/recruiter/interviews'),
      variant: 'outline' as const,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <Button
              key={action.title}
              variant={action.variant}
              className={`h-auto flex-col items-start p-4 ${action.className || ''}`}
              onClick={action.onClick}
            >
              <action.icon className="w-5 h-5 mb-2" />
              <span className="font-medium">{action.title}</span>
              <span className="text-xs opacity-80 font-normal">{action.description}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
