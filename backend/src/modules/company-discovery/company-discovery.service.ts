import { prisma } from '../../db/client';
import { CompanyStatus, JobStatus } from '@prisma/client';
import {
  PublicCompanySummaryDto,
  PublicCompanyDetailDto,
  PublicCompanyJobItemDto,
  PublicCompanyJobsResponseDto,
  ToggleCompanyFollowResponseDto,
  PublicCompanyOfficeLocation,
  PublicCompanyCultureMedia,
  PublicCompanySocialLinks,
  CompanyDiscoveryQueryDto,
} from '@recruitment-platform/shared';
import { NotFoundError } from '../../middleware/error.middleware';
import { AtsScoringService } from '../ats-scoring/ats-scoring.service';
import { ApplicantScoreInput, JobScoreInput } from '../ats-scoring/ats-scoring.types';
import { CompanyDiscoveryQuery } from './company-discovery.types';

export class CompanyDiscoveryService {
  /**
   * Helper to extract headquarters string from locations array
   */
  private static extractHeadquarters(locations: any[]): string | null {
    if (!Array.isArray(locations) || locations.length === 0) return null;
    const hq = locations.find((loc: any) => loc.isHQ === true || loc.isHq === true);
    if (hq) {
      return [hq.city, hq.state, hq.country].filter(Boolean).join(', ');
    }
    const first = locations[0];
    return [first.city, first.state, first.country].filter(Boolean).join(', ');
  }

  /**
   * Helper to normalize office locations
   */
  private static normalizeLocations(rawLocations: any): PublicCompanyOfficeLocation[] {
    if (!Array.isArray(rawLocations)) return [];
    return rawLocations.map((loc: any, idx: number) => ({
      id: loc.id || `loc-${idx}`,
      name: loc.name || loc.city || 'Office',
      isHQ: Boolean(loc.isHQ ?? loc.isHq),
      address: loc.address || undefined,
      city: loc.city || '',
      state: loc.state || undefined,
      country: loc.country || '',
    }));
  }

  /**
   * Helper to normalize culture media
   */
  private static normalizeCultureMedia(rawMedia: any): PublicCompanyCultureMedia[] {
    if (!Array.isArray(rawMedia)) return [];
    return rawMedia.map((m: any, idx: number) => ({
      id: m.id || `media-${idx}`,
      type: m.type === 'VIDEO' ? 'VIDEO' : 'IMAGE',
      url: m.url || '',
      caption: m.caption || undefined,
      order: typeof m.order === 'number' ? m.order : idx,
    }));
  }

  /**
   * Public Company Directory Search & Filter (FR-AP-31)
   */
  static async searchCompanies(
    query: CompanyDiscoveryQueryDto = {},
    currentUserId?: string
  ): Promise<{
    items: PublicCompanySummaryDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 12;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    const { keyword, industry, location, size, hasActiveJobs } = query;

    const where: any = {
      status: CompanyStatus.ACTIVE,
    };

    if (keyword && keyword.trim()) {
      const trimmed = keyword.trim();
      where.OR = [
        { name: { contains: trimmed } },
        { description: { contains: trimmed } },
        { industry: { contains: trimmed } },
      ];
    }

    if (industry && industry.trim()) {
      where.industry = { contains: industry.trim() };
    }

    if (size && size.trim()) {
      where.size = size.trim();
    }

    if (hasActiveJobs) {
      where.jobVacancies = {
        some: {
          status: JobStatus.PUBLISHED,
        },
      };
    }

    // Fetch candidate companies matching DB criteria
    const companies = await prisma.company.findMany({
      where,
      include: {
        _count: {
          select: {
            jobVacancies: {
              where: { status: JobStatus.PUBLISHED },
            },
            followers: true,
          },
        },
        followers: currentUserId
          ? {
              where: { applicantId: currentUserId },
              select: { id: true },
            }
          : false,
      },
      orderBy:
        sortBy === 'name'
          ? { name: sortOrder }
          : sortBy === 'createdAt'
          ? { createdAt: sortOrder }
          : undefined,
    });

    // Map and filter by location if specified (since locations are stored in locationsJson)
    let mapped: PublicCompanySummaryDto[] = companies.map((c: any) => {
      const locations = (c.locationsJson as any) || [];
      const headquarters = this.extractHeadquarters(locations);
      const isFollowedByMe = Boolean(c.followers && c.followers.length > 0);

      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        industry: c.industry,
        size: c.size,
        logoUrl: c.logoUrl,
        coverPhotoUrl: c.coverPhotoUrl,
        website: c.website,
        description: c.description,
        headquarters,
        activeJobCount: c._count.jobVacancies,
        followerCount: c._count.followers,
        isFollowedByMe,
        createdAt: c.createdAt.toISOString(),
      };
    });

