import { PrismaClient, IntegrationProvider, IntegrationStatus, PlanTier, Prisma } from '@prisma/client';
import { BadRequestError, NotFoundError, ConflictError } from '../../middleware/error.middleware';

const prisma = new PrismaClient();

export interface AtsWeightsInput {
  skillsWeight: number;
  experienceWeight: number;
  educationWeight: number;
  semanticWeight: number;
  certificationWeight: number;
}

export const ATS_WEIGHT_PRESETS = [
  {
    id: 'default-balanced',
    name: 'Standard Balanced',
    description: 'Balanced platform default focusing strongly on core skills and relevant work experience.',
    weights: {
      skillsWeight: 0.40,
      experienceWeight: 0.25,
      educationWeight: 0.15,
      semanticWeight: 0.15,
      certificationWeight: 0.05,
    },
  },
  {
    id: 'engineering-tech',
    name: 'Engineering & Technical Roles',
    description: 'Heavily prioritizes verified technical skills, coding proficiency, and semantic resume match.',
    weights: {
      skillsWeight: 0.50,
      experienceWeight: 0.20,
      educationWeight: 0.10,
      semanticWeight: 0.15,
      certificationWeight: 0.05,
    },
  },
  {
    id: 'executive-leadership',
    name: 'Executive & Senior Leadership',
    description: 'Emphasizes proven career tenure, leadership history, and advanced credentials.',
    weights: {
      skillsWeight: 0.20,
      experienceWeight: 0.45,
      educationWeight: 0.20,
      semanticWeight: 0.10,
      certificationWeight: 0.05,
    },
  },
  {
    id: 'entry-level-graduate',
    name: 'Entry-Level & Graduate Hiring',
    description: 'Prioritizes academic degrees, foundational coursework, and practical skill sets over work tenure.',
    weights: {
      skillsWeight: 0.35,
      experienceWeight: 0.10,
      educationWeight: 0.35,
      semanticWeight: 0.15,
      certificationWeight: 0.05,
    },
  },
];

export class SystemConfigService {
  // ==========================================
  // 1. Global ATS Weight Configuration
  // ==========================================
  async getAtsWeights() {
    let config = await prisma.scoreWeightConfig.findFirst({
      where: { isDefault: true },
    });

    if (!config) {
      config = await prisma.scoreWeightConfig.create({
        data: {
          isDefault: true,
          skillsWeight: new Prisma.Decimal(0.40),
          experienceWeight: new Prisma.Decimal(0.25),
          educationWeight: new Prisma.Decimal(0.15),
          semanticWeight: new Prisma.Decimal(0.15),
          certificationWeight: new Prisma.Decimal(0.05),
        },
      });
    }

    return {
      current: {
        id: config.id,
        skillsWeight: Number(config.skillsWeight),
        experienceWeight: Number(config.experienceWeight),
        educationWeight: Number(config.educationWeight),
        semanticWeight: Number(config.semanticWeight),
        certificationWeight: Number(config.certificationWeight),
        isDefault: config.isDefault,
        createdAt: config.createdAt,
      },
      presets: ATS_WEIGHT_PRESETS,
    };
  }

  async updateAtsWeights(data: AtsWeightsInput, adminId: string) {
    const sum =
      data.skillsWeight +
      data.experienceWeight +
      data.educationWeight +
      data.semanticWeight +
      data.certificationWeight;

    if (Math.abs(sum - 1.0) >= 0.001) {
      throw new BadRequestError('ATS weights must sum to exactly 1.0 (100%)');
    }

    let existing = await prisma.scoreWeightConfig.findFirst({
      where: { isDefault: true },
    });

    let updated;
    if (existing) {
      updated = await prisma.scoreWeightConfig.update({
        where: { id: existing.id },
        data: {
          skillsWeight: new Prisma.Decimal(data.skillsWeight),
          experienceWeight: new Prisma.Decimal(data.experienceWeight),
          educationWeight: new Prisma.Decimal(data.educationWeight),
          semanticWeight: new Prisma.Decimal(data.semanticWeight),
          certificationWeight: new Prisma.Decimal(data.certificationWeight),
        },
      });
    } else {
      updated = await prisma.scoreWeightConfig.create({
        data: {
          isDefault: true,
          skillsWeight: new Prisma.Decimal(data.skillsWeight),
          experienceWeight: new Prisma.Decimal(data.experienceWeight),
          educationWeight: new Prisma.Decimal(data.educationWeight),
          semanticWeight: new Prisma.Decimal(data.semanticWeight),
          certificationWeight: new Prisma.Decimal(data.certificationWeight),
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'UPDATE_ATS_WEIGHT_CONFIG',
        targetType: 'SYSTEM_CONFIG',
        targetId: updated.id,
        detailsJson: {
          skillsWeight: data.skillsWeight,
          experienceWeight: data.experienceWeight,
          educationWeight: data.educationWeight,
          semanticWeight: data.semanticWeight,
          certificationWeight: data.certificationWeight,
        },
      },
    });

    return {
      id: updated.id,
      skillsWeight: Number(updated.skillsWeight),
      experienceWeight: Number(updated.experienceWeight),
      educationWeight: Number(updated.educationWeight),
      semanticWeight: Number(updated.semanticWeight),
      certificationWeight: Number(updated.certificationWeight),
      isDefault: updated.isDefault,
    };
  }

  // ==========================================
  // 2. Master Taxonomy - Skills
  // ==========================================
  async listSkills(search?: string, category?: string) {
    const where: Prisma.SkillWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { category: { contains: search } },
      ];
    }
    if (category && category !== 'ALL') {
      where.category = category;
    }

