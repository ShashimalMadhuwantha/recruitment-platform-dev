import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { offersApi } from './api';
import type { CreateOfferDto, RespondOfferDto, HireCandidateDto } from './types';

export const useApplicationOffer = (applicationId?: string) => {
  return useQuery({
    queryKey: ['application-offer', applicationId],
    queryFn: () => offersApi.getOfferByApplication(applicationId!),
    enabled: Boolean(applicationId),
  });
};

export const useCreateOrUpdateOffer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      applicationId,
      data,
    }: {
      applicationId: string;
      data: CreateOfferDto;
    }) => offersApi.createOrUpdateOffer(applicationId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['application-offer', variables.applicationId] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-applications'] });
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
    },
  });
};

export const useSendOffer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (offerId: string) => offersApi.sendOffer(offerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application-offer'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-applications'] });
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
    },
  });
};

export const useRespondOffer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ offerId, data }: { offerId: string; data: RespondOfferDto }) =>
      offersApi.respondOffer(offerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application-offer'] });
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-applications'] });
    },
  });
};

export const useHireCandidate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      applicationId,
      data,
    }: {
      applicationId: string;
      data: HireCandidateDto;
    }) => offersApi.hireCandidate(applicationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application-offer'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-applications'] });
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      queryClient.invalidateQueries({ queryKey: ['company-jobs'] });
    },
  });
};
