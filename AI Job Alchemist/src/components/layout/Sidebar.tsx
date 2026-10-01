import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Search,
  FileText,
  MessageSquare,
  BookmarkCheck,
  Settings,
  Users,
  Brain,
  Zap,
  Bot,
  Crown,
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

const navigationItems = [
  {
    title: 'Overview',
    items: [
      { icon: Home, label: 'Dashboard', href: '/candidate/dashboard', badge: null as string | null, match: ['/candidate/dashboard', '/dashboard'] },
      { icon: Search, label: 'Job Search', href: '/jobs', badge: null, match: ['/jobs', '/job-search'] },
      { icon: BookmarkCheck, label: 'Saved Jobs', href: '/jobs?tab=saved', badge: null, match: [] },
    ],
  },
  {
    title: 'AI Tools',
    items: [
      { icon: FileText, label: 'Resume', href: '/resume', badge: null, match: ['/resume'] },
      { icon: MessageSquare, label: 'Mock Interviews', href: '/interview', badge: null, match: ['/interview'] },
      { icon: Brain, label: 'AI Matching', href: '/matching', badge: 'Fast', match: ['/matching'] },
      { icon: Zap, label: 'Quick Apply', href: '/jobs?tab=apply', badge: null, match: [] },
    ],
  },
  {
    title: 'Premium',
    items: [
      { icon: Bot, label: 'AI Agents', href: '/ai-agents', badge: 'Pro', match: ['/ai-agents'] },
    ],
  },
  {
    title: 'Account',
    items: [
      { icon: Users, label: 'Social Profile', href: '/social', badge: null, match: ['/social'] },
      { icon: Settings, label: 'Settings', href: '/settings', badge: null, match: ['/settings'] },
    ],
  },
];

export function Sidebar({ className }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (item: { href: string; match: string[] }) => {
    if (item.match.length > 0) {
      return item.match.some((p) => currentPath === p || currentPath.startsWith(p + '/'));
    }
    // Query-param links: active when path matches and search matches
    try {
      const url = new URL(item.href, 'http://local');
      return currentPath === url.pathname && location.search.includes(url.searchParams.toString().replace(/^\?/, '') || '__none__')
        ? true
        : currentPath === url.pathname && item.href.includes('tab=') && location.search.includes(url.searchParams.get('tab') || '');
    } catch {
      return false;
    }
  };

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
                {section.items.map((item) => {
                  const active = isActive(item);
                  return (
                    <Button
                      key={item.href + item.label}
                      variant={active ? 'secondary' : 'ghost'}
                      className={cn(
                        'w-full justify-start gap-3 h-10',
                        active && 'bg-accent text-accent-foreground'
                      )}
                      onClick={() => navigate(item.href)}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="rounded-xl border bg-muted/40 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium">AI Agents Pro</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            Premium automation agents — under development. Contact us for early access.
          </p>
          <Button
            size="sm"
            className="w-full"
            variant="outline"
            onClick={() => navigate('/ai-agents')}
          >
            Learn more
          </Button>
        </div>
      </div>
    </div>
  );
}
