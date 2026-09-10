import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemConfigApi } from './api';
import type { ScoreWeightConfig, PlanTier, IntegrationProvider } from './types';

export const useAtsWeights = () => {
  return useQuery({
    queryKey: ['system-config', 'ats-weights'],
    queryFn: () => systemConfigApi.getAtsWeights(),
  });
};

export const useUpdateAtsWeights = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (weights: ScoreWeightConfig) => systemConfigApi.updateAtsWeights(weights),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config', 'ats-weights'] });
    },
  });
};

export const useSkillsTaxonomy = (search?: string, category?: string) => {
  return useQuery({
    queryKey: ['system-config', 'skills', search, category],
    queryFn: () => systemConfigApi.listSkills(search, category),
  });
};

export const useCreateSkill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; category?: string | null; aliases?: string[] }) =>
      systemConfigApi.createSkill(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config', 'skills'] });
    },
  });
};

export const useUpdateSkill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; category?: string | null; aliases?: string[] } }) =>
      systemConfigApi.updateSkill(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config', 'skills'] });
    },
  });
};

export const useDeleteSkill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => systemConfigApi.deleteSkill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config', 'skills'] });
    },
  });
};

export const useIndustries = (search?: string) => {
  return useQuery({
    queryKey: ['system-config', 'industries', search],
    queryFn: () => systemConfigApi.listIndustries(search),
  });
};

export const useCreateIndustry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; category?: string | null; isActive?: boolean }) =>
      systemConfigApi.createIndustry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config', 'industries'] });
    },
  });
};

export const useUpdateIndustry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; category?: string | null; isActive?: boolean } }) =>
      systemConfigApi.updateIndustry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config', 'industries'] });
    },
  });
};

export const useDeleteIndustry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => systemConfigApi.deleteIndustry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config', 'industries'] });
    },
  });
};

export const useLocations = (search?: string) => {
  return useQuery({
    queryKey: ['system-config', 'locations', search],
    queryFn: () => systemConfigApi.listLocations(search),
  });
};

export const useCreateLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { city: string; state?: string | null; country: string; isRemoteAllowed?: boolean; isActive?: boolean }) =>
      systemConfigApi.createLocation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config', 'locations'] });
    },
  });
};

export const useUpdateLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { city?: string; state?: string | null; country?: string; isRemoteAllowed?: boolean; isActive?: boolean } }) =>
      systemConfigApi.updateLocation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config', 'locations'] });
    },
  });
};

export const useDeleteLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => systemConfigApi.deleteLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config', 'locations'] });
    },
  });
};

export const useNotificationTemplates = () => {
  return useQuery({
    queryKey: ['system-config', 'notification-templates'],
    queryFn: () => systemConfigApi.listNotificationTemplates(),
  });
};

export const useUpdateNotificationTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; subject?: string; body?: string; variables?: string[]; isActive?: boolean } }) =>
      systemConfigApi.updateNotificationTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config', 'notification-templates'] });
    },
  });
};

export const useIntegrations = () => {
  return useQuery({
    queryKey: ['system-config', 'integrations'],
    queryFn: () => systemConfigApi.listIntegrations(),
  });
};

export const useUpdateIntegration = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ provider, config, status }: { provider: IntegrationProvider; config: Record<string, unknown>; status?: string }) =>
      systemConfigApi.updateIntegration(provider, config, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config', 'integrations'] });
    },
  });
};

export const useTestIntegration = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (provider: IntegrationProvider) => systemConfigApi.testIntegration(provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config', 'integrations'] });
    },
  });
};

export const useFeatureFlags = () => {
  return useQuery({
    queryKey: ['system-config', 'feature-flags'],
    queryFn: () => systemConfigApi.listFeatureFlags(),
  });
};

export const useUpdateFeatureFlag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, data }: { key: string; data: { name?: string; description?: string | null; enabledTiers?: PlanTier[]; isGloballyEnabled?: boolean } }) =>
      systemConfigApi.updateFeatureFlag(key, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config', 'feature-flags'] });
    },
  });
};
