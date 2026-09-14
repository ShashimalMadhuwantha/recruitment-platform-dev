import { PrismaClient, JobStatus, Prisma } from '@prisma/client';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from '../../middleware/error.middleware';
import type {
  CreateJobVacancyDto,
  UpdateJobVacancyDto,
} from '@recruitment-platform/shared';

const prisma = new PrismaClient();

export class JobVacancyService {
  /**
   * Resolve recruiter's company ID
   */
  private async resolveRecruiterCompany(userId: string, userRole: string): Promise<string> {
    if (userRole === 'SUPER_ADMIN') {
      const firstCompany = await prisma.company.findFirst();
      if (!firstCompany) {
        throw new BadRequestError('No companies exist on the platform.');
      }
      return firstCompany.id;
    }

    const recruiterProfile = await prisma.recruiterProfile.findUnique({
      where: { userId },
      include: { company: true },
    });

    if (!recruiterProfile || !recruiterProfile.companyId) {
      throw new ForbiddenError('You are not associated with an employer company.');
    }

    if (recruiterProfile.company.status !== 'ACTIVE') {
      throw new ForbiddenError('Your company account is not currently active.');
    }

    return recruiterProfile.companyId;
  }

  /**
   * Verify if company has quota to publish an active vacancy
   */
  private async checkCompanyJobQuota(companyId: string, excludingJobId?: string): Promise<void> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { plan: true },
    });

    if (!company) {
      throw new NotFoundError('Company not found.');
    }

    const planMaxJobs = company.plan?.maxJobPosts ?? 3;

    const currentPublishedCount = await prisma.jobVacancy.count({
      where: {
        companyId,
        status: JobStatus.PUBLISHED,
        ...(excludingJobId ? { id: { not: excludingJobId } } : {}),
      },
    });

    if (currentPublishedCount >= planMaxJobs) {
      throw new BadRequestError(
        `Job posting limit reached (${currentPublishedCount}/${planMaxJobs}). Upgrade to a higher subscription tier to publish more vacancies.`
      );
    }
  }

  /**
   * Check title, description, and requirementsSummary against banned/discriminatory keywords dictionary
   */
  async checkCompliance(
    title?: string | null,
    description?: string | null,
    requirementsSummary?: string | null
  ) {
    const combinedText = `${title || ''} ${description || ''} ${requirementsSummary || ''}`.toLowerCase();
    const bannedKeywords = await prisma.bannedKeyword.findMany({
      where: { isActive: true },
    });

    const violations: Array<{
      keyword: string;
      category: string;
      severity: 'BLOCK' | 'WARN';
      reason: string;
    }> = [];

    for (const item of bannedKeywords) {
      const keywordLower = item.keyword.toLowerCase().trim();
      if (!keywordLower) continue;

      const escapedKeyword = keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'i');
      if (regex.test(combinedText) || combinedText.includes(keywordLower)) {
        violations.push({
          keyword: item.keyword,
          category: item.category,
          severity: item.severity as 'BLOCK' | 'WARN',
          reason:
            item.category === 'DISCRIMINATION'
              ? 'Potential discriminatory language violating equal employment opportunity standards.'
              : 'Prohibited keyword flagged for spam or misleading content.',
        });
      }
    }

    const hasBlock = violations.some((v) => v.severity === 'BLOCK');

    return {
      hasViolations: violations.length > 0,
      canPublish: !hasBlock,
      violations,
    };
  }

  /**
   * List jobs for the recruiter's company with search, status filters and applicant metrics
   */
  async listCompanyJobs(
    userId: string,
    userRole: string,
    options: {
      search?: string;
      status?: JobStatus;
      page?: number;
      limit?: number;
    }
  ) {
    const companyId = await this.resolveRecruiterCompany(userId, userRole);
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 10;
    const skip = (page - 1) * limit;

    const where: Prisma.JobVacancyWhereInput = {
      companyId,
      ...(options.status ? { status: options.status } : {}),
      ...(options.search
        ? {
            OR: [
              { title: { contains: options.search } },
              { location: { contains: options.search } },
            ],
          }
        : {}),
    };

    const [total, vacancies] = await Promise.all([
      prisma.jobVacancy.count({ where }),
      prisma.jobVacancy.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          applications: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      }),
    ]);

    const items = vacancies.map((v) => {
      const stagesCount: Record<string, number> = {};
      v.applications.forEach((app) => {
        stagesCount[app.status] = (stagesCount[app.status] || 0) + 1;
      });

      return {
        id: v.id,
        companyId: v.companyId,
        title: v.title,
        location: v.location,
        employmentType: v.employmentType,
        status: v.status,
        deadline: v.deadline ? v.deadline.toISOString() : null,
        createdAt: v.createdAt.toISOString(),
        updatedAt: v.updatedAt.toISOString(),
        applicationsCount: v.applications.length,
        stagesCount,
      };
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get complete details of a job vacancy
   */
  async getJobDetails(id: string, userId: string, userRole: string) {
    const companyId = await this.resolveRecruiterCompany(userId, userRole);

    const vacancy = await prisma.jobVacancy.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            industry: true,
          },
        },
        jobRequirement: true,
        jobRequiredSkills: {
          include: {
            skill: true,
          },
        },
        scoreWeightConfigs: {
          where: { isDefault: false },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    if (!vacancy) {
      throw new NotFoundError('Job vacancy not found.');
    }

    if (userRole !== 'SUPER_ADMIN' && vacancy.companyId !== companyId) {
      throw new ForbiddenError('You do not have access to this job vacancy.');
    }

    return vacancy;
  }

  /**
   * Create a new job vacancy (DRAFT or PUBLISHED)
   */
  async createJobVacancy(data: CreateJobVacancyDto, userId: string, userRole: string) {
    const companyId = await this.resolveRecruiterCompany(userId, userRole);

    // 1. Compliance Scan
    const compliance = await this.checkCompliance(
      data.title,
      data.description,
      data.requirementsSummary
    );
    if (!compliance.canPublish && data.status === JobStatus.PUBLISHED) {
      throw new BadRequestError(
        'Job vacancy contains prohibited discriminatory keywords. Please revise before publishing.'
      );
    }

    // 2. Subscription quota check if publishing
    if (data.status === JobStatus.PUBLISHED) {
      await this.checkCompanyJobQuota(companyId);
    }

    // 3. Create JobVacancy with requirements and skills transaction
    const result = await prisma.$transaction(async (tx) => {
      const vacancy = await tx.jobVacancy.create({
        data: {
          companyId,
          createdById: userId,
          title: data.title,
          description: data.description,
          requirementsSummary: data.requirementsSummary || null,
          location: data.location || null,
          employmentType: data.employmentType || 'FULL_TIME',
          salaryMin: data.salaryMin ? new Prisma.Decimal(data.salaryMin) : null,
          salaryMax: data.salaryMax ? new Prisma.Decimal(data.salaryMax) : null,
          deadline: data.deadline ? new Date(data.deadline) : null,
          status: data.status || JobStatus.DRAFT,
          screeningQuestionsJson: data.screeningQuestions
            ? (data.screeningQuestions as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        },
      });

      // Requirements
      if (data.requirements) {
        await tx.jobRequirement.create({
          data: {
            jobId: vacancy.id,
            minExperienceYears: data.requirements.minExperienceYears != null
              ? new Prisma.Decimal(data.requirements.minExperienceYears)
              : null,
            maxExperienceYears: data.requirements.maxExperienceYears != null
              ? new Prisma.Decimal(data.requirements.maxExperienceYears)
              : null,
            educationLevel: data.requirements.educationLevel || null,
            requiredCertifications: data.requirements.requiredCertifications
              ? (data.requirements.requiredCertifications as unknown as Prisma.InputJsonValue)
              : Prisma.JsonNull,
          },
        });
      }

      // Required Skills
      if (data.requiredSkills && data.requiredSkills.length > 0) {
        for (const skillItem of data.requiredSkills) {
          await tx.jobRequiredSkill.create({
            data: {
              jobId: vacancy.id,
              skillId: skillItem.skillId,
              priority: skillItem.priority || 'MUST_HAVE',
              weight: skillItem.weight != null ? new Prisma.Decimal(skillItem.weight) : new Prisma.Decimal(1.0),
              minProficiency: skillItem.minProficiency || 3,
            },
          });
        }
      }

      // ATS Weight Overrides
      if (data.atsWeightOverrides) {
        await tx.scoreWeightConfig.create({
          data: {
            jobId: vacancy.id,
            companyId,
            skillsWeight: new Prisma.Decimal(data.atsWeightOverrides.skillsWeight),
            experienceWeight: new Prisma.Decimal(data.atsWeightOverrides.experienceWeight),
            educationWeight: new Prisma.Decimal(data.atsWeightOverrides.educationWeight),
            semanticWeight: new Prisma.Decimal(data.atsWeightOverrides.semanticWeight),
            certificationWeight: new Prisma.Decimal(data.atsWeightOverrides.certificationWeight),
            isDefault: false,
          },
        });
      }

      // Seed standard pipeline stages for this job
      const standardStages = [
        { name: 'Applied', stageOrder: 1, isSystemStage: true },
        { name: 'Screening', stageOrder: 2, isSystemStage: true },
        { name: 'Shortlisted', stageOrder: 3, isSystemStage: true },
        { name: 'Interview', stageOrder: 4, isSystemStage: true },
        { name: 'Offer', stageOrder: 5, isSystemStage: true },
        { name: 'Hired', stageOrder: 6, isSystemStage: true },
        { name: 'Rejected', stageOrder: 7, isSystemStage: true },
      ];

      for (const stage of standardStages) {
        await tx.pipelineStage.create({
          data: {
            jobId: vacancy.id,
            name: stage.name,
            stageOrder: stage.stageOrder,
            isSystemStage: stage.isSystemStage,
          },
        });
      }

      return vacancy;
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'CREATE_JOB_VACANCY',
        targetType: 'JOB_VACANCY',
        targetId: result.id,
        detailsJson: { title: result.title, status: result.status },
      },
    });

    return this.getJobDetails(result.id, userId, userRole);
  }

  /**
   * Update an existing job vacancy
   */
  async updateJobVacancy(id: string, data: UpdateJobVacancyDto, userId: string, userRole: string) {
    const existing = await this.getJobDetails(id, userId, userRole);

    // If the post is or will be PUBLISHED, enforce compliance scan across title, description, and requirementsSummary
    const targetStatus = data.status || existing.status;
    if (targetStatus === JobStatus.PUBLISHED) {
      const titleToCheck = data.title !== undefined ? data.title : existing.title;
      const descToCheck = data.description !== undefined ? data.description : existing.description;
      const reqSummaryToCheck =
        data.requirementsSummary !== undefined ? data.requirementsSummary : existing.requirementsSummary;
      const compliance = await this.checkCompliance(titleToCheck, descToCheck, reqSummaryToCheck);
      if (!compliance.canPublish) {
        throw new BadRequestError(
          'Job vacancy contains prohibited discriminatory keywords. Please revise before publishing.'
        );
      }
    }

    if (data.status === JobStatus.PUBLISHED && existing.status !== JobStatus.PUBLISHED) {
      await this.checkCompanyJobQuota(existing.companyId, id);
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update basic fields
      await tx.jobVacancy.update({
        where: { id },
        data: {
          ...(data.title ? { title: data.title } : {}),
          ...(data.description ? { description: data.description } : {}),
          ...(data.requirementsSummary !== undefined ? { requirementsSummary: data.requirementsSummary } : {}),
          ...(data.location !== undefined ? { location: data.location } : {}),
          ...(data.employmentType ? { employmentType: data.employmentType } : {}),
          ...(data.salaryMin !== undefined
            ? { salaryMin: data.salaryMin ? new Prisma.Decimal(data.salaryMin) : null }
            : {}),
          ...(data.salaryMax !== undefined
            ? { salaryMax: data.salaryMax ? new Prisma.Decimal(data.salaryMax) : null }
            : {}),
          ...(data.deadline !== undefined
            ? { deadline: data.deadline ? new Date(data.deadline) : null }
            : {}),
          ...(data.status ? { status: data.status } : {}),
          ...(data.screeningQuestions !== undefined
            ? {
                screeningQuestionsJson: data.screeningQuestions
                  ? (data.screeningQuestions as unknown as Prisma.InputJsonValue)
                  : Prisma.JsonNull,
              }
            : {}),
        },
      });

      // 2. Update Requirements
      if (data.requirements !== undefined) {
        if (data.requirements) {
          await tx.jobRequirement.upsert({
            where: { jobId: id },
            create: {
              jobId: id,
              minExperienceYears: data.requirements.minExperienceYears != null
                ? new Prisma.Decimal(data.requirements.minExperienceYears)
                : null,
              maxExperienceYears: data.requirements.maxExperienceYears != null
                ? new Prisma.Decimal(data.requirements.maxExperienceYears)
                : null,
              educationLevel: data.requirements.educationLevel || null,
              requiredCertifications: data.requirements.requiredCertifications
                ? (data.requirements.requiredCertifications as unknown as Prisma.InputJsonValue)
                : Prisma.JsonNull,
            },
            update: {
              minExperienceYears: data.requirements.minExperienceYears != null
                ? new Prisma.Decimal(data.requirements.minExperienceYears)
                : null,
              maxExperienceYears: data.requirements.maxExperienceYears != null
                ? new Prisma.Decimal(data.requirements.maxExperienceYears)
                : null,
              educationLevel: data.requirements.educationLevel || null,
              requiredCertifications: data.requirements.requiredCertifications
                ? (data.requirements.requiredCertifications as unknown as Prisma.InputJsonValue)
                : Prisma.JsonNull,
            },
          });
        }
      }

      // 3. Update Required Skills if provided
      if (data.requiredSkills !== undefined) {
        await tx.jobRequiredSkill.deleteMany({ where: { jobId: id } });
        if (data.requiredSkills && data.requiredSkills.length > 0) {
          for (const skillItem of data.requiredSkills) {
            await tx.jobRequiredSkill.create({
              data: {
                jobId: id,
                skillId: skillItem.skillId,
                priority: skillItem.priority || 'MUST_HAVE',
                weight: skillItem.weight != null ? new Prisma.Decimal(skillItem.weight) : new Prisma.Decimal(1.0),
                minProficiency: skillItem.minProficiency || 3,
              },
            });
          }
        }
      }

      // 4. Update ATS Weight Overrides
      if (data.atsWeightOverrides !== undefined) {
        await tx.scoreWeightConfig.deleteMany({ where: { jobId: id } });
        if (data.atsWeightOverrides) {
          await tx.scoreWeightConfig.create({
            data: {
              jobId: id,
              companyId: existing.companyId,
              skillsWeight: new Prisma.Decimal(data.atsWeightOverrides.skillsWeight),
              experienceWeight: new Prisma.Decimal(data.atsWeightOverrides.experienceWeight),
              educationWeight: new Prisma.Decimal(data.atsWeightOverrides.educationWeight),
              semanticWeight: new Prisma.Decimal(data.atsWeightOverrides.semanticWeight),
              certificationWeight: new Prisma.Decimal(data.atsWeightOverrides.certificationWeight),
              isDefault: false,
            },
          });
        }
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'UPDATE_JOB_VACANCY',
        targetType: 'JOB_VACANCY',
        targetId: id,
        detailsJson: { title: data.title, status: data.status },
      },
    });

    return this.getJobDetails(id, userId, userRole);
  }

  /**
   * Quick status transition (DRAFT, PUBLISHED, PAUSED, CLOSED)
   */
  async updateJobStatus(id: string, newStatus: JobStatus, userId: string, userRole: string) {
    const existing = await this.getJobDetails(id, userId, userRole);

    if (newStatus === JobStatus.PUBLISHED && existing.status !== JobStatus.PUBLISHED) {
      const compliance = await this.checkCompliance(
        existing.title,
        existing.description,
        existing.requirementsSummary
      );
      if (!compliance.canPublish) {
        throw new BadRequestError(
          'Job vacancy contains prohibited discriminatory keywords. Please revise before publishing.'
        );
      }
      await this.checkCompanyJobQuota(existing.companyId, id);
    }

    const updated = await prisma.jobVacancy.update({
      where: { id },
      data: { status: newStatus },
    });

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'UPDATE_JOB_STATUS',
        targetType: 'JOB_VACANCY',
        targetId: id,
        detailsJson: { previousStatus: existing.status, newStatus },
      },
    });

    return updated;
  }

  /**
   * Clone/duplicate a job vacancy as a new DRAFT
   */
  async cloneJobVacancy(id: string, userId: string, userRole: string) {
    const existing = await this.getJobDetails(id, userId, userRole);

    const clonedDto: CreateJobVacancyDto = {
      title: `Copy of ${existing.title}`,
      description: existing.description,
      requirementsSummary: existing.requirementsSummary,
      location: existing.location,
      employmentType: existing.employmentType,
      salaryMin: existing.salaryMin ? Number(existing.salaryMin) : null,
      salaryMax: existing.salaryMax ? Number(existing.salaryMax) : null,
      deadline: null,
      status: JobStatus.DRAFT,
      requirements: existing.jobRequirement
        ? {
            minExperienceYears: existing.jobRequirement.minExperienceYears
              ? Number(existing.jobRequirement.minExperienceYears)
              : null,
            maxExperienceYears: existing.jobRequirement.maxExperienceYears
              ? Number(existing.jobRequirement.maxExperienceYears)
              : null,
            educationLevel: existing.jobRequirement.educationLevel,
            requiredCertifications: Array.isArray(existing.jobRequirement.requiredCertifications)
              ? (existing.jobRequirement.requiredCertifications as string[])
              : null,
          }
        : undefined,
      requiredSkills: existing.jobRequiredSkills?.map((s) => ({
        skillId: s.skillId,
        priority: s.priority,
        weight: Number(s.weight),
        minProficiency: s.minProficiency,
      })),
      screeningQuestions: existing.screeningQuestionsJson as any,
      atsWeightOverrides: existing.scoreWeightConfigs?.[0]
        ? {
            skillsWeight: Number(existing.scoreWeightConfigs[0].skillsWeight),
            experienceWeight: Number(existing.scoreWeightConfigs[0].experienceWeight),
            educationWeight: Number(existing.scoreWeightConfigs[0].educationWeight),
            semanticWeight: Number(existing.scoreWeightConfigs[0].semanticWeight),
            certificationWeight: Number(existing.scoreWeightConfigs[0].certificationWeight),
          }
        : null,
    };

    return this.createJobVacancy(clonedDto, userId, userRole);
  }

  /**
   * Delete or archive a job vacancy
   */
  async deleteJobVacancy(id: string, userId: string, userRole: string) {
    const existing = await this.getJobDetails(id, userId, userRole);

    if (existing._count?.applications && existing._count.applications > 0) {
      // Soft close rather than hard delete if candidates have applied
      await prisma.jobVacancy.update({
        where: { id },
        data: { status: JobStatus.CLOSED },
      });
      return { success: true, message: 'Vacancy contains active applications and was moved to CLOSED.' };
    }

    await prisma.jobVacancy.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'DELETE_JOB_VACANCY',
        targetType: 'JOB_VACANCY',
        targetId: id,
        detailsJson: { title: existing.title },
      },
    });

    return { success: true, message: 'Job vacancy deleted successfully.' };
  }
}
