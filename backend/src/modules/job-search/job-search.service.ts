import { JobStatus, Prisma, EmploymentType } from '@prisma/client';
import {
  NotFoundError,
  BadRequestError,
} from '../../middleware/error.middleware';
import { prisma } from '../../db/client';
import type {
  JobSearchFilters,
  PublicJobListItem,
  PublicJobDetailDto,
  SavedJobDto,
  ScreeningQuestion,
} from '@recruitment-platform/shared';

export class JobSearchService {
  /**
   * Search published job vacancies with full-text keyword matching, filters & pagination
   */
  async searchPublishedJobs(
    filters: JobSearchFilters,
    userId?: string
  ): Promise<{
    items: PublicJobListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = filters.page && filters.page > 0 ? Number(filters.page) : 1;
    const limit = filters.limit && filters.limit > 0 ? Math.min(50, Number(filters.limit)) : 12;
    const skip = (page - 1) * limit;

    // Base filter: Only PUBLISHED jobs that have not expired
    const where: Prisma.JobVacancyWhereInput = {
      status: JobStatus.PUBLISHED,
      OR: [
        { deadline: null },
        { deadline: { gte: new Date() } },
      ],
    };

    const andConditions: Prisma.JobVacancyWhereInput[] = [];

    // Keyword search across title, description, requirements summary, and company name
    if (filters.keyword && filters.keyword.trim()) {
      const kw = filters.keyword.trim();
      andConditions.push({
        OR: [
          { title: { contains: kw } },
          { description: { contains: kw } },
          { requirementsSummary: { contains: kw } },
          { company: { name: { contains: kw } } },
        ],
      });
    }

    // Location search
    if (filters.location && filters.location.trim()) {
      andConditions.push({
        location: { contains: filters.location.trim() },
      });
    }

    // Employment type
    if (filters.employmentType) {
      andConditions.push({
        employmentType: filters.employmentType as EmploymentType,
      });
    }

    // Remote only filter
    if (filters.remoteOnly) {
      andConditions.push({
        OR: [
          { employmentType: EmploymentType.REMOTE },
          { location: { contains: 'Remote' } },
        ],
      });
    }

    // Salary filters
    if (filters.minSalary && !isNaN(Number(filters.minSalary))) {
      andConditions.push({
        OR: [
          { salaryMax: { gte: Number(filters.minSalary) } },
          { salaryMin: { gte: Number(filters.minSalary) } },
        ],
      });
    }

    if (filters.maxSalary && !isNaN(Number(filters.maxSalary))) {
      andConditions.push({
        salaryMin: { lte: Number(filters.maxSalary) },
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    // Resolve applicant profile if authenticated
    let applicantId: string | null = null;
    if (userId) {
      const applicant = await prisma.applicantProfile.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (applicant) {
        applicantId = applicant.id;
      }
    }

    const [total, vacancies] = await Promise.all([
      prisma.jobVacancy.count({ where }),
      prisma.jobVacancy.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
              industry: true,
            },
          },
          jobRequiredSkills: {
            include: {
              skill: true,
            },
            take: 6,
          },
          ...(applicantId
            ? {
                savedJobs: {
                  where: { applicantId },
                  select: { id: true },
                },
                applications: {
                  where: { applicantId },
                  select: { id: true, status: true },
                },
              }
            : {}),
        },
      }),
    ]);

    const items: PublicJobListItem[] = vacancies.map((v) => {
      const anyV = v as any;
      const isSaved = applicantId ? (anyV.savedJobs?.length > 0) : false;
      const hasApplied = applicantId ? (anyV.applications?.length > 0) : false;

      return {
        id: v.id,
        companyId: v.companyId,
        companyName: v.company.name,
        companyLogoUrl: v.company.logoUrl,
        companyIndustry: v.company.industry,
        title: v.title,
        location: v.location,
        employmentType: v.employmentType,
        salaryMin: v.salaryMin ? Number(v.salaryMin) : null,
        salaryMax: v.salaryMax ? Number(v.salaryMax) : null,
        deadline: v.deadline ? v.deadline.toISOString() : null,
        createdAt: v.createdAt.toISOString(),
        requiredSkills: v.jobRequiredSkills.map((jrs) => ({
          id: jrs.skill.id,
          name: jrs.skill.name,
          priority: jrs.priority,
          minProficiency: jrs.minProficiency,
        })),
        isSaved,
        hasApplied,
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
   * Get complete details of a published job vacancy
   */
  async getPublishedJobDetails(
    id: string,
    userId?: string
  ): Promise<PublicJobDetailDto> {
    let applicantId: string | null = null;
    if (userId) {
      const applicant = await prisma.applicantProfile.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (applicant) {
        applicantId = applicant.id;
      }
    }

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
        ...(applicantId
          ? {
              savedJobs: {
                where: { applicantId },
                select: { id: true },
              },
              applications: {
                where: { applicantId },
                select: { id: true, status: true },
              },
            }
          : {}),
      },
    });

    if (!vacancy) {
      throw new NotFoundError('Job vacancy not found.');
    }

    // Only allow public access to PUBLISHED jobs
    if (vacancy.status !== JobStatus.PUBLISHED) {
      throw new NotFoundError('Job vacancy is not currently published.');
    }

    const anyV = vacancy as any;
    const isSaved = applicantId ? (anyV.savedJobs?.length > 0) : false;
    const existingApp = applicantId && anyV.applications?.length > 0 ? anyV.applications[0] : null;

    return {
      id: vacancy.id,
      companyId: vacancy.companyId,
      companyName: vacancy.company.name,
      companyLogoUrl: vacancy.company.logoUrl,
      companyIndustry: vacancy.company.industry,
      title: vacancy.title,
      description: vacancy.description,
      requirementsSummary: vacancy.requirementsSummary,
      location: vacancy.location,
      employmentType: vacancy.employmentType,
      salaryMin: vacancy.salaryMin ? Number(vacancy.salaryMin) : null,
      salaryMax: vacancy.salaryMax ? Number(vacancy.salaryMax) : null,
      deadline: vacancy.deadline ? vacancy.deadline.toISOString() : null,
      createdAt: vacancy.createdAt.toISOString(),
      requirements: vacancy.jobRequirement
        ? {
            minExperienceYears: vacancy.jobRequirement.minExperienceYears
              ? Number(vacancy.jobRequirement.minExperienceYears)
              : null,
            maxExperienceYears: vacancy.jobRequirement.maxExperienceYears
              ? Number(vacancy.jobRequirement.maxExperienceYears)
              : null,
            educationLevel: vacancy.jobRequirement.educationLevel,
            requiredCertifications: (vacancy.jobRequirement.requiredCertifications as string[]) || [],
          }
        : null,
      requiredSkills: vacancy.jobRequiredSkills.map((jrs) => ({
        id: jrs.skill.id,
        name: jrs.skill.name,
        priority: jrs.priority,
        minProficiency: jrs.minProficiency,
        weight: Number(jrs.weight),
      })),
      screeningQuestions: (vacancy.screeningQuestionsJson as unknown as ScreeningQuestion[]) || [],
      isSaved,
      hasApplied: Boolean(existingApp),
      applicationId: existingApp?.id || null,
      applicationStatus: existingApp?.status || null,
    };
  }

  /**
   * Toggle save/bookmark status for a job
   */
  async toggleSaveJob(jobId: string, userId: string): Promise<{ isSaved: boolean; message: string }> {
    const applicant = await prisma.applicantProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!applicant) {
      throw new BadRequestError('Applicant profile must be created to save jobs.');
    }

    const job = await prisma.jobVacancy.findUnique({
      where: { id: jobId },
      select: { id: true, status: true },
    });

    if (!job) {
      throw new NotFoundError('Job vacancy not found.');
    }

    const existing = await prisma.savedJob.findUnique({
      where: {
        applicantId_jobId: {
          applicantId: applicant.id,
          jobId,
        },
      },
    });

    if (existing) {
      await prisma.savedJob.delete({
        where: { id: existing.id },
      });
      return { isSaved: false, message: 'Job removed from bookmarks.' };
    } else {
      await prisma.savedJob.create({
        data: {
          applicantId: applicant.id,
          jobId,
        },
      });
      return { isSaved: true, message: 'Job bookmarked successfully.' };
    }
  }

  /**
   * Remove job from saved list explicitly
   */
  async unsaveJob(jobId: string, userId: string): Promise<{ success: boolean; message: string }> {
    const applicant = await prisma.applicantProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!applicant) {
      throw new BadRequestError('Applicant profile not found.');
    }

    await prisma.savedJob.deleteMany({
      where: {
        applicantId: applicant.id,
        jobId,
      },
    });

    return { success: true, message: 'Job removed from bookmarks.' };
  }

  /**
   * Retrieve applicant's bookmarked jobs
   */
  async getSavedJobs(userId: string): Promise<SavedJobDto[]> {
    const applicant = await prisma.applicantProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!applicant) {
      throw new BadRequestError('Applicant profile not found.');
    }

    const saved = await prisma.savedJob.findMany({
      where: { applicantId: applicant.id },
      orderBy: { createdAt: 'desc' },
      include: {
        job: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
              },
            },
          },
        },
      },
    });

    return saved.map((s) => ({
      id: s.id,
      jobId: s.job.id,
      jobTitle: s.job.title,
      companyName: s.job.company.name,
      companyLogoUrl: s.job.company.logoUrl,
      location: s.job.location,
      employmentType: s.job.employmentType,
      salaryMin: s.job.salaryMin ? Number(s.job.salaryMin) : null,
      salaryMax: s.job.salaryMax ? Number(s.job.salaryMax) : null,
      deadline: s.job.deadline ? s.job.deadline.toISOString() : null,
      savedAt: s.createdAt.toISOString(),
    }));
  }
}

export default new JobSearchService();
