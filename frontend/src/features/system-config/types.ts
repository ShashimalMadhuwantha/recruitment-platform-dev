export type {
  ScoreWeightConfig,
  AtsWeightPreset,
  SkillTaxonomyItem,
  IndustryItem,
  LocationItem,
  NotificationTemplateItem,
  NotificationChannel,
  SystemIntegrationSettingItem,
  IntegrationProvider,
  IntegrationStatus,
  FeatureFlagItem,
  PlanTier,
} from '@recruitment-platform/shared';

export interface AtsWeightResponse {
  current: {
    id: string;
    skillsWeight: number;
    experienceWeight: number;
    educationWeight: number;
    semanticWeight: number;
    certificationWeight: number;
    isDefault: boolean;
    createdAt: string;
  };
  presets: import('@recruitment-platform/shared').AtsWeightPreset[];
}

export interface TemplatePreviewResponse {
  templateId: string;
  code: string;
  channel: import('@recruitment-platform/shared').NotificationChannel;
  renderedSubject: string;
  renderedBody: string;
  sampleTokensUsed: Record<string, string>;
}

export interface IntegrationTestResponse {
  provider: import('@recruitment-platform/shared').IntegrationProvider;
  status: import('@recruitment-platform/shared').IntegrationStatus;
  success: boolean;
  message: string | null;
  testedAt: string;
}
