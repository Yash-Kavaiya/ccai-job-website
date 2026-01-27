import { useState } from 'react';
import { Calendar, Clock, Video, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock interviews data
const mockInterviews = [
  {
    id: '1',
    candidateName: 'Alex Johnson',
    jobTitle: 'Senior Software Engineer',
    scheduledAt: '2024-01-20T10:00:00',
    duration: 60,
    type: 'technical',
    status: 'scheduled',
  },
  {
    id: '2',
    candidateName: 'Sarah Chen',
    jobTitle: 'Full Stack Developer',
    scheduledAt: '2024-01-20T14:00:00',
    duration: 45,
    type: 'behavioral',
    status: 'scheduled',
  },
  {
    id: '3',
    candidateName: 'Michael Brown',
    jobTitle: 'DevOps Engineer',
    scheduledAt: '2024-01-19T11:00:00',
    duration: 60,
    type: 'technical',
    status: 'completed',
  },
];

const interviewTypeColors: Record<string, string> = {
  technical: 'bg-blue-100 text-blue-800',
  behavioral: 'bg-purple-100 text-purple-800',
  culture: 'bg-green-100 text-green-800',
  final: 'bg-orange-100 text-orange-800',
};

export function RecruiterInterviewsPage() {
  const [activeTab, setActiveTab] = useState('upcoming');

  const upcomingInterviews = mockInterviews.filter(i => i.status === 'scheduled');
  const completedInterviews = mockInterviews.filter(i => i.status === 'completed');

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };
  };

  const InterviewCard = ({ interview }: { interview: typeof mockInterviews[0] }) => {
    const { date, time } = formatDateTime(interview.scheduledAt);

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(interview.candidateName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{interview.candidateName}</h3>
                <p className="text-sm text-muted-foreground">{interview.jobTitle}</p>
                <div className="flex items-center gap-3 mt-2 text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {date}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {time} ({interview.duration} min)
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={interviewTypeColors[interview.type]}>
                {interview.type.charAt(0).toUpperCase() + interview.type.slice(1)}
              </Badge>
            </div>
          </div>
          {interview.status === 'scheduled' && (
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" className="flex-1">
                Reschedule
              </Button>
              <Button size="sm" className="flex-1 ai-gradient text-white">
                <Video className="w-4 h-4 mr-2" />
                Join Call
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              Interviews
            </h1>
            <p className="text-muted-foreground">Schedule and manage candidate interviews</p>
          </div>
          <Button className="ai-gradient text-white">
            <Plus className="w-4 h-4 mr-2" />
            Schedule Interview
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <div className="text-2xl font-bold">{upcomingInterviews.length}</div>
              <p className="text-sm text-muted-foreground">Upcoming</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <div className="text-2xl font-bold">
                {upcomingInterviews.filter(i => {
                  const today = new Date().toDateString();
                  return new Date(i.scheduledAt).toDateString() === today;
                }).length}
              </div>
              <p className="text-sm text-muted-foreground">Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <div className="text-2xl font-bold">{completedInterviews.length}</div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {upcomingInterviews.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No upcoming interviews</h3>
                  <p className="text-muted-foreground mb-4">Schedule interviews with shortlisted candidates</p>
                  <Button>Schedule Interview</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {upcomingInterviews.map((interview) => (
                  <InterviewCard key={interview.id} interview={interview} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completedInterviews.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No completed interviews</h3>
                  <p className="text-muted-foreground">Completed interviews will appear here</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {completedInterviews.map((interview) => (
                  <InterviewCard key={interview.id} interview={interview} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}
