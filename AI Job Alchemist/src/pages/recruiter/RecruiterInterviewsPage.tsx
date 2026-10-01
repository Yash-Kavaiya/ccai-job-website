import { Calendar, Mail, Clock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';

const SUPPORT_EMAIL = 'support@aijobhub.app';
const MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Recruiter Interviews — Early Access')}`;

export function RecruiterInterviewsPage() {
  const navigate = useNavigate();

  return (
    <ScrollArea className="h-full">
      <div className="p-6 md:p-10 max-w-3xl mx-auto animate-in fade-in-50 duration-300">
        <div className="rounded-2xl border bg-gradient-to-b from-muted/50 to-background p-8 md:p-12">
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <Badge variant="secondary" className="gap-1">
              <Shield className="w-3 h-3" />
              Recruiter
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Clock className="w-3 h-3" />
              Under development
            </Badge>
          </div>

          <h1 className="text-3xl font-bold tracking-tight mb-3 flex items-center gap-2">
            <Calendar className="w-8 h-8" />
            Interviews
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mb-8">
            Schedule, track, and review candidate interviews from your hiring pipeline.
            This feature is in development — contact us for early access.
          </p>

          <div className="rounded-xl border bg-card p-6 mb-6 space-y-4">
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Upcoming and completed interview views</li>
              <li>• Technical, behavioral, and culture rounds</li>
              <li>• Links to video calls and candidate profiles</li>
            </ul>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button asChild className="ai-gradient text-white border-0">
                <a href={MAILTO}>
                  <Mail className="w-4 h-4 mr-2" />
                  Contact for early access
                </a>
              </Button>
              <Button variant="outline" onClick={() => navigate('/recruiter/applications')}>
                View applications
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Email:{' '}
              <a className="text-primary hover:underline font-medium" href={MAILTO}>
                {SUPPORT_EMAIL}
              </a>
            </p>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