    const skills = await prisma.skill.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            applicantSkills: true,
            jobRequiredSkills: true,
          },
        },
      },
    });

    return skills;
  }

  async createSkill(data: { name: string; category?: string | null; aliases?: string[] }, adminId: string) {
    const existing = await prisma.skill.findUnique({
      where: { name: data.name },
    });
    if (existing) {
      throw new ConflictError(`Skill with name '${data.name}' already exists`);
    }

    const skill = await prisma.skill.create({
      data: {
        name: data.name,
        category: data.category || null,
        aliasesJson: data.aliases || [],
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'CREATE_SKILL',
        targetType: 'SKILL',
        targetId: skill.id,
        detailsJson: { name: skill.name, category: skill.category, aliases: data.aliases },
      },
    });

    return skill;
  }

  async updateSkill(id: string, data: { name?: string; category?: string | null; aliases?: string[] }, adminId: string) {
    const skill = await prisma.skill.findUnique({ where: { id } });
    if (!skill) {
      throw new NotFoundError('Skill not found');
    }

    const updated = await prisma.skill.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.aliases ? { aliasesJson: data.aliases } : {}),
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'UPDATE_SKILL',
        targetType: 'SKILL',
        targetId: updated.id,
        detailsJson: data,
      },
    });

    return updated;
  }

  async deleteSkill(id: string, adminId: string) {
    const skill = await prisma.skill.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            applicantSkills: true,
            jobRequiredSkills: true,
          },
        },
      },
    });
    if (!skill) {
      throw new NotFoundError('Skill not found');
    }

    if (skill._count.applicantSkills > 0 || skill._count.jobRequiredSkills > 0) {
      throw new BadRequestError(
        `Cannot delete skill '${skill.name}' because it is linked to ${skill._count.applicantSkills} candidate profiles and ${skill._count.jobRequiredSkills} job postings.`
      );
    }

    await prisma.skill.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'DELETE_SKILL',
        targetType: 'SKILL',
        targetId: id,
        detailsJson: { name: skill.name },
      },
    });

    return { success: true, message: `Skill '${skill.name}' deleted successfully.` };
  }

  // ==========================================
  // 3. Master Taxonomy - Industries
  // ==========================================
  async listIndustries(search?: string) {
    const where: Prisma.IndustryWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { category: { contains: search } },
      ];
    }

    return prisma.industry.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async createIndustry(data: { name: string; category?: string | null; isActive?: boolean }, adminId: string) {
    const existing = await prisma.industry.findUnique({ where: { name: data.name } });
    if (existing) {
      throw new ConflictError(`Industry '${data.name}' already exists`);
    }

    const industry = await prisma.industry.create({
      data: {
        name: data.name,
        category: data.category || null,
        isActive: data.isActive ?? true,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'CREATE_INDUSTRY',
        targetType: 'INDUSTRY',
        targetId: industry.id,
        detailsJson: data,
      },
    });

    return industry;
  }

  async updateIndustry(id: string, data: { name?: string; category?: string | null; isActive?: boolean }, adminId: string) {
    const existing = await prisma.industry.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Industry not found');
    }

    const updated = await prisma.industry.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'UPDATE_INDUSTRY',
        targetType: 'INDUSTRY',
        targetId: id,
        detailsJson: data,
      },
    });

    return updated;
  }

  async deleteIndustry(id: string, adminId: string) {
    const existing = await prisma.industry.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Industry not found');
    }

    await prisma.industry.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'DELETE_INDUSTRY',
        targetType: 'INDUSTRY',
        targetId: id,
        detailsJson: { name: existing.name },
      },
    });

    return { success: true, message: `Industry '${existing.name}' deleted successfully.` };
  }

  // ==========================================
  // 4. Master Taxonomy - Locations
  // ==========================================
  async listLocations(search?: string) {
    const where: Prisma.LocationWhereInput = {};
    if (search) {
      where.OR = [
        { city: { contains: search } },
        { state: { contains: search } },
        { country: { contains: search } },
      ];
    }

    return prisma.location.findMany({
      where,
      orderBy: [{ country: 'asc' }, { city: 'asc' }],
    });
  }

  async createLocation(data: { city: string; state?: string | null; country: string; isRemoteAllowed?: boolean; isActive?: boolean }, adminId: string) {
    const existing = await prisma.location.findFirst({
      where: {
        city: data.city,
        state: data.state || null,
        country: data.country,
      },
    });
    if (existing) {
      throw new ConflictError(`Location '${data.city}, ${data.country}' already exists`);
    }

    const location = await prisma.location.create({
      data: {
        city: data.city,
        state: data.state || null,
        country: data.country,
        isRemoteAllowed: data.isRemoteAllowed ?? true,
        isActive: data.isActive ?? true,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'CREATE_LOCATION',
        targetType: 'LOCATION',
        targetId: location.id,
        detailsJson: data,
      },
    });

    return location;
  }

  async updateLocation(id: string, data: { city?: string; state?: string | null; country?: string; isRemoteAllowed?: boolean; isActive?: boolean }, adminId: string) {
    const existing = await prisma.location.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Location not found');
    }

    const updated = await prisma.location.update({
      where: { id },
      data: {
        ...(data.city ? { city: data.city } : {}),
        ...(data.state !== undefined ? { state: data.state } : {}),
        ...(data.country ? { country: data.country } : {}),
        ...(data.isRemoteAllowed !== undefined ? { isRemoteAllowed: data.isRemoteAllowed } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'UPDATE_LOCATION',
        targetType: 'LOCATION',
        targetId: id,
        detailsJson: data,
      },
    });

    return updated;
  }

  async deleteLocation(id: string, adminId: string) {
    const existing = await prisma.location.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Location not found');
    }

    await prisma.location.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'DELETE_LOCATION',
        targetType: 'LOCATION',
        targetId: id,
        detailsJson: { city: existing.city, country: existing.country },
      },
    });

    return { success: true, message: `Location '${existing.city}' deleted.` };
  }

  // ==========================================
  // 5. Automated Notification Templates
  // ==========================================
  async listNotificationTemplates() {
    return prisma.notificationTemplate.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getNotificationTemplate(id: string) {
    const template = await prisma.notificationTemplate.findUnique({ where: { id } });
    if (!template) {
      throw new NotFoundError('Notification template not found');
    }
    return template;
  }

  async createNotificationTemplate(data: {
    name: string;
    code: string;
    channel?: 'EMAIL' | 'IN_APP' | 'SMS';
    subject: string;
    body: string;
    variables?: string[];
    isActive?: boolean;
  }, adminId: string) {
    const existing = await prisma.notificationTemplate.findUnique({ where: { code: data.code } });
    if (existing) {
      throw new ConflictError(`Template with code '${data.code}' already exists`);
    }

    const template = await prisma.notificationTemplate.create({
      data: {
        name: data.name,
        code: data.code,
        channel: data.channel || 'EMAIL',
        subject: data.subject,
        body: data.body,
        variablesJson: data.variables || [],
        isActive: data.isActive ?? true,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'CREATE_NOTIFICATION_TEMPLATE',
        targetType: 'NOTIFICATION_TEMPLATE',
        targetId: template.id,
        detailsJson: { code: template.code, name: template.name },
      },
    });

    return template;
  }

  async updateNotificationTemplate(id: string, data: {
    name?: string;
    subject?: string;
    body?: string;
    variables?: string[];
    isActive?: boolean;
  }, adminId: string) {
    const existing = await prisma.notificationTemplate.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Notification template not found');
    }

    const updated = await prisma.notificationTemplate.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.subject ? { subject: data.subject } : {}),
        ...(data.body ? { body: data.body } : {}),
        ...(data.variables ? { variablesJson: data.variables } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'UPDATE_NOTIFICATION_TEMPLATE',
        targetType: 'NOTIFICATION_TEMPLATE',
        targetId: id,
        detailsJson: data,
      },
    });

    return updated;
  }

  async previewTemplate(id: string, sampleData?: Record<string, string>) {
    const template = await prisma.notificationTemplate.findUnique({ where: { id } });
    if (!template) {
      throw new NotFoundError('Template not found');
    }

    const defaultSamples: Record<string, string> = {
      candidate_name: 'Alex Morgan',
      job_title: 'Senior Full Stack Engineer',
      company_name: 'Acme Technologies Inc.',
      portal_url: 'https://ats.acmetech.io',
      stage_name: 'Technical Interview',
      interview_time: 'Thursday, Sept 18 at 2:00 PM EST',
      interview_type: 'Video Call (Zoom)',
      meeting_link: 'https://zoom.us/j/987654321',
      recruiter_name: 'Sarah Jenkins',
      admin_name: 'John Doe',
      ...sampleData,
    };

    let renderedSubject = template.subject;
    let renderedBody = template.body;

    for (const [key, value] of Object.entries(defaultSamples)) {
      const tokenRegex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      renderedSubject = renderedSubject.replace(tokenRegex, value);
      renderedBody = renderedBody.replace(tokenRegex, value);
    }

    return {
      templateId: template.id,
      code: template.code,
      channel: template.channel,
      renderedSubject,
      renderedBody,
      sampleTokensUsed: defaultSamples,
    };
  }

  // ==========================================
  // 6. Third-Party Integration Settings
  // ==========================================
  async listIntegrations() {
    return prisma.systemIntegrationSetting.findMany({
      orderBy: { provider: 'asc' },
    });
  }

  async updateIntegration(provider: IntegrationProvider, config: Record<string, unknown>, adminId: string, status?: IntegrationStatus) {
    const existing = await prisma.systemIntegrationSetting.findUnique({
      where: { provider },
    });

    let updated;
    if (existing) {
      updated = await prisma.systemIntegrationSetting.update({
        where: { provider },
        data: {
          configJson: config as Prisma.InputJsonValue,
          status: status || existing.status,
          errorMessage: null,
        },
      });
    } else {
      updated = await prisma.systemIntegrationSetting.create({
        data: {
          provider,
          configJson: config as Prisma.InputJsonValue,
          status: status || IntegrationStatus.NOT_CONFIGURED,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'UPDATE_INTEGRATION_SETTINGS',
        targetType: 'INTEGRATION_SETTING',
        targetId: updated.id,
        detailsJson: { provider, status: updated.status },
      },
    });

    return updated;
  }

  async testIntegration(provider: IntegrationProvider, adminId: string) {
    const integration = await prisma.systemIntegrationSetting.findUnique({
      where: { provider },
    });

    if (!integration || !integration.configJson) {
      throw new BadRequestError(`Integration ${provider} is not configured yet.`);
    }

    const config = integration.configJson as Record<string, unknown>;
    let isSuccess = true;
    let statusMessage = 'Connection tested successfully.';
    let errorDetail: string | null = null;

    if (provider === IntegrationProvider.SMTP_EMAIL) {
      if (!config.host || !config.fromEmail) {
        isSuccess = false;
        errorDetail = 'Missing required SMTP parameters: host and fromEmail are mandatory.';
      }
    } else if (provider === IntegrationProvider.GOOGLE_OAUTH || provider === IntegrationProvider.LINKEDIN_OAUTH) {
      if (!config.clientId) {
        isSuccess = false;
        errorDetail = `Missing client ID for OAuth provider ${provider}.`;
      }
    } else if (provider === IntegrationProvider.ZOOM_CALENDAR) {
      if (!config.zoomApiKey) {
        isSuccess = false;
        errorDetail = 'Missing Zoom API credentials.';
      }
    }

    const newStatus = isSuccess ? IntegrationStatus.CONNECTED : IntegrationStatus.ERROR;

    const updated = await prisma.systemIntegrationSetting.update({
      where: { provider },
      data: {
        status: newStatus,
        lastTestedAt: new Date(),
        errorMessage: errorDetail,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'TEST_INTEGRATION_CONNECTION',
        targetType: 'INTEGRATION_SETTING',
        targetId: updated.id,
        detailsJson: { provider, success: isSuccess, error: errorDetail },
      },
    });

    return {
      provider,
      status: newStatus,
      success: isSuccess,
      message: isSuccess ? statusMessage : errorDetail,
      testedAt: updated.lastTestedAt,
    };
  }

  // ==========================================
  // 7. Feature Flags & Plan Tier Capability Matrix
  // ==========================================
  async listFeatureFlags() {
    return prisma.featureFlag.findMany({
      orderBy: { key: 'asc' },
    });
  }

  async updateFeatureFlag(
    key: string,
    data: {
      name?: string;
      description?: string | null;
      enabledTiers?: PlanTier[];
      isGloballyEnabled?: boolean;
    },
    adminId: string
  ) {
    const flag = await prisma.featureFlag.findUnique({ where: { key } });
    if (!flag) {
      throw new NotFoundError(`Feature flag with key '${key}' not found`);
    }

    const updated = await prisma.featureFlag.update({
      where: { key },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.enabledTiers ? { enabledTiersJson: data.enabledTiers } : {}),
        ...(data.isGloballyEnabled !== undefined ? { isGloballyEnabled: data.isGloballyEnabled } : {}),
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'UPDATE_FEATURE_FLAG',
        targetType: 'FEATURE_FLAG',
        targetId: updated.id,
        detailsJson: { key, ...data },
      },
    });

    return updated;
  }
}
