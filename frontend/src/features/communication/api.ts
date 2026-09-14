import { apiClient } from '../../lib/api-client';
import type {
  ApplicationMessageDto,
  SendMessageDto,
  InterviewScheduleDto,
  CreateInterviewDto,
  UpdateInterviewStatusDto,
  InterviewFeedbackDto,
  SubmitFeedbackDto,
} from './types';

export const communicationApi = {
  /**
   * Fetch all messages for an application conversation
   */
  getMessages: async (applicationId: string): Promise<ApplicationMessageDto[]> => {
    const res = await apiClient.get<{ data: ApplicationMessageDto[] }>(
      `/v1/applications/${applicationId}/messages`
    );
    return res.data.data;
  },

  /**
   * Send a new message in application conversation
   */
  sendMessage: async (
    applicationId: string,
    dto: SendMessageDto
  ): Promise<ApplicationMessageDto> => {
    const res = await apiClient.post<{ data: ApplicationMessageDto }>(
      `/v1/applications/${applicationId}/messages`,
      dto
    );
    return res.data.data;
  },

  /**
   * Get all scheduled interviews for an application
   */
  getInterviews: async (applicationId: string): Promise<InterviewScheduleDto[]> => {
    const res = await apiClient.get<{ data: InterviewScheduleDto[] }>(
      `/v1/applications/${applicationId}/interviews`
    );
    return res.data.data;
  },

  /**
   * Schedule a new interview for an application
   */
  scheduleInterview: async (
    applicationId: string,
    dto: CreateInterviewDto
  ): Promise<InterviewScheduleDto> => {
    const res = await apiClient.post<{ data: InterviewScheduleDto }>(
      `/v1/applications/${applicationId}/interviews`,
      dto
    );
    return res.data.data;
  },

  /**
   * Update interview status (e.g. CANCELLED, RESCHEDULED, COMPLETED)
   */
  updateInterviewStatus: async (
    interviewId: string,
    dto: UpdateInterviewStatusDto
  ): Promise<InterviewScheduleDto> => {
    const res = await apiClient.patch<{ data: InterviewScheduleDto }>(
      `/v1/interviews/${interviewId}/status`,
      dto
    );
    return res.data.data;
  },

  /**
   * Submit interview scorecard & recommendation
   */
  submitFeedback: async (
    interviewId: string,
    dto: SubmitFeedbackDto
  ): Promise<InterviewFeedbackDto> => {
    const res = await apiClient.post<{ data: InterviewFeedbackDto }>(
      `/v1/interviews/${interviewId}/feedback`,
      dto
    );
    return res.data.data;
  },

  /**
   * Download RFC 5545 .ics iCalendar file for interview
   */
  downloadIcsCalendar: async (interviewId: string, title?: string): Promise<void> => {
    const res = await apiClient.get(`/v1/interviews/${interviewId}/calendar.ics`, {
      responseType: 'blob',
    });

    const blob = new Blob([res.data], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${title ? title.replace(/\s+/g, '_') : 'interview'}.ics`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
