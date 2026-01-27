import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Briefcase,
  PlusCircle,
  Users,
  FileText,
  Calendar,
  Settings,
  Brain,
  BarChart3,
  UserPlus,
  Building2,
  MessageSquare
} from 'lucide-react';

interface RecruiterSidebarProps {
  className?: string;
}

const navigationItems = [
  {
    title: 'Overview',
    items: [
      { icon: Home, label: 'Dashboard', href: '/recruiter/dashboard', badge: null },
      { icon: BarChart3, label: 'Analytics', href: '/recruiter/analytics', badge: null },
    ]
  },
  {
    title: 'Jobs',
    items: [
      { icon: PlusCircle, label: 'Post a Job', href: '/recruiter/jobs/new', badge: null },
      { icon: Briefcase, label: 'Manage Jobs', href: '/recruiter/jobs', badge: null },
    ]
  },
  {
    title: 'Candidates',
    items: [
      { icon: Users, label: 'Browse Candidates', href: '/recruiter/candidates', badge: 'AI' },
      { icon: FileText, label: 'Applications', href: '/recruiter/applications', badge: null },
      { icon: Calendar, label: 'Interviews', href: '/recruiter/interviews', badge: null },
    ]
  },
  {
    title: 'Communication',
    items: [
      { icon: MessageSquare, label: 'Messages', href: '/recruiter/messages', badge: 'New' },
    ]
  },
  {
    title: 'Team',
    items: [
      { icon: UserPlus, label: 'Team Members', href: '/recruiter/team', badge: null },
    ]
  },
  {
    title: 'Settings',
    items: [
      { icon: Building2, label: 'Company Profile', href: '/recruiter/settings', badge: null },
    ]
  }
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
                    {item.badge && (
                      <Badge
                        variant={item.badge === 'AI' ? 'default' : 'secondary'}
                        className="text-xs px-1.5 py-0.5"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Bottom CTA */}
      <div className="p-4 border-t">
        <div className="glass-card p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium">Find Top Talent</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            Use AI-powered matching to find the perfect candidates for your roles
          </p>
          <Button
            size="sm"
            className="w-full ai-gradient text-white"
            onClick={() => navigate('/recruiter/candidates')}
          >
            Search Candidates
          </Button>
        </div>
      </div>
    </div>
  );
}
