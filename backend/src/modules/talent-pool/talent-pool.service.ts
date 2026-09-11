import { prisma } from '../../db/client';
import {
  TalentPoolSearchParams,
  TalentPoolCandidateDto,
} from '@recruitment-platform/shared';

export class TalentPoolService {
  /**
   * FR-RC-11: Searchable applicant directory strictly respecting candidate visibility
   */
  async searchTalentPool(
    recruiterUserId: string,
    recruiterRole: string,
    params: TalentPoolSearchParams
  ): Promise<{
    candidates: TalentPoolCandidateDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 12));
    const skip = (page - 1) * limit;

    // Fetch active applicants
    const applicants = await prisma.applicantProfile.findMany({
      where: {
        user: {
          status: 'ACTIVE',
          role: 'APPLICANT',
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, status: true } },
        applicantSkills: { include: { skill: true } },
        workExperiences: true,
        educations: true,
        cvs: {
          orderBy: [
            { isPrimary: 'desc' },
            { createdAt: 'desc' },
          ],
        },
      },
    });

    // Parse and filter by visibility settings
    const eligibleCandidates = applicants.filter((profile) => {
      let visibility: 'PUBLIC' | 'BLIND' | 'PRIVATE' = 'PUBLIC';
      let isSearchable = true;

      if (profile.visibilitySettings) {
        try {
          const settings =
            typeof profile.visibilitySettings === 'string'
              ? JSON.parse(profile.visibilitySettings)
              : (profile.visibilitySettings as any);

          if (settings.visibility) {
            visibility = settings.visibility.toUpperCase();
          }
          if (settings.isSearchable !== undefined) {
            isSearchable = Boolean(settings.isSearchable);
          }
        } catch {
          // default to public
        }
      }

      // Strictly exclude PRIVATE or non-searchable
      if (!isSearchable || visibility === 'PRIVATE') {
        return false;
      }

      return true;
    });

    // Calculate experience and map
    const mappedCandidates: TalentPoolCandidateDto[] = eligibleCandidates.map((profile) => {
      let visibility: 'PUBLIC' | 'BLIND' = 'PUBLIC';
      if (profile.visibilitySettings) {
        try {
          const settings =
            typeof profile.visibilitySettings === 'string'
              ? JSON.parse(profile.visibilitySettings)
              : (profile.visibilitySettings as any);
          if (settings.visibility?.toUpperCase() === 'BLIND') {
            visibility = 'BLIND';
          }
        } catch {
          // ignore
        }
      }

      const isBlind = visibility === 'BLIND';

      // Total experience years
      let totalExperienceYears = 0;
      for (const exp of profile.workExperiences) {
        const start = exp.startDate ? new Date(exp.startDate).getTime() : 0;
        const end = exp.endDate ? new Date(exp.endDate).getTime() : Date.now();
        if (start > 0 && end > start) {
          totalExperienceYears += (end - start) / (1000 * 60 * 60 * 24 * 365.25);
        }
      }
      const expYears = Math.round(totalExperienceYears * 10) / 10;

      const skills = profile.applicantSkills.map((s) => ({
        name: s.skill.name,
        proficiencyLevel: `${s.proficiency}/5`,
        yearsExperience: s.yearsExperience ? Number(s.yearsExperience) : undefined,
      }));

      const defaultCv = profile.cvs.find((c) => c.isPrimary) || profile.cvs[0];

      return {
        id: profile.id,
        fullName: isBlind
          ? `Candidate #${profile.id.slice(0, 6).toUpperCase()}`
          : `${profile.firstName} ${profile.lastName}`.trim(),
        email: isBlind ? undefined : profile.user.email,
        phone: isBlind ? undefined : profile.phone || undefined,
        headline: profile.headline || undefined,
        location: profile.location || undefined,
        summary: profile.summary || undefined,
        skills,
        experienceYears: expYears,
        isBlind,
        cvId: isBlind ? null : defaultCv?.id || null,
        cvFileName: isBlind ? null : defaultCv?.fileName || null,
        cvUrl: isBlind
          ? null
          : defaultCv
          ? `/v1/applicant/resume/${defaultCv.id}/download`
          : null,
        profileVisibility: visibility,
      };
    });

    // Apply search and filter parameters
    let filtered = mappedCandidates;

    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.fullName.toLowerCase().includes(q) ||
          (c.headline && c.headline.toLowerCase().includes(q)) ||
          (c.summary && c.summary.toLowerCase().includes(q)) ||
          (c.location && c.location.toLowerCase().includes(q)) ||
          c.skills.some((s) => s.name.toLowerCase().includes(q))
      );
    }

    if (params.location) {
      const loc = params.location.toLowerCase();
      filtered = filtered.filter((c) => c.location && c.location.toLowerCase().includes(loc));
    }

    if (params.minExperience !== undefined && Number(params.minExperience) > 0) {
      const minExp = Number(params.minExperience);
      filtered = filtered.filter((c) => (c.experienceYears || 0) >= minExp);
    }

    if (params.skills) {
      const rawSkills = params.skills as unknown;
      const requestedSkills: string[] = Array.isArray(rawSkills)
        ? rawSkills.map((s: string) => String(s).toLowerCase().trim())
        : typeof rawSkills === 'string'
        ? rawSkills.split(',').map((s: string) => s.toLowerCase().trim()).filter(Boolean)
        : [];

      if (requestedSkills.length > 0) {
        filtered = filtered.filter((c) => {
          const candidateSkills = c.skills.map((s) => s.name.toLowerCase());
          return requestedSkills.some((req: string) =>
            candidateSkills.some((cs) => cs.includes(req) || req.includes(cs))
          );
        });
      }
    }

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + limit);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      candidates: paginated,
      total,
      page,
      totalPages,
    };
  }
}

export const talentPoolService = new TalentPoolService();
