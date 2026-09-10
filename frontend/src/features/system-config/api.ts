import { apiClient } from '../../lib/api-client';
import type {
  AtsWeightResponse,
  SkillTaxonomyItem,
  IndustryItem,
  LocationItem,
  NotificationTemplateItem,
  SystemIntegrationSettingItem,
  FeatureFlagItem,
  TemplatePreviewResponse,
  IntegrationTestResponse,
  ScoreWeightConfig,
  PlanTier,
  IntegrationProvider,
} from './types';

export const systemConfigApi = {
  // 1. ATS Weights
  getAtsWeights: async (): Promise<AtsWeightResponse> => {
    const res = await apiClient.get<{ data: AtsWeightResponse }>('/v1/admin/config/ats-weights');
    return res.data.data;
  },

  updateAtsWeights: async (weights: ScoreWeightConfig): Promise<AtsWeightResponse['current']> => {
    const res = await apiClient.put<{ data: AtsWeightResponse['current'] }>('/v1/admin/config/ats-weights', weights);
    return res.data.data;
  },

  // 2. Skills Taxonomy
  listSkills: async (search?: string, category?: string): Promise<SkillTaxonomyItem[]> => {
    const res = await apiClient.get<{ data: SkillTaxonomyItem[] }>('/v1/admin/config/skills', {
      params: { search, category },
    });
    return res.data.data;
  },

  createSkill: async (data: { name: string; category?: string | null; aliases?: string[] }): Promise<SkillTaxonomyItem> => {
    const res = await apiClient.post<{ data: SkillTaxonomyItem }>('/v1/admin/config/skills', data);
    return res.data.data;
  },

  updateSkill: async (id: string, data: { name?: string; category?: string | null; aliases?: string[] }): Promise<SkillTaxonomyItem> => {
    const res = await apiClient.put<{ data: SkillTaxonomyItem }>(`/v1/admin/config/skills/${id}`, data);
    return res.data.data;
  },

  deleteSkill: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete<{ data: { success: boolean; message: string } }>(`/v1/admin/config/skills/${id}`);
    return res.data.data;
  },

  // 3. Industries
  listIndustries: async (search?: string): Promise<IndustryItem[]> => {
    const res = await apiClient.get<{ data: IndustryItem[] }>('/v1/admin/config/industries', {
      params: { search },
    });
    return res.data.data;
  },

  createIndustry: async (data: { name: string; category?: string | null; isActive?: boolean }): Promise<IndustryItem> => {
    const res = await apiClient.post<{ data: IndustryItem }>('/v1/admin/config/industries', data);
    return res.data.data;
  },

  updateIndustry: async (id: string, data: { name?: string; category?: string | null; isActive?: boolean }): Promise<IndustryItem> => {
    const res = await apiClient.put<{ data: IndustryItem }>(`/v1/admin/config/industries/${id}`, data);
    return res.data.data;
  },

  deleteIndustry: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete<{ data: { success: boolean; message: string } }>(`/v1/admin/config/industries/${id}`);
    return res.data.data;
  },

  // 4. Locations
  listLocations: async (search?: string): Promise<LocationItem[]> => {
    const res = await apiClient.get<{ data: LocationItem[] }>('/v1/admin/config/locations', {
      params: { search },
    });
    return res.data.data;
  },

  createLocation: async (data: { city: string; state?: string | null; country: string; isRemoteAllowed?: boolean; isActive?: boolean }): Promise<LocationItem> => {
    const res = await apiClient.post<{ data: LocationItem }>('/v1/admin/config/locations', data);
    return res.data.data;
  },

  updateLocation: async (id: string, data: { city?: string; state?: string | null; country?: string; isRemoteAllowed?: boolean; isActive?: boolean }): Promise<LocationItem> => {
    const res = await apiClient.put<{ data: LocationItem }>(`/v1/admin/config/locations/${id}`, data);
    return res.data.data;
  },

  deleteLocation: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete<{ data: { success: boolean; message: string } }>(`/v1/admin/config/locations/${id}`);
    return res.data.data;
  },

  // 5. Notification Templates
  listNotificationTemplates: async (): Promise<NotificationTemplateItem[]> => {
    const res = await apiClient.get<{ data: NotificationTemplateItem[] }>('/v1/admin/config/notification-templates');
    return res.data.data;
  },

  getNotificationTemplate: async (id: string): Promise<NotificationTemplateItem> => {
    const res = await apiClient.get<{ data: NotificationTemplateItem }>(`/v1/admin/config/notification-templates/${id}`);
    return res.data.data;
  },

  createNotificationTemplate: async (data: {
    name: string;
    code: string;
    channel?: 'EMAIL' | 'IN_APP' | 'SMS';
    subject: string;
    body: string;
    variables?: string[];
    isActive?: boolean;
  }): Promise<NotificationTemplateItem> => {
    const res = await apiClient.post<{ data: NotificationTemplateItem }>('/v1/admin/config/notification-templates', data);
    return res.data.data;
  },

  updateNotificationTemplate: async (id: string, data: {
    name?: string;
    subject?: string;
    body?: string;
    variables?: string[];
    isActive?: boolean;
  }): Promise<NotificationTemplateItem> => {
    const res = await apiClient.put<{ data: NotificationTemplateItem }>(`/v1/admin/config/notification-templates/${id}`, data);
    return res.data.data;
  },

  previewTemplate: async (id: string, sampleData?: Record<string, string>): Promise<TemplatePreviewResponse> => {
    const res = await apiClient.post<{ data: TemplatePreviewResponse }>(`/v1/admin/config/notification-templates/${id}/preview`, { sampleData });
    return res.data.data;
  },

  // 6. Third-Party Integrations
  listIntegrations: async (): Promise<SystemIntegrationSettingItem[]> => {
    const res = await apiClient.get<{ data: SystemIntegrationSettingItem[] }>('/v1/admin/config/integrations');
    return res.data.data;
  },

  updateIntegration: async (
    provider: IntegrationProvider,
    config: Record<string, unknown>,
    status?: string
  ): Promise<SystemIntegrationSettingItem> => {
    const res = await apiClient.put<{ data: SystemIntegrationSettingItem }>(`/v1/admin/config/integrations/${provider}`, {
      config,
      status,
    });
    return res.data.data;
  },

  testIntegration: async (provider: IntegrationProvider): Promise<IntegrationTestResponse> => {
    const res = await apiClient.post<{ data: IntegrationTestResponse }>(`/v1/admin/config/integrations/${provider}/test`);
    return res.data.data;
  },

  // 7. Feature Flags
  listFeatureFlags: async (): Promise<FeatureFlagItem[]> => {
    const res = await apiClient.get<{ data: FeatureFlagItem[] }>('/v1/admin/config/feature-flags');
    return res.data.data;
  },

  updateFeatureFlag: async (
    key: string,
    data: {
      name?: string;
      description?: string | null;
      enabledTiers?: PlanTier[];
      isGloballyEnabled?: boolean;
    }
  ): Promise<FeatureFlagItem> => {
    const res = await apiClient.put<{ data: FeatureFlagItem }>(`/v1/admin/config/feature-flags/${key}`, data);
    return res.data.data;
  },
};
