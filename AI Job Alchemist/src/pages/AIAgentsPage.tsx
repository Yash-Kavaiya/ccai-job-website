import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  Sparkles,
  Mail,
  ArrowRight,
  Shield,
  Clock,
  Workflow,
} from 'lucide-react';

const SUPPORT_EMAIL = 'support@aijobhub.app';
const MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('AI Agents Premium — Early Access')}`;

const previewAgents = [
  {
    icon: Bot,
    title: 'Career Coach',
    description: 'Daily guidance, skill roadmaps, and progress digests.',
  },
  {
    icon: Sparkles,
    title: 'Trend Analyzer',
    description: 'Tracks emerging AI skills and hiring demand.',
  },
  {
    icon: Workflow,
    title: 'Auto Apply Assistant',
    description: 'Drafts tailored applications when you approve them.',
  },
];

export default function AIAgentsPage() {
  const navigate = useNavigate();

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto animate-in fade-in-50 duration-300">
      <div className="rounded-2xl border bg-gradient-to-b from-muted/50 to-background p-8 md:p-12">
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <Badge variant="secondary" className="gap-1">
            <Shield className="w-3 h-3" />
            Premium
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Clock className="w-3 h-3" />
            Under development
          </Badge>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
          AI Agents
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mb-8">
          Autonomous career agents that coach, monitor market trends, and help you
          apply smarter. This premium feature is in development — contact us for
          early access.
        </p>

        <div className="rounded-xl border bg-card p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Pro plan</p>
              <p className="text-4xl font-bold tracking-tight">
                $29
                <span className="text-base font-normal text-muted-foreground">/mo</span>
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Billing and self-serve checkout coming soon.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button asChild className="ai-gradient text-white border-0">
                <a href={MAILTO}>
                  <Mail className="w-4 h-4 mr-2" />
                  Contact for early access
                </a>
              </Button>
              <Button variant="outline" onClick={() => navigate('/matching')}>
                Try AI Matching
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Email:{' '}
            <a className="text-primary hover:underline font-medium" href={MAILTO}>
              {SUPPORT_EMAIL}
            </a>
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          {previewAgents.map((agent) => (
            <div key={agent.title} className="rounded-xl border p-4 bg-card/60">
              <agent.icon className="w-6 h-6 text-accent mb-3" />
              <h3 className="font-semibold mb-1">{agent.title}</h3>
              <p className="text-sm text-muted-foreground">{agent.description}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => navigate('/candidate/dashboard')}>
            Back to dashboard
          </Button>
          <Button variant="ghost" onClick={() => navigate('/jobs')}>
            Browse jobs
          </Button>
        </div>
      </div>
    </div>
  );
}
