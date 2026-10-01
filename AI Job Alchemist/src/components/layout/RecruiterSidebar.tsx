import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Briefcase,
  PlusCircle,
  Users,
  FileText,
  Calendar,
  UserPlus,
  Building2,
} from 'lucide-react';

interface RecruiterSidebarProps {
  className?: string;
}

const navigationItems = [
  {
    title: 'Overview',
    items: [
      { icon: Home, label: 'Dashboard', href: '/recruiter/dashboard' },
    ],
  },
  {
    title: 'Jobs',
    items: [
      { icon: PlusCircle, label: 'Post a Job', href: '/recruiter/jobs/new' },
      { icon: Briefcase, label: 'Manage Jobs', href: '/recruiter/jobs' },
    ],
  },
  {
    title: 'Candidates',
    items: [
      { icon: Users, label: 'Browse Candidates', href: '/recruiter/candidates' },
      { icon: FileText, label: 'Applications', href: '/recruiter/applications' },
      { icon: Calendar, label: 'Interviews', href: '/recruiter/interviews' },
    ],
  },
  {
    title: 'Team',
    items: [
      { icon: UserPlus, label: 'Team Members', href: '/recruiter/team' },
    ],
  },
  {
    title: 'Settings',
    items: [
      { icon: Building2, label: 'Company Profile', href: '/recruiter/settings' },
    ],
  },
];

export function RecruiterSidebar({ className }: RecruiterSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className={cn('flex h-full w-64 flex-col bg-card border-r', className)}>
      <ScrollArea className="flex-1 px-3 pt-4">
        <div className="space-y-6">
          {navigationItems.map((section) => (
            <div key={section.title}>
              <h4 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {section.title}
              </h4>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <Button
                    key={item.href}
                    variant={currentPath === item.href ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start gap-3 h-10',
                      currentPath === item.href && 'bg-accent text-accent-foreground'
                    )}
                    onClick={() => navigate(item.href)}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="flex-1 text-left">{item.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="rounded-xl border bg-muted/40 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium">Find top talent</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            Browse candidates and manage applications for your open roles.
          </p>
          <Button
            size="sm"
            className="w-full"
            variant="outline"
            onClick={() => navigate('/recruiter/candidates')}
          >
            Search candidates
          </Button>
        </div>
      </div>
    </div>
  );
}
