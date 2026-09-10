import { Request, Response, NextFunction } from 'express';
import { SystemConfigService } from './system-config.service';
import {
  updateAtsWeightsSchema,
  createSkillSchema,
  updateSkillSchema,
  createIndustrySchema,
  updateIndustrySchema,
  createLocationSchema,
  updateLocationSchema,
  createNotificationTemplateSchema,
  updateNotificationTemplateSchema,
  previewTemplateSchema,
  updateIntegrationSettingSchema,
  updateFeatureFlagSchema,
} from './system-config.types';
import { IntegrationProvider } from '@prisma/client';

const systemConfigService = new SystemConfigService();

export class SystemConfigController {
  // 1. ATS Weights
  async getAtsWeights(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await systemConfigService.getAtsWeights();
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  async updateAtsWeights(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = updateAtsWeightsSchema.parse(req.body);
      const result = await systemConfigService.updateAtsWeights(validated, req.user!.id);
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  // 2. Skills Taxonomy
  async listSkills(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, category } = req.query;
      const result = await systemConfigService.listSkills(
        typeof search === 'string' ? search : undefined,
        typeof category === 'string' ? category : undefined
      );
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  async createSkill(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createSkillSchema.parse(req.body);
      const result = await systemConfigService.createSkill(validated, req.user!.id);
      return res.status(201).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  async updateSkill(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = updateSkillSchema.parse(req.body);
      const result = await systemConfigService.updateSkill(req.params.id, validated, req.user!.id);
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  async deleteSkill(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await systemConfigService.deleteSkill(req.params.id, req.user!.id);
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  // 3. Industries
  async listIndustries(req: Request, res: Response, next: NextFunction) {
    try {
      const { search } = req.query;
      const result = await systemConfigService.listIndustries(typeof search === 'string' ? search : undefined);
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  async createIndustry(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createIndustrySchema.parse(req.body);
      const result = await systemConfigService.createIndustry(validated, req.user!.id);
      return res.status(201).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  async updateIndustry(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = updateIndustrySchema.parse(req.body);
      const result = await systemConfigService.updateIndustry(req.params.id, validated, req.user!.id);
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  async deleteIndustry(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await systemConfigService.deleteIndustry(req.params.id, req.user!.id);
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  // 4. Locations
  async listLocations(req: Request, res: Response, next: NextFunction) {
    try {
      const { search } = req.query;
      const result = await systemConfigService.listLocations(typeof search === 'string' ? search : undefined);
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  async createLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createLocationSchema.parse(req.body);
      const result = await systemConfigService.createLocation(validated, req.user!.id);
      return res.status(201).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  async updateLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = updateLocationSchema.parse(req.body);
      const result = await systemConfigService.updateLocation(req.params.id, validated, req.user!.id);
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  async deleteLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await systemConfigService.deleteLocation(req.params.id, req.user!.id);
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  // 5. Notification Templates
  async listNotificationTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await systemConfigService.listNotificationTemplates();
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  async getNotificationTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await systemConfigService.getNotificationTemplate(req.params.id);
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  async createNotificationTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createNotificationTemplateSchema.parse(req.body);
      const result = await systemConfigService.createNotificationTemplate(validated, req.user!.id);
      return res.status(201).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  async updateNotificationTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = updateNotificationTemplateSchema.parse(req.body);
      const result = await systemConfigService.updateNotificationTemplate(req.params.id, validated, req.user!.id);
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  async previewTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = previewTemplateSchema.parse(req.body);
      const result = await systemConfigService.previewTemplate(req.params.id, validated.sampleData);
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  // 6. Integrations
  async listIntegrations(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await systemConfigService.listIntegrations();
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  async updateIntegration(req: Request, res: Response, next: NextFunction) {
    try {
      const provider = req.params.provider as IntegrationProvider;
      const validated = updateIntegrationSettingSchema.parse(req.body);
      const result = await systemConfigService.updateIntegration(
        provider,
        validated.config,
        req.user!.id,
        validated.status
      );
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  async testIntegration(req: Request, res: Response, next: NextFunction) {
    try {
      const provider = req.params.provider as IntegrationProvider;
      const result = await systemConfigService.testIntegration(provider, req.user!.id);
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  // 7. Feature Flags
  async listFeatureFlags(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await systemConfigService.listFeatureFlags();
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  async updateFeatureFlag(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = updateFeatureFlagSchema.parse(req.body);
      const result = await systemConfigService.updateFeatureFlag(req.params.key, validated, req.user!.id);
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }
}