    if (location && location.trim()) {
      const locFilter = location.trim().toLowerCase();
      mapped = mapped.filter((comp: PublicCompanySummaryDto) => {
        const rawComp = companies.find((c: any) => c.id === comp.id);
        const locations = (rawComp?.locationsJson as any) || [];
        if (!Array.isArray(locations) || locations.length === 0) return false;
        return locations.some((l: any) => {
          const city = String(l.city || '').toLowerCase();
          const state = String(l.state || '').toLowerCase();
          const country = String(l.country || '').toLowerCase();
          const address = String(l.address || '').toLowerCase();
          return (
            city.includes(locFilter) ||
            state.includes(locFilter) ||
            country.includes(locFilter) ||
            address.includes(locFilter)
          );
        });
      });
    }

    // Sort by computed aggregates if requested
    if (sortBy === 'activeJobs') {
      mapped.sort((a, b) =>
        sortOrder === 'asc'
          ? a.activeJobCount - b.activeJobCount
          : b.activeJobCount - a.activeJobCount
      );
    } else if (sortBy === 'followers') {
      mapped.sort((a, b) =>
        sortOrder === 'asc'
          ? a.followerCount - b.followerCount
          : b.followerCount - a.followerCount
      );
    }

    const total = mapped.length;
    const startIndex = (page - 1) * limit;
    const items = mapped.slice(startIndex, startIndex + limit);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get Rich Employer Profile by Slug or ID (FR-AP-32)
   */
  static async getCompanyBySlugOrId(
    idOrSlug: string,
    currentUserId?: string
  ): Promise<PublicCompanyDetailDto> {
    const company = await prisma.company.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        status: CompanyStatus.ACTIVE,
      },
      include: {
        _count: {
          select: {
            jobVacancies: {
              where: { status: JobStatus.PUBLISHED },
            },
            followers: true,
          },
        },
        followers: currentUserId
          ? {
              where: { applicantId: currentUserId },
              select: { id: true },
            }
          : false,
      },
    });

    if (!company) {
      throw new NotFoundError('Company not found or is currently inactive.');
    }

    const locations = this.normalizeLocations(company.locationsJson);
    const cultureMedia = this.normalizeCultureMedia(company.cultureMediaJson);
    const socialLinks: PublicCompanySocialLinks = (company.socialLinksJson as any) || {};
    const isFollowedByMe = Boolean(company.followers && company.followers.length > 0);

    return {
      id: company.id,
      name: company.name,
      slug: company.slug,
      industry: company.industry,
      size: company.size,
      logoUrl: company.logoUrl,
      coverPhotoUrl: company.coverPhotoUrl,
      website: company.website,
      description: company.description,
      locations,
      cultureMedia,
      socialLinks,
      activeJobCount: company._count.jobVacancies,
      followerCount: company._count.followers,
      isFollowedByMe,
      createdAt: company.createdAt.toISOString(),
    };
  }

  /**
   * Get Company Active Openings with Predicted ATS Score & Apply Status (FR-AP-33)
   */
  static async getCompanyJobs(
    idOrSlug: string,
    currentUserId?: string
  ): Promise<PublicCompanyJobsResponseDto> {
    const company = await prisma.company.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        status: CompanyStatus.ACTIVE,
      },
    });

    if (!company) {
      throw new NotFoundError('Company not found or is currently inactive.');
    }

    const jobs = await prisma.jobVacancy.findMany({
      where: {
        companyId: company.id,
        status: JobStatus.PUBLISHED,
      },
      include: {
        jobRequiredSkills: {
          include: {
            skill: true,
          },
        },
        jobRequirement: true,
        applications: currentUserId
          ? {
              where: {
                applicant: {
                  userId: currentUserId,
                },
              },
              select: { id: true },
            }
          : false,
      },
      orderBy: { createdAt: 'desc' },
    });

    let applicantInput: ApplicantScoreInput | null = null;

    if (currentUserId) {
      try {
        const applicant = await prisma.applicantProfile.findUnique({
          where: { userId: currentUserId },
          include: {
            applicantSkills: { include: { skill: true } },
            workExperiences: true,
            educations: true,
            certifications: true,
            cvs: { where: { isPrimary: true }, take: 1 },
          },
        });

        if (applicant) {
          applicantInput = {
            skills: applicant.applicantSkills.map((as: any) => ({
              name: as.skill.name,
              proficiency: as.proficiency,
              years: Number(as.yearsExperience || 1),
            })),
            totalExperienceYears: applicant.workExperiences.reduce((acc: number, exp: any) => {
              const start = new Date(exp.startDate).getTime();
              const end = exp.endDate ? new Date(exp.endDate).getTime() : Date.now();
              const years = (end - start) / (1000 * 60 * 60 * 24 * 365.25);
              return acc + Math.max(0, years);
            }, 0),
            pastJobTitles: applicant.workExperiences.map((e: any) => e.title),
            educationLevel: applicant.educations[0]?.degree || 'None',
            fieldOfStudy: applicant.educations[0]?.fieldOfStudy || undefined,
            certifications: applicant.certifications.map((c: any) => c.name),
            rawCvText: applicant.cvs[0]?.parsedText || undefined,
          };
        }
      } catch (err) {
        console.warn('[CompanyDiscovery] Failed to load applicant profile for match preview:', err);
      }
    }

    const jobDtos: PublicCompanyJobItemDto[] = jobs.map((job: any) => {
      let predictedAtsScore: number | null = null;

      if (applicantInput) {
        try {
          const jobInput: JobScoreInput = {
            jobTitle: job.title,
            jobDescriptionText:
              job.description + (job.requirementsSummary ? `\n${job.requirementsSummary}` : ''),
            requiredSkills: job.jobRequiredSkills.map((jrs: any) => ({
              name: jrs.skill.name,
              priority: jrs.priority as 'MUST_HAVE' | 'NICE_TO_HAVE',
              weight: Number(jrs.weight),
              minProficiency: jrs.minProficiency,
            })),
            minExperienceYears: Number(job.jobRequirement?.minExperienceYears || 0),
            maxExperienceYears: job.jobRequirement?.maxExperienceYears
              ? Number(job.jobRequirement.maxExperienceYears)
              : undefined,
            requiredEducationLevel: job.jobRequirement?.educationLevel || undefined,
            requiredCertifications: (job.jobRequirement?.requiredCertifications as string[]) || [],
          };

          const breakdown = AtsScoringService.calculateScore(applicantInput, jobInput);
          predictedAtsScore = breakdown.overallScore;
        } catch (scoreErr) {
          console.warn(`[CompanyDiscovery] Score calculation failed for job ${job.id}:`, scoreErr);
        }
      }

      const hasApplied = Boolean(job.applications && job.applications.length > 0);

      return {
        id: job.id,
        title: job.title,
        department: null,
        employmentType: job.employmentType,
        workplaceType: 'HYBRID',
        location: job.location,
        experienceLevel: job.jobRequirement?.minExperienceYears
          ? `${job.jobRequirement.minExperienceYears}+ yrs`
          : null,
        salaryMin: job.salaryMin ? Number(job.salaryMin) : null,
        salaryMax: job.salaryMax ? Number(job.salaryMax) : null,
        salaryCurrency: 'USD',
        skills: job.jobRequiredSkills.map((s: any) => s.skill.name),
        createdAt: job.createdAt.toISOString(),
        predictedAtsScore,
        hasApplied,
      };
    });

    return {
      jobs: jobDtos,
      total: jobDtos.length,
    };
  }

  /**
   * Toggle Follow/Unfollow Company (FR-AP-35)
   */
  static async toggleFollowCompany(
    applicantUserId: string,
    companyId: string
  ): Promise<ToggleCompanyFollowResponseDto> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundError('Company not found.');
    }

    const existingFollow = await prisma.companyFollow.findUnique({
      where: {
        unique_applicant_company_follow: {
          applicantId: applicantUserId,
          companyId,
        },
      },
    });

    if (existingFollow) {
      await prisma.companyFollow.delete({
        where: { id: existingFollow.id },
      });

      const followerCount = await prisma.companyFollow.count({
        where: { companyId },
      });

      return {
        isFollowed: false,
        followerCount,
      };
    } else {
      await prisma.companyFollow.create({
        data: {
          applicantId: applicantUserId,
          companyId,
        },
      });

      const followerCount = await prisma.companyFollow.count({
        where: { companyId },
      });

      return {
        isFollowed: true,
        followerCount,
      };
    }
  }

  /**
   * Get List of Followed Companies for Applicant (FR-AP-35)
   */
  static async getFollowedCompanies(
    applicantUserId: string,
    page = 1,
    limit = 12
  ): Promise<{
    items: PublicCompanySummaryDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const total = await prisma.companyFollow.count({
      where: { applicantId: applicantUserId },
    });

    const follows = await prisma.companyFollow.findMany({
      where: { applicantId: applicantUserId },
      include: {
        company: {
          include: {
            _count: {
              select: {
                jobVacancies: {
                  where: { status: JobStatus.PUBLISHED },
                },
                followers: true,
              },
            },
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const items: PublicCompanySummaryDto[] = follows.map((f: any) => {
      const c = f.company;
      const locations = (c.locationsJson as any) || [];
      const headquarters = this.extractHeadquarters(locations);

      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        industry: c.industry,
        size: c.size,
        logoUrl: c.logoUrl,
        coverPhotoUrl: c.coverPhotoUrl,
        website: c.website,
        description: c.description,
        headquarters,
        activeJobCount: c._count.jobVacancies,
        followerCount: c._count.followers,
        isFollowedByMe: true,
        createdAt: c.createdAt.toISOString(),
      };
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }
}
