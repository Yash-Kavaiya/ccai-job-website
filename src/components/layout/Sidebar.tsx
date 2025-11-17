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
  Bookmark,
  TrendingUp,
  Settings,
  Users,
  Brain,
  Zap,
  Bot,
  Sparkles,
  Share2,
  UserPlus
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

const navigationItems = [
  {
    title: 'Overview',
    items: [
      { icon: Home, label: 'Dashboard', href: '/dashboard', badge: null },
      { icon: Search, label: 'Job Search', href: '/jobs', badge: null },
      { icon: Bookmark, label: 'Saved Jobs', href: '/saved', badge: 5 },
    ]
  },
  {
    title: 'AI Tools',
    items: [
      { icon: FileText, label: 'Resume Analysis', href: '/resume', badge: null },
      { icon: MessageSquare, label: 'Mock Interviews', href: '/interview', badge: null },
      { icon: Brain, label: 'AI Matching', href: '/matching', badge: 'Beta' },
      { icon: Zap, label: 'Quick Apply', href: '/apply', badge: null },
    ]
  },
  {
    title: 'AI Agents',
    items: [
      { icon: Bot, label: 'AI Agents', href: '/ai-agents', badge: 'New' },
      { icon: Sparkles, label: 'Career Coach', href: '/ai-agents?tab=coach', badge: null },
      { icon: TrendingUp, label: 'Trend Analyzer', href: '/ai-agents?tab=trends', badge: null },
      { icon: Users, label: 'Networking AI', href: '/ai-agents?tab=network', badge: null },
    ]
  },
  {
    title: 'Social & Networking',
    items: [
      { icon: Users, label: 'My Profile', href: '/social', badge: null },
      { icon: Share2, label: 'Share Profile', href: '/social?tab=share', badge: null },
      { icon: UserPlus, label: 'Connections', href: '/social?tab=connections', badge: null },
    ]
  },
  {
    title: 'Account',
    items: [
      { icon: Settings, label: 'Settings', href: '/settings', badge: null },
    ]
  }
];

export function Sidebar({ className }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className={cn('flex h-full w-64 flex-col bg-card border-r', className)}>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 ai-gradient rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-none">AIJobHub</span>
            <span className="text-xs text-muted-foreground leading-none">AI-Powered Careers</span>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3">
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
                        variant={typeof item.badge === 'string' ? 'secondary' : 'destructive'}
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
            <Zap className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium">Upgrade to Pro</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            Unlock unlimited AI features, advanced matching, and priority support
          </p>
          <Button 
            size="sm" 
            className="w-full ai-gradient text-white"
            onClick={() => {
              // Show upgrade modal or navigate to upgrade page
              alert('Upgrade feature coming soon!');
            }}
          >
            Upgrade Now
          </Button>
        </div>
      </div>
    </div>
  );
}