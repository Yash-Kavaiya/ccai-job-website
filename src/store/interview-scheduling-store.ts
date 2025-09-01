import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { table, auth, email } from '@devvai/devv-code-backend';

export interface ScheduledInterview {
  id: string;
  title: string;
  type: 'mock' | 'real' | 'practice';
  scheduledTime: Date;
  duration: number; // in minutes
  role: string;
  company: string;
  difficulty: 'entry' | 'mid' | 'senior' | 'principal';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  reminderSent: boolean;
  calendarEventId?: string;
  attendees: string[];
  meetingLink?: string;
  notes?: string;
  sessionData?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarIntegration {
  provider: 'google' | 'outlook' | 'apple' | 'none';
  accessToken?: string;
  refreshToken?: string;
  connected: boolean;
  lastSync?: Date;
}

export interface ReminderSettings {
  enabled: boolean;
  emailReminders: boolean;
  reminderTimes: number[]; // minutes before interview
  timeZone: string;
  autoScheduleFollowUp: boolean;
}

export interface InterviewAvailability {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  enabled: boolean;
}

interface InterviewSchedulingStore {
  // State
  scheduledInterviews: ScheduledInterview[];
  calendarIntegration: CalendarIntegration;
  reminderSettings: ReminderSettings;
  availability: InterviewAvailability[];
  isLoading: boolean;
  selectedDate: Date;
  currentView: 'calendar' | 'list' | 'schedule';
  
