import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communicationApi } from './api';
import type {
  SendMessageDto,
  CreateInterviewDto,
  UpdateInterviewStatusDto,
  SubmitFeedbackDto,
} from './types';

export const COMMUNICATION_KEYS = {
  all: ['communication'] as const,
  messages: (applicationId: string) =>
    [...COMMUNICATION_KEYS.all, 'messages', applicationId] as const,
  interviews: (applicationId: string) =>
    [...COMMUNICATION_KEYS.all, 'interviews', applicationId] as const,
};

export const useApplicationMessages = (applicationId?: string, isPolling = false) => {
  return useQuery({
    queryKey: applicationId ? COMMUNICATION_KEYS.messages(applicationId) : ['empty-messages'],
    queryFn: () => (applicationId ? communicationApi.getMessages(applicationId) : Promise.resolve([])),
    enabled: Boolean(applicationId),
    refetchInterval: isPolling ? 5000 : false, // Poll messages every 5s if active
  });
};

export const useSendMessage = (applicationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: SendMessageDto) => communicationApi.sendMessage(applicationId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: COMMUNICATION_KEYS.messages(applicationId),
      });
    },
  });
};

export const useApplicationInterviews = (applicationId?: string) => {
  return useQuery({
    queryKey: applicationId ? COMMUNICATION_KEYS.interviews(applicationId) : ['empty-interviews'],
    queryFn: () =>
      applicationId ? communicationApi.getInterviews(applicationId) : Promise.resolve([]),
    enabled: Boolean(applicationId),
  });
};

export const useScheduleInterview = (applicationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateInterviewDto) =>
      communicationApi.scheduleInterview(applicationId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: COMMUNICATION_KEYS.interviews(applicationId),
      });
      queryClient.invalidateQueries({
        queryKey: ['applications'],
      });
    },
  });
};

export const useUpdateInterviewStatus = (applicationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      interviewId,
      dto,
    }: {
      interviewId: string;
      dto: UpdateInterviewStatusDto;
    }) => communicationApi.updateInterviewStatus(interviewId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: COMMUNICATION_KEYS.interviews(applicationId),
      });
    },
  });
};

export const useSubmitInterviewFeedback = (applicationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      interviewId,
      dto,
    }: {
      interviewId: string;
      dto: SubmitFeedbackDto;
    }) => communicationApi.submitFeedback(interviewId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: COMMUNICATION_KEYS.interviews(applicationId),
      });
    },
  });
};
