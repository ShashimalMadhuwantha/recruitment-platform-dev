import { prisma } from '../../db/client';
import {
  ApplicantProfileDto,
  ProfileCompletenessBreakdown,
  AnonymizedProfileDto,
} from '@recruitment-platform/shared';
import {
  UpdateProfileInput,
  ExperienceInput,
  EducationInput,
  SkillInput,
  CertificationInput,
  PortfolioInput,
} from './applicant-profile.types';

export class ApplicantProfileService {
  /**
   * Get or auto-initialize an applicant's complete profile
   */
  async getProfile(userId: string): Promise<ApplicantProfileDto> {
    let profile = await prisma.applicantProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        applicantSkills: {
          include: {
            skill: true,
          },
        },
        educations: {
          orderBy: { startDate: 'desc' },
        },
        workExperiences: {
          orderBy: { startDate: 'desc' },
        },
        achievements: true,
        certifications: {
          orderBy: { issueDate: 'desc' },
        },
        portfolios: true,
        cvs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!profile) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new Error('User not found');
      }

      const emailPrefix = user.email.split('@')[0];
      const nameParts = emailPrefix.split(/[._-]/);
      const firstName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : 'Candidate';
      const lastName = nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : 'Applicant';

      profile = await prisma.applicantProfile.create({
        data: {
          userId,
          firstName,
          lastName,
          visibilitySettings: {
            visibility: 'PUBLIC',
            allowRecruiterContact: true,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
          applicantSkills: {
            include: {
              skill: true,
            },
          },
          educations: true,
          workExperiences: true,
          achievements: true,
          certifications: true,
          portfolios: true,
          cvs: true,
        },
      });
    }

    const completeness = this.calculateCompleteness(profile);

    return this.formatProfileDto(profile, completeness);
  }

  /**
   * Update applicant profile basic fields and visibility settings
   */
  async updateProfile(userId: string, input: UpdateProfileInput): Promise<ApplicantProfileDto> {
    const existing = await prisma.applicantProfile.findUnique({ where: { userId } });
    if (!existing) {
      // Create profile first
      await this.getProfile(userId);
    }

    await prisma.applicantProfile.update({
      where: { userId },
      data: {
        ...(input.firstName && { firstName: input.firstName }),
        ...(input.lastName && { lastName: input.lastName }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.headline !== undefined && { headline: input.headline }),
        ...(input.summary !== undefined && { summary: input.summary }),
        ...(input.location !== undefined && { location: input.location }),
        ...(input.visibilitySettings !== undefined && { visibilitySettings: input.visibilitySettings as any }),
      },
    });

    return this.getProfile(userId);
  }

  // ==========================================
  // Work Experience Handlers
  // ==========================================
  async addExperience(userId: string, input: ExperienceInput) {
    const profile = await this.ensureProfileExists(userId);

    const experience = await prisma.workExperience.create({
      data: {
        applicantId: profile.id,
        companyName: input.companyName,
        title: input.title,
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : null,
        isCurrent: input.isCurrent,
        description: input.description,
        skillsUsedJson: input.skillsUsedJson || [],
      },
    });

    return experience;
  }

  async updateExperience(userId: string, experienceId: string, input: Partial<ExperienceInput>) {
    const profile = await this.ensureProfileExists(userId);

    const exp = await prisma.workExperience.findUnique({ where: { id: experienceId } });
    if (!exp || exp.applicantId !== profile.id) {
      throw new Error('Experience entry not found or unauthorized');
    }

    return prisma.workExperience.update({
      where: { id: experienceId },
      data: {
        ...(input.companyName && { companyName: input.companyName }),
        ...(input.title && { title: input.title }),
        ...(input.startDate && { startDate: new Date(input.startDate) }),
        ...(input.endDate !== undefined && { endDate: input.endDate ? new Date(input.endDate) : null }),
        ...(input.isCurrent !== undefined && { isCurrent: input.isCurrent }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.skillsUsedJson !== undefined && { skillsUsedJson: input.skillsUsedJson }),
      },
    });
  }

  async deleteExperience(userId: string, experienceId: string) {
    const profile = await this.ensureProfileExists(userId);
    const exp = await prisma.workExperience.findUnique({ where: { id: experienceId } });
    if (!exp || exp.applicantId !== profile.id) {
      throw new Error('Experience entry not found or unauthorized');
    }

    await prisma.workExperience.delete({ where: { id: experienceId } });
    return { success: true };
  }

  // ==========================================
  // Education Handlers
  // ==========================================
  async addEducation(userId: string, input: EducationInput) {
    const profile = await this.ensureProfileExists(userId);

    return prisma.education.create({
      data: {
        applicantId: profile.id,
        institution: input.institution,
        degree: input.degree,
        fieldOfStudy: input.fieldOfStudy,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
        gpa: input.gpa !== undefined && input.gpa !== null && input.gpa !== '' ? Number(input.gpa) : null,
      },
    });
  }

  async updateEducation(userId: string, educationId: string, input: Partial<EducationInput>) {
    const profile = await this.ensureProfileExists(userId);
    const edu = await prisma.education.findUnique({ where: { id: educationId } });
    if (!edu || edu.applicantId !== profile.id) {
      throw new Error('Education entry not found or unauthorized');
    }

    return prisma.education.update({
      where: { id: educationId },
      data: {
        ...(input.institution && { institution: input.institution }),
        ...(input.degree && { degree: input.degree }),
        ...(input.fieldOfStudy !== undefined && { fieldOfStudy: input.fieldOfStudy }),
        ...(input.startDate !== undefined && { startDate: input.startDate ? new Date(input.startDate) : null }),
        ...(input.endDate !== undefined && { endDate: input.endDate ? new Date(input.endDate) : null }),
        ...(input.gpa !== undefined && { gpa: input.gpa !== null && input.gpa !== '' ? Number(input.gpa) : null }),
      },
    });
  }

  async deleteEducation(userId: string, educationId: string) {
    const profile = await this.ensureProfileExists(userId);
    const edu = await prisma.education.findUnique({ where: { id: educationId } });
    if (!edu || edu.applicantId !== profile.id) {
      throw new Error('Education entry not found or unauthorized');
    }

    await prisma.education.delete({ where: { id: educationId } });
    return { success: true };
  }

  // ==========================================
  // Skills Handlers
  // ==========================================
  async addSkill(userId: string, input: SkillInput) {
    const profile = await this.ensureProfileExists(userId);

    const skill = await prisma.skill.findUnique({ where: { id: input.skillId } });
    if (!skill) {
      throw new Error('Skill not found in taxonomy');
    }

    return prisma.applicantSkill.upsert({
      where: {
        applicantId_skillId: {
          applicantId: profile.id,
          skillId: input.skillId,
        },
      },
      update: {
        proficiency: input.proficiency,
        yearsExperience: input.yearsExperience !== undefined ? input.yearsExperience : undefined,
      },
      create: {
        applicantId: profile.id,
        skillId: input.skillId,
        proficiency: input.proficiency,
        yearsExperience: input.yearsExperience ?? 1.0,
      },
      include: {
        skill: true,
      },
    });
  }

  async updateSkill(userId: string, skillEntryId: string, input: { proficiency?: number; yearsExperience?: number | null }) {
    const profile = await this.ensureProfileExists(userId);
    const existing = await prisma.applicantSkill.findUnique({ where: { id: skillEntryId } });
    if (!existing || existing.applicantId !== profile.id) {
      throw new Error('Skill entry not found or unauthorized');
    }

    return prisma.applicantSkill.update({
      where: { id: skillEntryId },
      data: {
        ...(input.proficiency !== undefined && { proficiency: input.proficiency }),
        ...(input.yearsExperience !== undefined && { yearsExperience: input.yearsExperience }),
      },
      include: {
        skill: true,
      },
    });
  }

  async deleteSkill(userId: string, skillEntryId: string) {
    const profile = await this.ensureProfileExists(userId);
    const existing = await prisma.applicantSkill.findUnique({ where: { id: skillEntryId } });
    if (!existing || existing.applicantId !== profile.id) {
      throw new Error('Skill entry not found or unauthorized');
    }

    await prisma.applicantSkill.delete({ where: { id: skillEntryId } });
    return { success: true };
  }

  // ==========================================
  // Certifications Handlers
  // ==========================================
  async addCertification(userId: string, input: CertificationInput) {
    const profile = await this.ensureProfileExists(userId);

    return prisma.certification.create({
      data: {
        applicantId: profile.id,
        name: input.name,
        issuer: input.issuer,
        issueDate: input.issueDate ? new Date(input.issueDate) : null,
        expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
        credentialUrl: input.credentialUrl,
      },
    });
  }

  async deleteCertification(userId: string, certificationId: string) {
    const profile = await this.ensureProfileExists(userId);
    const cert = await prisma.certification.findUnique({ where: { id: certificationId } });
    if (!cert || cert.applicantId !== profile.id) {
      throw new Error('Certification not found or unauthorized');
    }

    await prisma.certification.delete({ where: { id: certificationId } });
    return { success: true };
  }

  // ==========================================
  // Portfolios Handlers
  // ==========================================
  async addPortfolio(userId: string, input: PortfolioInput) {
    const profile = await this.ensureProfileExists(userId);

    return prisma.portfolio.create({
      data: {
        applicantId: profile.id,
        type: input.type,
        url: input.url,
        fileRef: input.fileRef,
      },
    });
  }

  async deletePortfolio(userId: string, portfolioId: string) {
    const profile = await this.ensureProfileExists(userId);
    const item = await prisma.portfolio.findUnique({ where: { id: portfolioId } });
    if (!item || item.applicantId !== profile.id) {
      throw new Error('Portfolio link not found or unauthorized');
    }

    await prisma.portfolio.delete({ where: { id: portfolioId } });
    return { success: true };
  }

  // ==========================================
  // Resumes / CVs Handlers
  // ==========================================
  async listResumes(userId: string) {
    const profile = await this.ensureProfileExists(userId);
    return prisma.cV.findMany({
      where: { applicantId: profile.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getResume(userId: string, cvId: string) {
    const profile = await this.ensureProfileExists(userId);
    const cv = await prisma.cV.findUnique({ where: { id: cvId } });
    if (!cv || cv.applicantId !== profile.id) {
      throw new Error('Resume not found or unauthorized');
    }
    return cv;
  }

  async deleteResume(userId: string, cvId: string) {
    const profile = await this.ensureProfileExists(userId);
    const cv = await prisma.cV.findUnique({ where: { id: cvId } });
    if (!cv || cv.applicantId !== profile.id) {
      throw new Error('Resume not found or unauthorized');
    }

    await prisma.cV.delete({ where: { id: cvId } });
    return { success: true };
  }

  async setPrimaryResume(userId: string, cvId: string) {
    const profile = await this.ensureProfileExists(userId);
    const cv = await prisma.cV.findUnique({ where: { id: cvId } });
    if (!cv || cv.applicantId !== profile.id) {
      throw new Error('Resume not found or unauthorized');
    }

    await prisma.cV.updateMany({
      where: { applicantId: profile.id },
      data: { isPrimary: false },
    });

    return prisma.cV.update({
      where: { id: cvId },
      data: { isPrimary: true },
    });
  }

  // ==========================================
  // Blind Recruitment / Anonymization Engine
  // ==========================================
  /**
   * Generates a redacted profile view removing candidate PII (name, email, phone, institutions)
   * to guarantee zero unconscious bias during screening (SRS §3.3, §5.6, Epic 6).
   */
  async getAnonymizedProfile(
    profileIdOrUserId: string,
    requestingUser?: { id: string; role: string }
  ): Promise<AnonymizedProfileDto> {
    // Lookup by profile id or user id
    const profile = await prisma.applicantProfile.findFirst({
      where: {
        OR: [{ id: profileIdOrUserId }, { userId: profileIdOrUserId }],
      },
      include: {
        applicantSkills: { include: { skill: true } },
        workExperiences: { orderBy: { startDate: 'desc' } },
        educations: { orderBy: { startDate: 'desc' } },
        certifications: { orderBy: { issueDate: 'desc' } },
        cvs: true,
      },
    });

    if (!profile) {
      throw new Error('Applicant profile not found');
    }

    // Audit log entry if viewed by recruiter or admin
    if (requestingUser && requestingUser.role !== 'APPLICANT') {
      await prisma.auditLog.create({
        data: {
          actorId: requestingUser.id,
          action: 'VIEW_ANONYMIZED_APPLICANT_PROFILE',
          targetType: 'APPLICANT_PROFILE',
          targetId: profile.id,
          detailsJson: {
            applicantId: profile.id,
            anonymizedView: true,
          },
        },
      });
    }

    const pseudonym = `Candidate #${profile.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;

    // Generalize location (extract country or general region, redact street/neighborhood)
    let generalLocation: string | null = null;
    if (profile.location) {
      const parts = profile.location.split(',').map((p) => p.trim());
      generalLocation = parts.length > 1 ? parts.slice(1).join(', ') : 'Metropolitan Area';
    }

    // Anonymize work experiences (generalize company names)
    const anonymizedExperiences = profile.workExperiences.map((exp) => {
      const sanitizedCompany = this.generalizeCompanyName(exp.companyName);
      return {
        id: exp.id,
        title: exp.title,
        generalizedCompany: sanitizedCompany,
        startDate: exp.startDate.toISOString().split('T')[0],
        endDate: exp.endDate ? exp.endDate.toISOString().split('T')[0] : null,
        isCurrent: exp.isCurrent,
        description: exp.description,
        skillsUsed: Array.isArray(exp.skillsUsedJson) ? (exp.skillsUsedJson as string[]) : [],
      };
    });

    // Anonymize education (generalize institution names)
    const anonymizedEducations = profile.educations.map((edu) => ({
      id: edu.id,
      degree: edu.degree,
      fieldOfStudy: edu.fieldOfStudy,
      institutionTier: '[Accredited Higher Education Institution]',
      endDate: edu.endDate ? edu.endDate.toISOString().split('T')[0] : null,
    }));

    const completeness = this.calculateCompleteness(profile);

    return {
      applicantId: profile.id,
      candidatePseudonym: pseudonym,
      headline: profile.headline || 'Experienced Professional',
      summary: profile.summary || null,
      generalLocation,
      skills: profile.applicantSkills.map((s) => ({
        name: s.skill.name,
        category: s.skill.category,
        proficiency: s.proficiency,
        yearsExperience: s.yearsExperience ? Number(s.yearsExperience) : null,
      })),
      anonymizedExperiences,
      anonymizedEducations,
      certifications: profile.certifications.map((c) => ({
        name: c.name,
        issuer: c.issuer,
        issueDate: c.issueDate ? c.issueDate.toISOString().split('T')[0] : null,
      })),
      completenessScore: completeness.score,
      blindRecruitmentNotice:
        'Protected Personal Identifiable Information (Candidate Name, Contact Details, Profile Photo, Specific Academic Institutions) has been redacted to enforce unconscious bias prevention standards.',
    };
  }

  // ==========================================
  // Helper Methods
  // ==========================================
  private async ensureProfileExists(userId: string) {
    const profile = await prisma.applicantProfile.findUnique({ where: { userId } });
    if (profile) return profile;
    return (await this.getProfile(userId)) as any;
  }

  private calculateCompleteness(profile: any): ProfileCompletenessBreakdown {
    const personalInfo = Boolean(
      profile.firstName &&
      profile.lastName &&
      profile.headline &&
      profile.summary &&
      profile.phone &&
      profile.location
    );
    const workExperience = (profile.workExperiences?.length || 0) >= 1;
    const education = (profile.educations?.length || 0) >= 1;
    const skills = (profile.applicantSkills?.length || 0) >= 3;
    const resumeAttached = (profile.cvs?.length || 0) >= 1;

    let score = 0;
    if (personalInfo) score += 20;
    else if (profile.headline || profile.summary) score += 10;

    if (workExperience) score += 25;
    if (education) score += 20;
    if (skills) score += 20;
    else if ((profile.applicantSkills?.length || 0) > 0) score += 10;

    if (resumeAttached) score += 15;

    const suggestions: string[] = [];
    if (!personalInfo) suggestions.push('Complete your contact info, headline, and summary (+20%)');
    if (!workExperience) suggestions.push('Add your work experience history (+25%)');
    if (!education) suggestions.push('Add your education history (+20%)');
    if (!skills) suggestions.push('Add at least 3 skills with proficiency ratings (+20%)');
    if (!resumeAttached) suggestions.push('Upload your CV / resume document (+15%)');

    return {
      score: Math.min(score, 100),
      personalInfo,
      workExperience,
      education,
      skills,
      resumeAttached,
      suggestions,
    };
  }

  private formatProfileDto(profile: any, completeness: ProfileCompletenessBreakdown): ApplicantProfileDto {
    return {
      id: profile.id,
      userId: profile.userId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
      headline: profile.headline,
      summary: profile.summary,
      location: profile.location,
      visibilitySettings: profile.visibilitySettings,
      completeness,
      user: profile.user,
      applicantSkills: profile.applicantSkills.map((s: any) => ({
        id: s.id,
        applicantId: s.applicantId,
        skillId: s.skillId,
        proficiency: s.proficiency,
        yearsExperience: s.yearsExperience ? Number(s.yearsExperience) : null,
        skill: s.skill
          ? {
              id: s.skill.id,
              name: s.skill.name,
              category: s.skill.category,
            }
          : undefined,
      })),
      educations: profile.educations.map((e: any) => ({
        id: e.id,
        applicantId: e.applicantId,
        institution: e.institution,
        degree: e.degree,
        fieldOfStudy: e.fieldOfStudy,
        startDate: e.startDate ? e.startDate.toISOString().split('T')[0] : null,
        endDate: e.endDate ? e.endDate.toISOString().split('T')[0] : null,
        gpa: e.gpa ? Number(e.gpa) : null,
        createdAt: e.createdAt.toISOString(),
      })),
      workExperiences: profile.workExperiences.map((w: any) => ({
        id: w.id,
        applicantId: w.applicantId,
        companyName: w.companyName,
        title: w.title,
        startDate: w.startDate.toISOString().split('T')[0],
        endDate: w.endDate ? w.endDate.toISOString().split('T')[0] : null,
        isCurrent: w.isCurrent,
        description: w.description,
        skillsUsedJson: Array.isArray(w.skillsUsedJson) ? w.skillsUsedJson : [],
        createdAt: w.createdAt.toISOString(),
      })),
      achievements: profile.achievements.map((a: any) => ({
        id: a.id,
        applicantId: a.applicantId,
        title: a.title,
        type: a.type,
        description: a.description,
        date: a.date ? a.date.toISOString().split('T')[0] : null,
        issuer: a.issuer,
        createdAt: a.createdAt.toISOString(),
      })),
      certifications: profile.certifications.map((c: any) => ({
        id: c.id,
        applicantId: c.applicantId,
        name: c.name,
        issuer: c.issuer,
        issueDate: c.issueDate ? c.issueDate.toISOString().split('T')[0] : null,
        expiryDate: c.expiryDate ? c.expiryDate.toISOString().split('T')[0] : null,
        credentialUrl: c.credentialUrl,
        createdAt: c.createdAt.toISOString(),
      })),
      portfolios: profile.portfolios.map((p: any) => ({
        id: p.id,
        applicantId: p.applicantId,
        type: p.type,
        url: p.url,
        fileRef: p.fileRef,
        createdAt: p.createdAt.toISOString(),
      })),
      cvs: profile.cvs.map((cv: any) => ({
        id: cv.id,
        applicantId: cv.applicantId,
        fileRef: cv.fileRef,
        fileName: cv.fileName,
        fileSize: cv.fileSize,
        mimeType: cv.mimeType,
        parsedText: cv.parsedText,
        parsedJson: cv.parsedJson,
        versionLabel: cv.versionLabel,
        isPrimary: cv.isPrimary,
        parsingStatus: cv.parsingStatus,
        createdAt: cv.createdAt.toISOString(),
      })),
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }

  private generalizeCompanyName(company: string): string {
    const lower = company.toLowerCase();
    if (lower.includes('bank') || lower.includes('finance') || lower.includes('capital')) {
      return '[Leading Financial Services Organization]';
    }
    if (lower.includes('health') || lower.includes('hospital') || lower.includes('medical')) {
      return '[Regional Healthcare Provider]';
    }
    if (lower.includes('consult') || lower.includes('agency')) {
      return '[Professional Services Consultancy]';
    }
    if (lower.includes('retail') || lower.includes('commerce')) {
      return '[Retail & E-Commerce Enterprise]';
    }
    return '[Enterprise Technology Organization]';
  }
}

export const applicantProfileService = new ApplicantProfileService();
export default applicantProfileService;