  // Actions
  scheduleInterview: (interview: Omit<ScheduledInterview, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  rescheduleInterview: (id: string, newTime: Date) => Promise<void>;
  cancelInterview: (id: string, reason?: string) => Promise<void>;
  updateInterviewStatus: (id: string, status: ScheduledInterview['status']) => Promise<void>;
  
  // Calendar Integration
  connectCalendar: (provider: CalendarIntegration['provider'], tokens?: any) => Promise<void>;
  disconnectCalendar: () => void;
  syncWithCalendar: () => Promise<void>;
  createCalendarEvent: (interview: ScheduledInterview) => Promise<string | undefined>;
  updateCalendarEvent: (eventId: string, interview: ScheduledInterview) => Promise<void>;
  deleteCalendarEvent: (eventId: string) => Promise<void>;
  
  // Reminders
  updateReminderSettings: (settings: Partial<ReminderSettings>) => void;
  sendReminder: (interviewId: string, type: 'email' | 'notification') => Promise<void>;
  scheduleReminders: (interview: ScheduledInterview) => Promise<void>;
  checkAndSendReminders: () => Promise<void>;
  
  // Availability Management
  updateAvailability: (availability: InterviewAvailability[]) => void;
  getAvailableSlots: (date: Date, duration: number) => string[];
  isTimeSlotAvailable: (date: Date, duration: number) => boolean;
  
  // Data Management
  loadScheduledInterviews: () => Promise<void>;
  saveInterview: (interview: ScheduledInterview) => Promise<void>;
  deleteInterview: (id: string) => Promise<void>;
  
  // View Management
  setSelectedDate: (date: Date) => void;
  setCurrentView: (view: 'calendar' | 'list' | 'schedule') => void;
  getInterviewsForDate: (date: Date) => ScheduledInterview[];
  getUpcomingInterviews: (limit?: number) => ScheduledInterview[];
  getPastInterviews: (limit?: number) => ScheduledInterview[];
  
  // Analytics
  getInterviewStats: () => {
    total: number;
    completed: number;
    cancelled: number;
    upcoming: number;
    completionRate: number;
    averageDuration: number;
  };
  
  setLoading: (loading: boolean) => void;
  
  // Helper method for cancellation notifications
  sendCancellationNotification: (interview: ScheduledInterview, reason?: string) => Promise<void>;
}

export const useInterviewSchedulingStore = create<InterviewSchedulingStore>()(
  persist(
    (set, get) => ({
      // Initial State
      scheduledInterviews: [],
      calendarIntegration: {
        provider: 'none',
        connected: false,
      },
      reminderSettings: {
        enabled: true,
        emailReminders: true,
        reminderTimes: [60, 15], // 1 hour and 15 minutes before
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        autoScheduleFollowUp: false,
      },
      availability: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', enabled: true }, // Monday
        { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', enabled: true }, // Tuesday
        { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', enabled: true }, // Wednesday
        { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', enabled: true }, // Thursday
        { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', enabled: true }, // Friday
        { dayOfWeek: 6, startTime: '10:00', endTime: '14:00', enabled: false }, // Saturday
        { dayOfWeek: 0, startTime: '10:00', endTime: '14:00', enabled: false }, // Sunday
      ],
      isLoading: false,
      selectedDate: new Date(),
      currentView: 'calendar',

      // Schedule Interview
      scheduleInterview: async (interviewData) => {
        set({ isLoading: true });
        try {
          const id = `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const now = new Date();
          
          const interview: ScheduledInterview = {
            ...interviewData,
            id,
            createdAt: now,
            updatedAt: now,
            reminderSent: false,
          };

          // Save to database
          await table.addItem('ewhkqzfu5ngg', {
            title: interview.title,
            type: interview.type,
            scheduled_time: interview.scheduledTime.toISOString(),
            duration: interview.duration,
            role: interview.role,
            company: interview.company,
            difficulty: interview.difficulty,
            status: interview.status,
            reminder_sent: 'false',
            calendar_event_id: interview.calendarEventId || '',
            attendees: JSON.stringify(interview.attendees),
            meeting_link: interview.meetingLink || '',
            notes: interview.notes || '',
            session_data: JSON.stringify(interview.sessionData || {}),
            created_at: now.toISOString(),
            updated_at: now.toISOString(),
          });

          // Update local state
          set(state => ({
            scheduledInterviews: [...state.scheduledInterviews, interview],
            isLoading: false,
          }));

          // Create calendar event if connected
          const { calendarIntegration } = get();
          if (calendarIntegration.connected) {
            try {
              const eventId = await get().createCalendarEvent(interview);
              if (eventId) {
                interview.calendarEventId = eventId;
                await get().saveInterview(interview);
              }
            } catch (error) {
              console.error('Failed to create calendar event:', error);
            }
          }

          // Schedule reminders
          await get().scheduleReminders(interview);

          return id;
        } catch (error) {
          console.error('Failed to schedule interview:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      // Reschedule Interview
      rescheduleInterview: async (id, newTime) => {
        set({ isLoading: true });
        try {
          const interview = get().scheduledInterviews.find(i => i.id === id);
          if (!interview) throw new Error('Interview not found');

          const updatedInterview = {
            ...interview,
            scheduledTime: newTime,
            updatedAt: new Date(),
            reminderSent: false, // Reset reminder status
          };

          // Update database
          await table.updateItem('ewhkqzfu5ngg', {
            _uid: `user_${Date.now()}`,
            _id: interview.id,
            scheduled_time: newTime.toISOString(),
            reminder_sent: 'false',
            updated_at: updatedInterview.updatedAt.toISOString(),
          });

          // Update local state
          set(state => ({
            scheduledInterviews: state.scheduledInterviews.map(i => 
              i.id === id ? updatedInterview : i
            ),
            isLoading: false,
          }));

          // Update calendar event
          if (interview.calendarEventId && get().calendarIntegration.connected) {
            await get().updateCalendarEvent(interview.calendarEventId, updatedInterview);
          }

          // Reschedule reminders
          await get().scheduleReminders(updatedInterview);

        } catch (error) {
          console.error('Failed to reschedule interview:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      // Cancel Interview
      cancelInterview: async (id, reason) => {
        set({ isLoading: true });
        try {
          const interview = get().scheduledInterviews.find(i => i.id === id);
          if (!interview) throw new Error('Interview not found');

          const updatedInterview = {
            ...interview,
            status: 'cancelled' as const,
            notes: reason ? `${interview.notes || ''}\nCancellation reason: ${reason}` : interview.notes,
            updatedAt: new Date(),
          };

          // Update database
          await table.updateItem('ewhkqzfu5ngg', {
            _uid: `user_${Date.now()}`,
            _id: interview.id,
            status: 'cancelled',
            notes: updatedInterview.notes || '',
            updated_at: updatedInterview.updatedAt.toISOString(),
          });

          // Update local state
          set(state => ({
            scheduledInterviews: state.scheduledInterviews.map(i => 
              i.id === id ? updatedInterview : i
            ),
            isLoading: false,
          }));

          // Cancel calendar event
          if (interview.calendarEventId && get().calendarIntegration.connected) {
            await get().deleteCalendarEvent(interview.calendarEventId);
          }

          // Send cancellation notification
          if (interview.attendees.length > 0) {
            try {
              await get().sendCancellationNotification(interview, reason);
            } catch (error) {
              console.error('Failed to send cancellation notification:', error);
            }
          }

        } catch (error) {
          console.error('Failed to cancel interview:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      // Update Interview Status
      updateInterviewStatus: async (id, status) => {
        try {
          const interview = get().scheduledInterviews.find(i => i.id === id);
          if (!interview) throw new Error('Interview not found');

          const updatedInterview = {
            ...interview,
            status,
            updatedAt: new Date(),
          };

          // Update database
          await table.updateItem('ewhkqzfu5ngg', {
            _uid: `user_${Date.now()}`,
            _id: interview.id,
            status,
            updated_at: updatedInterview.updatedAt.toISOString(),
          });

          // Update local state
          set(state => ({
            scheduledInterviews: state.scheduledInterviews.map(i => 
              i.id === id ? updatedInterview : i
            ),
          }));

        } catch (error) {
          console.error('Failed to update interview status:', error);
          throw error;
        }
      },

      // Calendar Integration
      connectCalendar: async (provider, tokens) => {
        try {
          // This would integrate with actual calendar APIs
          // For now, we'll simulate the connection
          const integration: CalendarIntegration = {
            provider,
            connected: true,
            accessToken: tokens?.accessToken,
            refreshToken: tokens?.refreshToken,
            lastSync: new Date(),
          };

          set({ calendarIntegration: integration });
          
          // Sync existing interviews
          await get().syncWithCalendar();
        } catch (error) {
          console.error('Failed to connect calendar:', error);
          throw error;
        }
      },

      disconnectCalendar: () => {
        set({
          calendarIntegration: {
            provider: 'none',
            connected: false,
          }
        });
      },

      syncWithCalendar: async () => {
        const { calendarIntegration } = get();
        if (!calendarIntegration.connected) return;

        try {
          // This would sync with actual calendar API
          // For now, we'll update the last sync time
          set({
            calendarIntegration: {
              ...calendarIntegration,
              lastSync: new Date(),
            }
          });
        } catch (error) {
          console.error('Failed to sync with calendar:', error);
        }
      },

      createCalendarEvent: async (interview) => {
        const { calendarIntegration } = get();
        if (!calendarIntegration.connected) return undefined;

        try {
          // This would create an actual calendar event
          // For now, we'll return a mock event ID
          const eventId = `cal_event_${Date.now()}`;
          
          // In a real implementation, this would call the calendar API
          console.log('Creating calendar event:', {
            title: `${interview.type === 'mock' ? 'Mock ' : ''}Interview: ${interview.role} at ${interview.company}`,
            start: interview.scheduledTime,
            duration: interview.duration,
            attendees: interview.attendees,
          });

          return eventId;
        } catch (error) {
          console.error('Failed to create calendar event:', error);
          return undefined;
        }
      },

      updateCalendarEvent: async (eventId, interview) => {
        const { calendarIntegration } = get();
        if (!calendarIntegration.connected) return;

        try {
          // This would update the actual calendar event
          console.log('Updating calendar event:', eventId, interview);
        } catch (error) {
          console.error('Failed to update calendar event:', error);
        }
      },

      deleteCalendarEvent: async (eventId) => {
        const { calendarIntegration } = get();
        if (!calendarIntegration.connected) return;

        try {
          // This would delete the actual calendar event
          console.log('Deleting calendar event:', eventId);
        } catch (error) {
          console.error('Failed to delete calendar event:', error);
        }
      },

      // Reminder Management
      updateReminderSettings: (settings) => {
        set(state => ({
          reminderSettings: { ...state.reminderSettings, ...settings }
        }));
      },

      sendReminder: async (interviewId, type) => {
        try {
          const interview = get().scheduledInterviews.find(i => i.id === interviewId);
          if (!interview) return;

          const user = { id: `user_${Date.now()}`, email: 'user@example.com' }; // Placeholder - auth.getUser() not available
          if (!user) return;

          if (type === 'email' && get().reminderSettings.emailReminders) {
            const timeUntilInterview = Math.floor((interview.scheduledTime.getTime() - Date.now()) / 60000);
            
            await email.sendEmail({
              from: 'noreply@aijobhub.com',
              to: [user.email],
              subject: `Reminder: ${interview.type === 'mock' ? 'Mock ' : ''}Interview in ${timeUntilInterview} minutes`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #2563eb;">Interview Reminder</h2>
                  <p>This is a reminder that you have an upcoming interview:</p>
                  
                  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">${interview.role} at ${interview.company}</h3>
                    <p><strong>Date:</strong> ${interview.scheduledTime.toLocaleDateString()}</p>
                    <p><strong>Time:</strong> ${interview.scheduledTime.toLocaleTimeString()}</p>
                    <p><strong>Duration:</strong> ${interview.duration} minutes</p>
                    <p><strong>Type:</strong> ${interview.type === 'mock' ? 'Mock Interview' : 'Real Interview'}</p>
                    ${interview.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${interview.meetingLink}">${interview.meetingLink}</a></p>` : ''}
                  </div>
                  
                  ${interview.notes ? `
                    <div style="margin: 20px 0;">
                      <h4>Notes:</h4>
                      <p>${interview.notes}</p>
                    </div>
                  ` : ''}
                  
                  <p>Good luck with your interview!</p>
                  <p>Best regards,<br>AIJobHub Team</p>
                </div>
              `,
            });
          }

          // Mark reminder as sent
          await get().updateInterviewStatus(interviewId, interview.status);
          set(state => ({
            scheduledInterviews: state.scheduledInterviews.map(i => 
              i.id === interviewId ? { ...i, reminderSent: true } : i
            ),
          }));

        } catch (error) {
          console.error('Failed to send reminder:', error);
        }
      },

      scheduleReminders: async (interview) => {
        const { reminderSettings } = get();
        if (!reminderSettings.enabled) return;

        // This would schedule actual reminders
        // For now, we'll just log the scheduling
        console.log('Scheduling reminders for interview:', interview.id, {
          times: reminderSettings.reminderTimes,
          scheduledTime: interview.scheduledTime,
        });
      },

      checkAndSendReminders: async () => {
        const { scheduledInterviews, reminderSettings } = get();
        if (!reminderSettings.enabled) return;

        const now = new Date();
        
        for (const interview of scheduledInterviews) {
          if (interview.status !== 'scheduled' || interview.reminderSent) continue;

          const timeUntilInterview = interview.scheduledTime.getTime() - now.getTime();
          const minutesUntilInterview = Math.floor(timeUntilInterview / 60000);

          // Check if any reminder time matches
          for (const reminderTime of reminderSettings.reminderTimes) {
            if (minutesUntilInterview <= reminderTime && minutesUntilInterview > reminderTime - 5) {
              await get().sendReminder(interview.id, 'email');
              break;
            }
          }
        }
      },

      // Availability Management
      updateAvailability: (availability) => {
        set({ availability });
      },

      getAvailableSlots: (date, duration) => {
        const { availability } = get();
        const dayOfWeek = date.getDay();
        const dayAvailability = availability.find(a => a.dayOfWeek === dayOfWeek);
        
        if (!dayAvailability || !dayAvailability.enabled) return [];

        const slots: string[] = [];
        const startHour = parseInt(dayAvailability.startTime.split(':')[0]);
        const startMinute = parseInt(dayAvailability.startTime.split(':')[1]);
        const endHour = parseInt(dayAvailability.endTime.split(':')[0]);
        const endMinute = parseInt(dayAvailability.endTime.split(':')[1]);

        const startTime = startHour * 60 + startMinute;
        const endTime = endHour * 60 + endMinute;

        // Generate slots every 30 minutes
        for (let time = startTime; time <= endTime - duration; time += 30) {
          const hours = Math.floor(time / 60);
          const minutes = time % 60;
          const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          
          // Check if slot is available (not conflicting with existing interviews)
          const slotDate = new Date(date);
          slotDate.setHours(hours, minutes, 0, 0);
          
          if (get().isTimeSlotAvailable(slotDate, duration)) {
            slots.push(timeString);
          }
        }

        return slots;
      },

      isTimeSlotAvailable: (date, duration) => {
        const { scheduledInterviews } = get();
        const endTime = new Date(date.getTime() + duration * 60000);

        return !scheduledInterviews.some(interview => {
          if (interview.status === 'cancelled') return false;
          
          const interviewStart = interview.scheduledTime;
          const interviewEnd = new Date(interviewStart.getTime() + interview.duration * 60000);
          
          // Check for overlap
          return (date < interviewEnd && endTime > interviewStart);
        });
      },

      // Data Management
      loadScheduledInterviews: async () => {
        set({ isLoading: true });
        try {
          const user = { id: `user_${Date.now()}`, email: 'user@example.com' }; // Placeholder - auth.getUser() not available
          if (!user) {
            set({ isLoading: false });
            return;
          }

          const results = await table.getItems('ewhkqzfu5ngg', {
            query: { _uid: user.id },
          });

          const interviews: ScheduledInterview[] = results.items.map((item: any) => ({
            id: item._id,
            title: item.title,
            type: item.type,
            scheduledTime: new Date(item.scheduled_time),
            duration: item.duration,
            role: item.role,
            company: item.company,
            difficulty: item.difficulty,
            status: item.status,
            reminderSent: item.reminder_sent === 'true',
            calendarEventId: item.calendar_event_id || undefined,
            attendees: JSON.parse(item.attendees || '[]'),
            meetingLink: item.meeting_link || undefined,
            notes: item.notes || undefined,
            sessionData: JSON.parse(item.session_data || '{}'),
            createdAt: new Date(item.created_at),
            updatedAt: new Date(item.updated_at),
          }));

          set({ scheduledInterviews: interviews, isLoading: false });

        } catch (error) {
          console.error('Failed to load scheduled interviews:', error);
          set({ isLoading: false });
        }
      },

      saveInterview: async (interview) => {
        try {
          await table.updateItem('ewhkqzfu5ngg', {
            _uid: `user_${Date.now()}`,
            _id: interview.id,
            title: interview.title,
            type: interview.type,
            scheduled_time: interview.scheduledTime.toISOString(),
            duration: interview.duration,
            role: interview.role,
            company: interview.company,
            difficulty: interview.difficulty,
            status: interview.status,
            reminder_sent: interview.reminderSent ? 'true' : 'false',
            calendar_event_id: interview.calendarEventId || '',
            attendees: JSON.stringify(interview.attendees),
            meeting_link: interview.meetingLink || '',
            notes: interview.notes || '',
            session_data: JSON.stringify(interview.sessionData || {}),
            updated_at: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Failed to save interview:', error);
          throw error;
        }
      },

      deleteInterview: async (id) => {
        try {
          const interview = get().scheduledInterviews.find(i => i.id === id);
          if (!interview) throw new Error('Interview not found');
          
          await table.deleteItem('ewhkqzfu5ngg', {
            _uid: `user_${Date.now()}`,
            _id: interview.id,
          });
          set(state => ({
            scheduledInterviews: state.scheduledInterviews.filter(i => i.id !== id),
          }));
        } catch (error) {
          console.error('Failed to delete interview:', error);
          throw error;
        }
      },

      // View Management
      setSelectedDate: (date) => {
        set({ selectedDate: date });
      },

      setCurrentView: (view) => {
        set({ currentView: view });
      },

      getInterviewsForDate: (date) => {
        const { scheduledInterviews } = get();
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);

        return scheduledInterviews.filter(interview => {
          const interviewDate = new Date(interview.scheduledTime);
          return interviewDate >= targetDate && interviewDate < nextDay;
        });
      },

      getUpcomingInterviews: (limit = 5) => {
        const { scheduledInterviews } = get();
        const now = new Date();
        
        return scheduledInterviews
          .filter(interview => interview.scheduledTime > now && interview.status === 'scheduled')
          .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime())
          .slice(0, limit);
      },

      getPastInterviews: (limit = 10) => {
        const { scheduledInterviews } = get();
        const now = new Date();
        
        return scheduledInterviews
          .filter(interview => interview.scheduledTime <= now || interview.status === 'completed')
          .sort((a, b) => b.scheduledTime.getTime() - a.scheduledTime.getTime())
          .slice(0, limit);
      },

      // Analytics
      getInterviewStats: () => {
        const { scheduledInterviews } = get();
        const total = scheduledInterviews.length;
        const completed = scheduledInterviews.filter(i => i.status === 'completed').length;
        const cancelled = scheduledInterviews.filter(i => i.status === 'cancelled').length;
        const upcoming = scheduledInterviews.filter(i => i.status === 'scheduled' && i.scheduledTime > new Date()).length;
        const completionRate = total > 0 ? (completed / (total - cancelled)) * 100 : 0;
        const averageDuration = scheduledInterviews.length > 0 
          ? scheduledInterviews.reduce((sum, i) => sum + i.duration, 0) / scheduledInterviews.length 
          : 0;

        return {
          total,
          completed,
          cancelled,
          upcoming,
          completionRate,
          averageDuration,
        };
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      // Helper method for sending cancellation notifications
      sendCancellationNotification: async (interview: ScheduledInterview, reason?: string) => {
        try {
          const user = { id: `user_${Date.now()}`, email: 'user@example.com' }; // Placeholder - auth.getUser() not available
          if (!user) return;

          // Send cancellation email to attendees
          for (const attendeeEmail of interview.attendees) {
            await email.sendEmail({
              from: 'noreply@aijobhub.com',
              to: [attendeeEmail],
              subject: `Interview Cancelled: ${interview.role} at ${interview.company}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #dc2626;">Interview Cancelled</h2>
                  <p>The following interview has been cancelled:</p>
                  
                  <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #dc2626;">${interview.role} at ${interview.company}</h3>
                    <p><strong>Date:</strong> ${interview.scheduledTime.toLocaleDateString()}</p>
                    <p><strong>Time:</strong> ${interview.scheduledTime.toLocaleTimeString()}</p>
                    <p><strong>Duration:</strong> ${interview.duration} minutes</p>
                  </div>
                  
                  ${reason ? `
                    <div style="margin: 20px 0;">
                      <h4>Reason:</h4>
                      <p>${reason}</p>
                    </div>
                  ` : ''}
                  
                  <p>We apologize for any inconvenience this may cause.</p>
                  <p>Best regards,<br>AIJobHub Team</p>
                </div>
              `,
            });
          }
        } catch (error) {
          console.error('Failed to send cancellation notification:', error);
        }
      },
    }),
    {
      name: 'interview-scheduling-store',
      partialize: (state) => ({
        calendarIntegration: state.calendarIntegration,
        reminderSettings: state.reminderSettings,
        availability: state.availability,
        currentView: state.currentView,
      }),
    }
  )
);