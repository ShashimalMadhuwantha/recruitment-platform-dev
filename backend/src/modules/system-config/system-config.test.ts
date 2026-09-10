import { describe, it, expect, beforeAll } from 'vitest';
import { SystemConfigService } from './system-config.service';
import { prisma } from '../../db/client';
import bcrypt from 'bcrypt';
import { IntegrationProvider, PlanTier } from '@prisma/client';

describe('SystemConfigService Unit & Integration Tests (Epic 4)', () => {
  let systemConfigService: SystemConfigService;
  let adminUserId: string;

  beforeAll(async () => {
    systemConfigService = new SystemConfigService();

    // Ensure test Super Admin user
    const passwordHash = await bcrypt.hash('AdminPassword123!', 10);
    const admin = await prisma.user.upsert({
      where: { email: 'config-admin-test@ats.local' },
      update: {},
      create: {
        email: 'config-admin-test@ats.local',
        passwordHash,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
      },
    });
    adminUserId = admin.id;
  });

  describe('1. Global ATS Weight Configuration', () => {
    it('should retrieve current ATS weights and presets', async () => {
      const result = await systemConfigService.getAtsWeights();
      expect(result.current).toBeDefined();
      expect(result.presets).toHaveLength(4);
      expect(result.presets.some((p) => p.id === 'engineering-tech')).toBe(true);
    });

    it('should update default weights when sum is exactly 1.0 (100%)', async () => {
      const newWeights = {
        skillsWeight: 0.45,
        experienceWeight: 0.25,
        educationWeight: 0.10,
        semanticWeight: 0.15,
        certificationWeight: 0.05,
      };

      const updated = await systemConfigService.updateAtsWeights(newWeights, adminUserId);
      expect(updated.skillsWeight).toBe(0.45);
      expect(updated.experienceWeight).toBe(0.25);
      expect(updated.educationWeight).toBe(0.10);

      // Verify audit log
      const audit = await prisma.auditLog.findFirst({
        where: { action: 'UPDATE_ATS_WEIGHT_CONFIG', targetType: 'SYSTEM_CONFIG' },
        orderBy: { createdAt: 'desc' },
      });
      expect(audit).toBeDefined();
      expect(audit?.actorId).toBe(adminUserId);
    });

    it('should throw error when weight sum does not equal 1.0', async () => {
      const invalidWeights = {
        skillsWeight: 0.50,
        experienceWeight: 0.50,
        educationWeight: 0.20,
        semanticWeight: 0.10,
        certificationWeight: 0.05,
      };

      await expect(
        systemConfigService.updateAtsWeights(invalidWeights, adminUserId)
      ).rejects.toThrow('ATS weights must sum to exactly 1.0 (100%)');
    });
  });

  describe('2. Master Taxonomy - Skills & Aliases', () => {
    let createdSkillId: string;
    const testSkillName = `Kubernetes-${Date.now()}`;

    it('should create a new skill with aliases', async () => {
      const skill = await systemConfigService.createSkill(
        {
          name: testSkillName,
          category: 'DevOps & Cloud',
          aliases: ['K8s', 'K8S Cluster'],
        },
        adminUserId
      );

      expect(skill.id).toBeDefined();
      expect(skill.name).toBe(testSkillName);
      expect(skill.aliasesJson).toEqual(['K8s', 'K8S Cluster']);
      createdSkillId = skill.id;
    });

    it('should reject duplicate skill name', async () => {
      await expect(
        systemConfigService.createSkill(
          {
            name: testSkillName,
            category: 'DevOps',
          },
          adminUserId
        )
      ).rejects.toThrow(`Skill with name '${testSkillName}' already exists`);
    });

    it('should list skills and support keyword search', async () => {
      const skills = await systemConfigService.listSkills(testSkillName);
      expect(skills.length).toBeGreaterThanOrEqual(1);
      expect(skills[0].name).toBe(testSkillName);
    });

    it('should update skill aliases and category', async () => {
      const updated = await systemConfigService.updateSkill(
        createdSkillId,
        {
          category: 'Cloud Infrastructure',
          aliases: ['K8s', 'K8S Cluster', 'Container Orchestration'],
        },
        adminUserId
      );

      expect(updated.category).toBe('Cloud Infrastructure');
      expect((updated.aliasesJson as string[]).length).toBe(3);
    });

    it('should delete an unused skill', async () => {
      const result = await systemConfigService.deleteSkill(createdSkillId, adminUserId);
      expect(result.success).toBe(true);
    });
  });

  describe('3. Master Taxonomy - Industries & Locations', () => {
    let testIndustryId: string;
    let testLocationId: string;
    const uniqueIndustryName = `Aerospace Engineering ${Date.now()}`;
    const uniqueCityName = `Austin-${Date.now()}`;

    it('should create, list, update, and delete an industry', async () => {
      const industry = await systemConfigService.createIndustry(
        { name: uniqueIndustryName, category: 'Aviation', isActive: true },
        adminUserId
      );
      expect(industry.name).toBe(uniqueIndustryName);
      testIndustryId = industry.id;

      const list = await systemConfigService.listIndustries(uniqueIndustryName);
      expect(list.length).toBe(1);

      const updated = await systemConfigService.updateIndustry(
        testIndustryId,
        { isActive: false },
        adminUserId
      );
      expect(updated.isActive).toBe(false);

      const deleted = await systemConfigService.deleteIndustry(testIndustryId, adminUserId);
      expect(deleted.success).toBe(true);
    });

    it('should create, list, and delete a location', async () => {
      const location = await systemConfigService.createLocation(
        {
          city: uniqueCityName,
          state: 'TX',
          country: 'United States',
          isRemoteAllowed: true,
        },
        adminUserId
      );
      expect(location.city).toBe(uniqueCityName);
      testLocationId = location.id;

      const list = await systemConfigService.listLocations(uniqueCityName);
      expect(list.length).toBe(1);

      const deleted = await systemConfigService.deleteLocation(testLocationId, adminUserId);
      expect(deleted.success).toBe(true);
    });
  });

  describe('4. Automated Notification Templates', () => {
    let testTemplateId: string;
    const testTemplateCode = `CUSTOM_STAGE_TEST_${Date.now()}`;

    it('should create notification template with variable tokens', async () => {
      const template = await systemConfigService.createNotificationTemplate(
        {
          name: 'Custom Assessment Invite',
          code: testTemplateCode,
          subject: 'Take assessment for {{job_title}} at {{company_name}}',
          body: 'Hello {{candidate_name}}, please finish test at {{portal_url}}.',
          variables: ['candidate_name', 'job_title', 'company_name', 'portal_url'],
          isActive: true,
        },
        adminUserId
      );

      expect(template.id).toBeDefined();
      expect(template.code).toBe(testTemplateCode);
      testTemplateId = template.id;
    });

    it('should render preview replacing variables with sample tokens', async () => {
      const preview = await systemConfigService.previewTemplate(testTemplateId, {
        candidate_name: 'Jane Doe',
        job_title: 'Principal Architect',
        company_name: 'TechFlow Systems',
      });

      expect(preview.renderedSubject).toContain('Take assessment for Principal Architect at TechFlow Systems');
      expect(preview.renderedBody).toContain('Hello Jane Doe');
    });
  });

  describe('5. Third-Party Integration Settings', () => {
    it('should update SMTP integration config', async () => {
      const updated = await systemConfigService.updateIntegration(
        IntegrationProvider.SMTP_EMAIL,
        {
          host: 'smtp.mailgun.org',
          port: 587,
          fromEmail: 'noreply@platform.io',
          fromName: 'Platform Recruiter',
        },
        adminUserId
      );

      expect(updated.provider).toBe('SMTP_EMAIL');
      expect((updated.configJson as Record<string, unknown>).host).toBe('smtp.mailgun.org');
    });

    it('should test SMTP connection and return success', async () => {
      const testResult = await systemConfigService.testIntegration(
        IntegrationProvider.SMTP_EMAIL,
        adminUserId
      );

      expect(testResult.success).toBe(true);
      expect(testResult.status).toBe('CONNECTED');
    });

    it('should fail test if required OAuth client id is missing', async () => {
      await systemConfigService.updateIntegration(
        IntegrationProvider.GOOGLE_OAUTH,
        {}, // missing clientId
        adminUserId
      );

      const testResult = await systemConfigService.testIntegration(
        IntegrationProvider.GOOGLE_OAUTH,
        adminUserId
      );

      expect(testResult.success).toBe(false);
      expect(testResult.status).toBe('ERROR');
    });
  });

  describe('6. Feature Flags & Plan Tier Capability Matrix', () => {
    it('should list feature flags', async () => {
      const flags = await systemConfigService.listFeatureFlags();
      expect(flags.length).toBeGreaterThanOrEqual(1);
    });

    it('should update feature flag allowed tiers and global toggle', async () => {
      const flag = await prisma.featureFlag.findFirst();
      expect(flag).toBeDefined();

      if (flag) {
        const updated = await systemConfigService.updateFeatureFlag(
          flag.key,
          {
            enabledTiers: [PlanTier.ENTERPRISE, PlanTier.PRO],
            isGloballyEnabled: true,
          },
          adminUserId
        );

        expect(updated.enabledTiersJson).toEqual(['ENTERPRISE', 'PRO']);
        expect(updated.isGloballyEnabled).toBe(true);
      }
    });
  });
});
