import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useInterviewSchedulingStore } from '@/store/interview-scheduling-store';
import { 
  Calendar,
  Clock,
  MapPin,
  Users,
  Bell,
  Settings,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Square,
  CheckCircle,
  XCircle,
  AlertCircle,
  Video,
  Mail,
  Smartphone,
  Globe,
  CalendarDays,
  Timer,
  Building2,
  Briefcase,
  Target,
  BookOpen,
  Zap,
  TrendingUp,
  BarChart3,
  Filter,
  Search,
  SortDesc,
  MoreHorizontal,
  Loader2,
} from 'lucide-react';

interface ScheduleInterviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingInterview?: any;
}

const ScheduleInterviewDialog: React.FC<ScheduleInterviewDialogProps> = ({
  open,
  onOpenChange,
  editingInterview
}) => {
  const { toast } = useToast();
  const { scheduleInterview, rescheduleInterview, getAvailableSlots } = useInterviewSchedulingStore();
  
  const [formData, setFormData] = useState({
    title: '',
    type: 'mock' as 'mock' | 'real' | 'practice',
    date: '',
    time: '',
    duration: 60,
    role: '',
    company: '',
    difficulty: 'mid' as 'entry' | 'mid' | 'senior' | 'principal',
    attendees: [] as string[],
    meetingLink: '',
    notes: '',
  });
  
  const [newAttendee, setNewAttendee] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingInterview) {
      const interview = editingInterview;
      setFormData({
        title: interview.title,
        type: interview.type,
        date: interview.scheduledTime.toISOString().split('T')[0],
        time: interview.scheduledTime.toTimeString().slice(0, 5),
        duration: interview.duration,
        role: interview.role,
        company: interview.company,
        difficulty: interview.difficulty,
        attendees: interview.attendees,
        meetingLink: interview.meetingLink || '',
        notes: interview.notes || '',
      });
    } else {
      setFormData({
        title: '',
        type: 'mock',
        date: '',
        time: '',
        duration: 60,
        role: '',
        company: '',
        difficulty: 'mid',
        attendees: [],
        meetingLink: '',
        notes: '',
      });
    }
  }, [editingInterview, open]);

  useEffect(() => {
    if (formData.date) {
      const date = new Date(formData.date);
      const slots = getAvailableSlots(date, formData.duration);
      setAvailableSlots(slots);
    }
  }, [formData.date, formData.duration, getAvailableSlots]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.time || !formData.role || !formData.company) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const scheduledTime = new Date(`${formData.date}T${formData.time}`);
      
      const interviewData = {
        title: formData.title || `${formData.type === 'mock' ? 'Mock ' : ''}Interview: ${formData.role}`,
        type: formData.type,
        scheduledTime,
        duration: formData.duration,
        role: formData.role,
        company: formData.company,
        difficulty: formData.difficulty,
        status: 'scheduled' as const,
        reminderSent: false,
        attendees: formData.attendees,
        meetingLink: formData.meetingLink,
        notes: formData.notes,
      };

      if (editingInterview) {
        await rescheduleInterview(editingInterview.id, scheduledTime);
        toast({
          title: "Interview Updated",
          description: "Your interview has been successfully updated.",
        });
      } else {
        await scheduleInterview(interviewData);
        toast({
          title: "Interview Scheduled",
          description: "Your interview has been successfully scheduled.",
        });
      }

      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule interview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addAttendee = () => {
    if (newAttendee && !formData.attendees.includes(newAttendee)) {
      setFormData(prev => ({
        ...prev,
        attendees: [...prev.attendees, newAttendee]
      }));
      setNewAttendee('');
    }
  };

  const removeAttendee = (email: string) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.filter(a => a !== email)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingInterview ? 'Edit Interview' : 'Schedule New Interview'}
          </DialogTitle>
          <DialogDescription>
            {editingInterview 
              ? 'Update your interview details and schedule.'
              : 'Set up a new interview session with AI-powered coaching.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Interview Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mock">Mock Interview</SelectItem>
                    <SelectItem value="practice">Practice Session</SelectItem>
                    <SelectItem value="real">Real Interview</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select 
                  value={formData.difficulty} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, difficulty: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry Level</SelectItem>
                    <SelectItem value="mid">Mid Level</SelectItem>
                    <SelectItem value="senior">Senior Level</SelectItem>
                    <SelectItem value="principal">Principal Level</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="title">Interview Title (Optional)</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Custom interview title"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role">Role *</Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  placeholder="e.g., AI Engineer, Data Scientist"
                  required
                />
              </div>

              <div>
                <Label htmlFor="company">Company *</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="e.g., Google, Microsoft, OpenAI"
                  required
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Schedule Details */}
          <div className="space-y-4">
            <h4 className="font-medium">Schedule Details</h4>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div>
                <Label htmlFor="time">Time *</Label>
                <Select 
                  value={formData.time} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, time: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSlots.map(slot => (
                      <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Select 
                  value={formData.duration.toString()} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, duration: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Meeting Details */}
          <div className="space-y-4">
            <h4 className="font-medium">Meeting Details</h4>
            
            <div>
              <Label htmlFor="meetingLink">Meeting Link (Optional)</Label>
              <Input
                id="meetingLink"
                value={formData.meetingLink}
                onChange={(e) => setFormData(prev => ({ ...prev, meetingLink: e.target.value }))}
                placeholder="https://meet.google.com/..."
              />
            </div>

            <div>
              <Label>Attendees (Optional)</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newAttendee}
                    onChange={(e) => setNewAttendee(e.target.value)}
                    placeholder="attendee@example.com"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAttendee())}
                  />
                  <Button type="button" onClick={addAttendee} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.attendees.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.attendees.map(email => (
                      <Badge key={email} variant="secondary" className="flex items-center gap-1">
                        {email}
                        <button 
                          type="button"
                          onClick={() => removeAttendee(email)}
                          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                        >
                          <XCircle className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes, preparation materials, or special instructions..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {editingInterview ? 'Updating...' : 'Scheduling...'}
                </>
              ) : (
                editingInterview ? 'Update Interview' : 'Schedule Interview'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const CalendarView: React.FC = () => {
  const { 
    selectedDate, 
    setSelectedDate, 
    getInterviewsForDate,
    cancelInterview,
    updateInterviewStatus
  } = useInterviewSchedulingStore();
  
  const { toast } = useToast();
  const [editingInterview, setEditingInterview] = useState<any>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  const currentDate = new Date();
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();
  
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());
  
  const days = [];
  const currentDatePointer = new Date(startDate);
  
  for (let i = 0; i < 42; i++) {
    days.push(new Date(currentDatePointer));
    currentDatePointer.setDate(currentDatePointer.getDate() + 1);
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  const handleCancelInterview = async (interview: any) => {
    try {
      await cancelInterview(interview.id, 'Cancelled by user');
      toast({
        title: "Interview Cancelled",
        description: "The interview has been successfully cancelled.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel interview.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500';
      case 'in_progress': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-2xl font-bold">
            {monthNames[currentMonth]} {currentYear}
          </h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button onClick={() => setScheduleDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Interview
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="border rounded-lg overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b bg-muted/50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-4 text-center font-medium text-sm">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const isCurrentMonth = day.getMonth() === currentMonth;
            const isToday = day.toDateString() === currentDate.toDateString();
            const isSelected = day.toDateString() === selectedDate.toDateString();
            const interviews = getInterviewsForDate(day);

            return (
              <div
                key={index}
                className={`
                  min-h-[120px] p-2 border-r border-b cursor-pointer transition-colors
                  ${isCurrentMonth ? 'bg-background' : 'bg-muted/20'}
                  ${isSelected ? 'ring-2 ring-primary' : ''}
                  ${isToday ? 'bg-primary/5' : ''}
                  hover:bg-muted/50
                `}
                onClick={() => setSelectedDate(day)}
              >
                <div className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-sm mb-2
                  ${isToday ? 'bg-primary text-primary-foreground' : ''}
                  ${!isCurrentMonth ? 'text-muted-foreground' : ''}
                `}>
                  {day.getDate()}
                </div>

                <div className="space-y-1">
                  {interviews.slice(0, 3).map(interview => (
                    <div
                      key={interview.id}
                      className={`
                        text-xs p-1 rounded text-white truncate
                        ${getStatusColor(interview.status)}
                      `}
                      title={`${interview.role} at ${interview.company} - ${interview.scheduledTime.toLocaleTimeString()}`}
                    >
                      {interview.scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {interview.role}
                    </div>
                  ))}
                  {interviews.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{interviews.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Details */}
      {getInterviewsForDate(selectedDate).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {selectedDate.toLocaleDateString()} Interviews
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {getInterviewsForDate(selectedDate).map(interview => (
              <div key={interview.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(interview.status)}`} />
                  <div>
                    <div className="font-medium">{interview.role} at {interview.company}</div>
                    <div className="text-sm text-muted-foreground">
                      {interview.scheduledTime.toLocaleTimeString()} • {interview.duration} min • {interview.type}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {interview.meetingLink && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setEditingInterview(interview);
                      setScheduleDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {interview.status === 'scheduled' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleCancelInterview(interview)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <ScheduleInterviewDialog
        open={scheduleDialogOpen}
        onOpenChange={(open) => {
          setScheduleDialogOpen(open);
          if (!open) setEditingInterview(null);
        }}
        editingInterview={editingInterview}
      />
    </div>
  );
};

const ListView: React.FC = () => {
  const { 
    scheduledInterviews, 
    getUpcomingInterviews, 
    getPastInterviews,
    cancelInterview,
    updateInterviewStatus
  } = useInterviewSchedulingStore();
  
  const { toast } = useToast();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('upcoming');
  const [editingInterview, setEditingInterview] = useState<any>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  const getFilteredInterviews = () => {
    switch (filter) {
      case 'upcoming':
        return getUpcomingInterviews(20);
      case 'past':
        return getPastInterviews(20);
      case 'cancelled':
        return scheduledInterviews.filter(i => i.status === 'cancelled');
      default:
        return scheduledInterviews.sort((a, b) => b.scheduledTime.getTime() - a.scheduledTime.getTime());
    }
  };

  const handleCancelInterview = async (interview: any) => {
    try {
      await cancelInterview(interview.id, 'Cancelled by user');
      toast({
        title: "Interview Cancelled",
        description: "The interview has been successfully cancelled.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel interview.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'in_progress': return <Play className="h-4 w-4 text-green-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-gray-500" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'mock': return <Target className="h-4 w-4" />;
      case 'practice': return <BookOpen className="h-4 w-4" />;
      case 'real': return <Briefcase className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <Tabs value={filter} onValueChange={(value: any) => setFilter(value)}>
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={() => setScheduleDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Interview
        </Button>
      </div>

      {/* Interviews List */}
      <div className="space-y-4">
        {getFilteredInterviews().map(interview => (
          <Card key={interview.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-2">
                    {getStatusIcon(interview.status)}
                    {getTypeIcon(interview.type)}
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {interview.title || `${interview.type === 'mock' ? 'Mock ' : ''}Interview: ${interview.role}`}
                      </h3>
                      <p className="text-muted-foreground">
                        {interview.company} • {interview.difficulty} level
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {interview.scheduledTime.toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {interview.scheduledTime.toLocaleTimeString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Timer className="h-4 w-4" />
                        {interview.duration} min
                      </div>
                      {interview.attendees.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {interview.attendees.length} attendees
                        </div>
                      )}
                    </div>

                    {interview.notes && (
                      <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                        {interview.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={interview.status === 'scheduled' ? 'default' : 'secondary'}>
                    {interview.status.replace('_', ' ')}
                  </Badge>
                  
                  <div className="flex gap-1">
                    {interview.meetingLink && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setEditingInterview(interview);
                        setScheduleDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    {interview.status === 'scheduled' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCancelInterview(interview)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {getFilteredInterviews().length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No interviews found</h3>
              <p className="text-muted-foreground mb-4">
                {filter === 'upcoming' 
                  ? "You don't have any upcoming interviews scheduled."
                  : `No ${filter} interviews found.`
                }
              </p>
              <Button onClick={() => setScheduleDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Your First Interview
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <ScheduleInterviewDialog
        open={scheduleDialogOpen}
        onOpenChange={(open) => {
          setScheduleDialogOpen(open);
          if (!open) setEditingInterview(null);
        }}
        editingInterview={editingInterview}
      />
    </div>
  );
};

const SettingsView: React.FC = () => {
  const { 
    calendarIntegration,
    reminderSettings,
    availability,
    connectCalendar,
    disconnectCalendar,
    updateReminderSettings,
    updateAvailability
  } = useInterviewSchedulingStore();
  
  const { toast } = useToast();

  const handleConnectCalendar = async (provider: 'google' | 'outlook' | 'apple') => {
    try {
      await connectCalendar(provider);
      toast({
        title: "Calendar Connected",
        description: `Successfully connected to ${provider} Calendar.`,
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to calendar. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDisconnectCalendar = () => {
    disconnectCalendar();
    toast({
      title: "Calendar Disconnected",
      description: "Calendar has been disconnected successfully.",
    });
  };

  const updateAvailabilityDay = (dayIndex: number, updates: Partial<any>) => {
    const newAvailability = availability.map((day, index) => 
      index === dayIndex ? { ...day, ...updates } : day
    );
    updateAvailability(newAvailability);
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="space-y-8">
      {/* Calendar Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar Integration
          </CardTitle>
          <CardDescription>
            Connect your calendar to automatically sync interview appointments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {calendarIntegration.connected ? (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Connected to {calendarIntegration.provider} Calendar</p>
                  <p className="text-sm text-muted-foreground">
                    Last synced: {calendarIntegration.lastSync?.toLocaleString()}
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={handleDisconnectCalendar}>
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="flex items-center gap-2 h-auto p-4"
                onClick={() => handleConnectCalendar('google')}
              >
                <Globe className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Google Calendar</div>
                  <div className="text-sm text-muted-foreground">Connect with Google</div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center gap-2 h-auto p-4"
                onClick={() => handleConnectCalendar('outlook')}
              >
                <Mail className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Outlook Calendar</div>
                  <div className="text-sm text-muted-foreground">Connect with Microsoft</div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center gap-2 h-auto p-4"
                onClick={() => handleConnectCalendar('apple')}
              >
                <Smartphone className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Apple Calendar</div>
                  <div className="text-sm text-muted-foreground">Connect with iCloud</div>
                </div>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reminder Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Reminder Settings
          </CardTitle>
          <CardDescription>
            Configure when and how you want to be reminded about interviews
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Reminders</Label>
              <p className="text-sm text-muted-foreground">Receive notifications before interviews</p>
            </div>
            <Switch
              checked={reminderSettings.enabled}
              onCheckedChange={(checked) => updateReminderSettings({ enabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Email Reminders</Label>
              <p className="text-sm text-muted-foreground">Send reminder emails</p>
            </div>
            <Switch
              checked={reminderSettings.emailReminders}
              onCheckedChange={(checked) => updateReminderSettings({ emailReminders: checked })}
            />
          </div>

          <div>
            <Label>Reminder Times</Label>
            <p className="text-sm text-muted-foreground mb-3">When to send reminders before the interview</p>
            <div className="space-y-2">
              {[
                { value: 1440, label: '1 day before' },
                { value: 720, label: '12 hours before' },
                { value: 240, label: '4 hours before' },
                { value: 60, label: '1 hour before' },
                { value: 30, label: '30 minutes before' },
                { value: 15, label: '15 minutes before' },
              ].map(option => (
                <div key={option.value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`reminder-${option.value}`}
                    checked={reminderSettings.reminderTimes.includes(option.value)}
                    onChange={(e) => {
                      const newTimes = e.target.checked
                        ? [...reminderSettings.reminderTimes, option.value]
                        : reminderSettings.reminderTimes.filter(t => t !== option.value);
                      updateReminderSettings({ reminderTimes: newTimes });
                    }}
                    className="rounded"
                  />
                  <Label htmlFor={`reminder-${option.value}`}>{option.label}</Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Availability Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Availability
          </CardTitle>
          <CardDescription>
            Set your availability for scheduling interviews
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {availability.map((day, index) => (
            <div key={day.dayOfWeek} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <Switch
                  checked={day.enabled}
                  onCheckedChange={(checked) => updateAvailabilityDay(index, { enabled: checked })}
                />
                <div className="w-20 font-medium">{dayNames[day.dayOfWeek]}</div>
              </div>
              
              {day.enabled && (
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={day.startTime}
                    onChange={(e) => updateAvailabilityDay(index, { startTime: e.target.value })}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">to</span>
                  <Input
                    type="time"
                    value={day.endTime}
                    onChange={(e) => updateAvailabilityDay(index, { endTime: e.target.value })}
                    className="w-24"
                  />
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

const AnalyticsView: React.FC = () => {
  const { getInterviewStats, scheduledInterviews } = useInterviewSchedulingStore();
  
  const stats = getInterviewStats();
  
  const getInterviewsByMonth = () => {
    const monthCounts: { [key: string]: number } = {};
    scheduledInterviews.forEach(interview => {
      const month = interview.scheduledTime.toLocaleString('default', { month: 'short', year: 'numeric' });
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    });
    return Object.entries(monthCounts).slice(-6);
  };

  const getInterviewsByType = () => {
    const typeCounts: { [key: string]: number } = {};
    scheduledInterviews.forEach(interview => {
      typeCounts[interview.type] = (typeCounts[interview.type] || 0) + 1;
    });
    return Object.entries(typeCounts);
  };

  const getInterviewsByCompany = () => {
    const companyCounts: { [key: string]: number } = {};
    scheduledInterviews.forEach(interview => {
      companyCounts[interview.company] = (companyCounts[interview.company] || 0) + 1;
    });
    return Object.entries(companyCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Interviews</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.upcoming}</p>
                <p className="text-sm text-muted-foreground">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.completionRate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interview Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Interview Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getInterviewsByMonth().map(([month, count]) => (
                <div key={month} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{month}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 bg-primary rounded-full" style={{ width: `${(count / Math.max(...getInterviewsByMonth().map(([,c]) => c))) * 100}px` }} />
                    <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Interview Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Interview Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getInterviewsByType().map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      type === 'mock' ? 'bg-blue-500' : 
                      type === 'practice' ? 'bg-green-500' : 'bg-purple-500'
                    }`} />
                    <span className="text-sm font-medium capitalize">{type}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Companies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Top Companies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getInterviewsByCompany().map(([company, count]) => (
                <div key={company} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{company}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 bg-primary rounded-full" style={{ width: `${(count / Math.max(...getInterviewsByCompany().map(([,c]) => c))) * 50 + 10}px` }} />
                    <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Average Duration</span>
                <span className="text-sm text-muted-foreground">{stats.averageDuration.toFixed(0)} min</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Completion Rate</span>
                <span className="text-sm text-muted-foreground">{stats.completionRate.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Cancellation Rate</span>
                <span className="text-sm text-muted-foreground">
                  {stats.total > 0 ? ((stats.cancelled / stats.total) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const InterviewScheduler: React.FC = () => {
  const { currentView, setCurrentView, loadScheduledInterviews, checkAndSendReminders } = useInterviewSchedulingStore();

  useEffect(() => {
    loadScheduledInterviews();
  }, [loadScheduledInterviews]);

  useEffect(() => {
    // Check for reminders every 5 minutes
    const interval = setInterval(() => {
      checkAndSendReminders();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [checkAndSendReminders]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Interview Scheduler</h2>
          <p className="text-muted-foreground">
            Schedule, manage, and track your interview appointments with calendar integration
          </p>
        </div>
      </div>

      <Tabs value={currentView} onValueChange={(value: any) => setCurrentView(value)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            List
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <CalendarView />
        </TabsContent>

        <TabsContent value="list" className="space-y-6">
          <ListView />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsView />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <SettingsView />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InterviewScheduler;