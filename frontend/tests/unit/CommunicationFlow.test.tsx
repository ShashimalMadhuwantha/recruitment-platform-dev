import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationBell } from '../../src/components/shared/NotificationBell';
import { ApplicationMessageDrawer } from '../../src/features/communication/components/ApplicationMessageDrawer';
import { InterviewSchedulerModal } from '../../src/features/communication/components/InterviewSchedulerModal';
import { InterviewScorecardModal } from '../../src/features/communication/components/InterviewScorecardModal';
import * as NotificationHooksModule from '../../src/features/notifications/hooks';
import * as CommunicationHooksModule from '../../src/features/communication/hooks';
import type { InterviewScheduleDto } from '../../src/features/communication/types';

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Epic 12: Communication, Scheduling & Notifications Flow (FR-RC-17 to FR-RC-20, FR-AP-25 to FR-AP-27)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. In-App Notification Center & Bell (FR-AP-27)', () => {
    it('displays unread notification counter badge and opens popover dropdown', async () => {
      vi.spyOn(NotificationHooksModule, 'useUnreadNotificationCount').mockReturnValue({
        data: 3,
        isLoading: false,
      } as any);

      vi.spyOn(NotificationHooksModule, 'useNotifications').mockReturnValue({
        data: {
          items: [
            {
              id: 'notif-1',
              userId: 'user-1',
              type: 'NEW_MESSAGE',
              title: 'New Message from Senior Recruiter',
              message: 'Hello Alex, we were impressed by your profile.',
              link: '/applicant/dashboard',
              payloadJson: {},
              isRead: false,
              readAt: null,
              createdAt: new Date().toISOString(),
            },
            {
              id: 'notif-2',
              userId: 'user-1',
              type: 'INTERVIEW_SCHEDULED',
              title: 'Interview Scheduled: Round 1',
              message: 'Your interview has been scheduled for tomorrow.',
              link: '/applicant/dashboard',
              payloadJson: {},
              isRead: false,
              readAt: null,
              createdAt: new Date().toISOString(),
            },
          ],
          total: 2,
          unreadCount: 2,
          limit: 15,
          offset: 0,
        },
        isLoading: false,
      } as any);

      const mockMarkAllRead = vi.fn();
      vi.spyOn(NotificationHooksModule, 'useMarkAllNotificationsRead').mockReturnValue({
        mutate: mockMarkAllRead,
        isPending: false,
      } as any);

      vi.spyOn(NotificationHooksModule, 'useMarkNotificationRead').mockReturnValue({
        mutateAsync: vi.fn(),
      } as any);

      renderWithProviders(<NotificationBell />);

      // Verify unread badge shows 3
      expect(screen.getByText('3')).toBeInTheDocument();

      // Click bell icon to open popover
      const bellButton = screen.getByLabelText(/Notifications/i);
      fireEvent.click(bellButton);

      // Verify dropdown content
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('New Message from Senior Recruiter')).toBeInTheDocument();
      expect(screen.getByText('Interview Scheduled: Round 1')).toBeInTheDocument();

      // Click "Mark all read"
      const markAllBtn = screen.getByText('Mark all read');
      fireEvent.click(markAllBtn);
      expect(mockMarkAllRead).toHaveBeenCalled();
    });
  });

  describe('2. In-App Direct Messaging Drawer (FR-RC-17, FR-AP-25)', () => {
    it('renders message thread history and dispatches new reply', async () => {
      const mockSendMessage = vi.fn().mockResolvedValue({});
      vi.spyOn(CommunicationHooksModule, 'useSendMessage').mockReturnValue({
        mutateAsync: mockSendMessage,
        isPending: false,
      } as any);

      vi.spyOn(CommunicationHooksModule, 'useApplicationMessages').mockReturnValue({
        data: [
          {
            id: 'msg-1',
            applicationId: 'app-1',
            senderId: 'recruiter-1',
            senderName: 'Sarah Recruiter',
            senderRole: 'RECRUITER',
            receiverId: 'applicant-1',
            body: 'Hello Alex, are you available for a brief call tomorrow?',
            isRead: true,
            readAt: new Date().toISOString(),
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          },
        ],
        isLoading: false,
      } as any);

      const onClose = vi.fn();
      renderWithProviders(
        <ApplicationMessageDrawer
          isOpen={true}
          onClose={onClose}
          applicationId="app-1"
          candidateName="Alex Candidate"
          jobTitle="Senior Frontend Engineer"
          currentUserId="applicant-1"
        />
      );

      // Verify drawer header & existing message
      expect(screen.getByText('Alex Candidate')).toBeInTheDocument();
      expect(screen.getByText('Senior Frontend Engineer')).toBeInTheDocument();
      expect(
        screen.getByText('Hello Alex, are you available for a brief call tomorrow?')
      ).toBeInTheDocument();

      // Compose and send a reply
      const textarea = screen.getByPlaceholderText(/Type a message/i);
      fireEvent.change(textarea, { target: { value: 'Yes, absolutely! 2pm works best for me.' } });

      const sendBtn = screen.getByRole('button', { name: /Send/i });
      fireEvent.click(sendBtn);

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith({
          body: 'Yes, absolutely! 2pm works best for me.',
        });
      });
    });
  });

  describe('3. Interview Scheduler Modal (FR-RC-18, FR-RC-19, FR-AP-26)', () => {
    it('allows recruiter to schedule interview and triggers schedule mutation', async () => {
      const mockSchedule = vi.fn().mockResolvedValue({});
      vi.spyOn(CommunicationHooksModule, 'useScheduleInterview').mockReturnValue({
        mutateAsync: mockSchedule,
        isPending: false,
      } as any);

      const onClose = vi.fn();
      renderWithProviders(
        <InterviewSchedulerModal
          isOpen={true}
          onClose={onClose}
          applicationId="app-1"
          candidateName="Alex Candidate"
          jobTitle="Senior Frontend Engineer"
        />
      );

      expect(screen.getByText('Schedule Candidate Interview')).toBeInTheDocument();
      expect(screen.getByText(/Alex Candidate/)).toBeInTheDocument();

      // Title input
      const titleInput = screen.getByLabelText(/Interview Title \*/i);
      fireEvent.change(titleInput, {
        target: { value: 'Round 2: Architecture Deep Dive' },
      });

      // Submit form
      const submitBtn = screen.getByRole('button', { name: /Schedule & Notify Candidate/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockSchedule).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Round 2: Architecture Deep Dive',
            interviewType: 'VIDEO',
            durationMins: 60,
          })
        );
      });
    });
  });

  describe('4. Structured Interview Scorecard Form (FR-RC-20)', () => {
    it('interacts with 5 rating criteria, computes overall average, and submits scorecard', async () => {
      const mockSubmitFeedback = vi.fn().mockResolvedValue({});
      vi.spyOn(CommunicationHooksModule, 'useSubmitInterviewFeedback').mockReturnValue({
        mutateAsync: mockSubmitFeedback,
        isPending: false,
      } as any);

      const mockInterview: InterviewScheduleDto = {
        id: 'interview-1',
        applicationId: 'app-1',
        candidateName: 'Alex Candidate',
        jobTitle: 'Senior Frontend Engineer',
        interviewerId: 'recruiter-1',
        interviewerName: 'Sarah Recruiter',
        title: 'Round 1: Technical & System Architecture',
        interviewType: 'VIDEO',
        scheduledAt: new Date().toISOString(),
        durationMins: 60,
        timezone: 'UTC',
        videoLink: 'https://meet.jit.si/ats-interview-1',
        location: null,
        status: 'SCHEDULED',
        notes: null,
        hasFeedback: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const onClose = vi.fn();
      renderWithProviders(
        <InterviewScorecardModal
          isOpen={true}
          onClose={onClose}
          interview={mockInterview}
          applicationId="app-1"
        />
      );

      expect(screen.getByText('Interview Scorecard & Evaluation')).toBeInTheDocument();
      expect(screen.getByText(/Alex Candidate/)).toBeInTheDocument();

      // Initial average (all defaults to 4) -> 4.0 / 5.0
      expect(screen.getByText('4.0')).toBeInTheDocument();

      // Change technical competency to 5
      const tech5Star = screen.getByLabelText('Rate Technical Competency & Engineering Depth 5 of 5');
      fireEvent.click(tech5Star);

      // 5 + 4 + 4 + 4 + 4 = 21 / 5 = 4.2
      expect(screen.getByText('4.2')).toBeInTheDocument();

      // Select "Strong Hire" recommendation
      const strongHireBtn = screen.getByRole('button', { name: /Strong Hire/i });
      fireEvent.click(strongHireBtn);

      // Enter qualitative notes
      const notesInput = screen.getByPlaceholderText(/Detail candidate highlights/i);
      fireEvent.change(notesInput, {
        target: { value: 'Superb architecture knowledge and clear communication.' },
      });

      // Submit feedback
      const submitBtn = screen.getByRole('button', {
        name: /Submit Scorecard & Complete Interview/i,
      });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockSubmitFeedback).toHaveBeenCalledWith({
          interviewId: 'interview-1',
          dto: {
            scorecard: {
              technicalCompetency: 5,
              communication: 4,
              problemSolving: 4,
              experienceAlignment: 4,
              culturalFit: 4,
              overallAverage: 4.2,
            },
            recommendation: 'STRONG_HIRE',
            notes: 'Superb architecture knowledge and clear communication.',
          },
        });
      });
    });
  });
});
