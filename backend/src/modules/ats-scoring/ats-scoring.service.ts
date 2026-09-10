import { calculateSkillsMatch } from './sub-scores/skills-match';
import { calculateExperienceMatch } from './sub-scores/experience-match';
import { calculateEducationMatch } from './sub-scores/education-match';
import { calculateSemanticMatch } from './sub-scores/semantic-match';
import { calculateCertificationMatch } from './sub-scores/certification-match';
import { resolveScoreWeights, DEFAULT_SCORE_WEIGHTS } from './weight-config';
import { determineScoreBand, generateScoreRecommendations } from './explainability';
import { ApplicantScoreInput, JobScoreInput, AtsScoreBreakdown } from './ats-scoring.types';
import {
  PreApplyMatchPreviewDto,
  AtsScoreDetailDto,
  BatchRescoreResultDto,
  ScoreWeightConfig,
} from '@recruitment-platform/shared';
import { prisma } from '../../db/client';
import { NotFoundError, BadRequestError } from '../../middleware/error.middleware';

export class AtsScoringService {
  /**
   * Pure scoring calculation from memory input
   */
  static calculateScore(
    applicant: ApplicantScoreInput,
    job: JobScoreInput,
    weights: ScoreWeightConfig = DEFAULT_SCORE_WEIGHTS
  ): AtsScoreBreakdown {
    const skillsRes = calculateSkillsMatch(applicant, job);
    const expRes = calculateExperienceMatch(applicant, job);
    const eduRes = calculateEducationMatch(applicant, job);
    const semanticRes = calculateSemanticMatch(applicant, job);
    const certRes = calculateCertificationMatch(applicant, job);

    const weightedSkills = skillsRes.score * Number(weights.skillsWeight) * 100;
    const weightedExp = expRes.score * Number(weights.experienceWeight) * 100;
    const weightedEdu = eduRes.score * Number(weights.educationWeight) * 100;
    const weightedSemantic = semanticRes.score * Number(weights.semanticWeight) * 100;
    const weightedCert = certRes.score * Number(weights.certificationWeight) * 100;

    const overallScore = Math.min(
      100,
      Math.round(weightedSkills + weightedExp + weightedEdu + weightedSemantic + weightedCert)
    );

    const { band, label } = determineScoreBand(overallScore);

    return {
      overallScore,
      scoreBand: band,
      bandLabel: label,
      skillsMatch: {
        score: Math.round(skillsRes.score * 100),
        weight: Math.round(Number(weights.skillsWeight) * 100),
        weightedScore: Math.round(weightedSkills),
        matchedItems: skillsRes.matchedItems,
        missingItems: skillsRes.missingItems,
        details: skillsRes.details,
      },
      experienceMatch: {
        score: Math.round(expRes.score * 100),
        weight: Math.round(Number(weights.experienceWeight) * 100),
        weightedScore: Math.round(weightedExp),
        details: expRes.details,
      },
      educationMatch: {
        score: Math.round(eduRes.score * 100),
        weight: Math.round(Number(weights.educationWeight) * 100),
        weightedScore: Math.round(weightedEdu),
        details: eduRes.details,
      },
      semanticMatch: {
        score: Math.round(semanticRes.score * 100),
        weight: Math.round(Number(weights.semanticWeight) * 100),
        weightedScore: Math.round(weightedSemantic),
        details: semanticRes.details,
      },
      certificationMatch: {
        score: Math.round(certRes.score * 100),
        weight: Math.round(Number(weights.certificationWeight) * 100),
        weightedScore: Math.round(weightedCert),
        matchedItems: certRes.matchedItems,
        missingItems: certRes.missingItems,
        details: certRes.details,
      },
      topMatchingTerms: semanticRes.topMatchingTerms,
      computedAt: new Date().toISOString(),
    };
  }

  /**
   * On-demand candidate pre-apply match preview (FR-ATS-02)
   */
  static async previewJobMatch(applicantUserId: string, jobId: string): Promise<PreApplyMatchPreviewDto> {
    // 1. Fetch Applicant Profile
    const applicant = await prisma.applicantProfile.findUnique({
      where: { userId: applicantUserId },
      include: {
        applicantSkills: { include: { skill: true } },
        workExperiences: true,
        educations: true,
        certifications: true,
        cvs: { where: { isPrimary: true }, take: 1 },
      },
    });

    if (!applicant) {
      throw new NotFoundError('Applicant profile not found. Please complete your profile first.');
    }

    // 2. Fetch Job Vacancy
    const job = await prisma.jobVacancy.findUnique({
      where: { id: jobId },
      include: {
        company: true,
        jobRequiredSkills: { include: { skill: true } },
        jobRequirement: true,
      },
    });

    if (!job) {
      throw new NotFoundError(`Job vacancy not found: ${jobId}`);
    }

    // 3. Construct inputs
    const applicantInput: ApplicantScoreInput = {
      skills: applicant.applicantSkills.map((as) => ({
        name: as.skill.name,
        proficiency: as.proficiency,
        years: Number(as.yearsExperience || 1),
      })),
      totalExperienceYears: applicant.workExperiences.reduce((acc, exp) => {
        const start = new Date(exp.startDate).getTime();
        const end = exp.endDate ? new Date(exp.endDate).getTime() : Date.now();
        const years = (end - start) / (1000 * 60 * 60 * 24 * 365.25);
        return acc + Math.max(0, years);
      }, 0),
      pastJobTitles: applicant.workExperiences.map((e) => e.title),
      educationLevel: applicant.educations[0]?.degree || 'None',
      fieldOfStudy: applicant.educations[0]?.fieldOfStudy || undefined,
      certifications: applicant.certifications.map((c) => c.name),
      rawCvText: applicant.cvs[0]?.parsedText || undefined,
    };

    const jobInput: JobScoreInput = {
      jobTitle: job.title,
      jobDescriptionText: job.description + (job.requirementsSummary ? `\n${job.requirementsSummary}` : ''),
      requiredSkills: job.jobRequiredSkills.map((jrs) => ({
        name: jrs.skill.name,
        priority: jrs.priority as 'MUST_HAVE' | 'NICE_TO_HAVE',
        weight: Number(jrs.weight),
        minProficiency: jrs.minProficiency,
      })),
      minExperienceYears: Number(job.jobRequirement?.minExperienceYears || 0),
      maxExperienceYears: job.jobRequirement?.maxExperienceYears ? Number(job.jobRequirement.maxExperienceYears) : undefined,
      requiredEducationLevel: job.jobRequirement?.educationLevel || undefined,
      requiredCertifications: (job.jobRequirement?.requiredCertifications as string[]) || [],
    };

    const weights = await resolveScoreWeights(job.companyId, job.id);
    const breakdown = this.calculateScore(applicantInput, jobInput, weights);

    // Compute gaps & recommendations
    const missingCriticalSkills =
      (breakdown.skillsMatch.details?.missingMustHave as string[]) || [];
    const missingNiceToHaveSkills =
      (breakdown.skillsMatch.details?.missingNiceToHave as string[]) || [];
    const experienceGap =
      (breakdown.experienceMatch.details?.experienceGap as number) || 0;
    const educationMet =
      (breakdown.educationMatch.details?.educationMet as boolean) ?? true;

    const recommendations = generateScoreRecommendations({
      breakdown,
      missingCriticalSkills,
      experienceGap,
      educationMet,
    });

    return {
      jobId: job.id,
      jobTitle: job.title,
      companyName: job.company.name,
      overallScore: breakdown.overallScore,
      scoreBand: breakdown.scoreBand,
      bandLabel: breakdown.bandLabel,
      breakdown,
      missingCriticalSkills,
      missingNiceToHaveSkills,
      experienceGap,
      educationMet,
      recommendations,
    };
  }

  /**
   * Score an application in the database and persist the result
   */
  static async scoreApplication(applicationId: string): Promise<AtsScoreBreakdown> {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        applicant: {
          include: {
            applicantSkills: { include: { skill: true } },
            workExperiences: true,
            educations: true,
            certifications: true,
            cvs: { where: { isPrimary: true }, take: 1 },
          },
        },
        job: {
          include: {
            jobRequiredSkills: { include: { skill: true } },
            jobRequirement: true,
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundError(`Application not found: ${applicationId}`);
    }

    const { applicant, job } = application;

    const applicantInput: ApplicantScoreInput = {
      skills: applicant.applicantSkills.map((as) => ({
        name: as.skill.name,
        proficiency: as.proficiency,
        years: Number(as.yearsExperience || 1),
      })),
      totalExperienceYears: applicant.workExperiences.reduce((acc, exp) => {
        const start = new Date(exp.startDate).getTime();
        const end = exp.endDate ? new Date(exp.endDate).getTime() : Date.now();
        const years = (end - start) / (1000 * 60 * 60 * 24 * 365.25);
        return acc + Math.max(0, years);
      }, 0),
      pastJobTitles: applicant.workExperiences.map((e) => e.title),
      educationLevel: applicant.educations[0]?.degree || 'None',
      fieldOfStudy: applicant.educations[0]?.fieldOfStudy || undefined,
      certifications: applicant.certifications.map((c) => c.name),
      rawCvText: applicant.cvs[0]?.parsedText || undefined,
    };

    const jobInput: JobScoreInput = {
      jobTitle: job.title,
      jobDescriptionText: job.description + (job.requirementsSummary ? `\n${job.requirementsSummary}` : ''),
      requiredSkills: job.jobRequiredSkills.map((jrs) => ({
        name: jrs.skill.name,
        priority: jrs.priority as 'MUST_HAVE' | 'NICE_TO_HAVE',
        weight: Number(jrs.weight),
        minProficiency: jrs.minProficiency,
      })),
      minExperienceYears: Number(job.jobRequirement?.minExperienceYears || 0),
      maxExperienceYears: job.jobRequirement?.maxExperienceYears ? Number(job.jobRequirement.maxExperienceYears) : undefined,
      requiredEducationLevel: job.jobRequirement?.educationLevel || undefined,
      requiredCertifications: (job.jobRequirement?.requiredCertifications as string[]) || [],
    };

    const weights = await resolveScoreWeights(job.companyId, job.id);
    const breakdown = this.calculateScore(applicantInput, jobInput, weights);

    // Save/Update in ATSScore table
    await prisma.aTSScore.upsert({
      where: { applicationId },
      create: {
        applicationId,
        overallScore: breakdown.overallScore,
        scoreBand: breakdown.scoreBand,
        skillsScore: breakdown.skillsMatch.score,
        experienceScore: breakdown.experienceMatch.score,
        educationScore: breakdown.educationMatch.score,
        semanticTfidfScore: breakdown.semanticMatch.score,
        certificationScore: breakdown.certificationMatch.score,
        breakdownJson: breakdown as any,
        topMatchingTermsJson: breakdown.topMatchingTerms,
      },
      update: {
        overallScore: breakdown.overallScore,
        scoreBand: breakdown.scoreBand,
        skillsScore: breakdown.skillsMatch.score,
        experienceScore: breakdown.experienceMatch.score,
        educationScore: breakdown.educationMatch.score,
        semanticTfidfScore: breakdown.semanticMatch.score,
        certificationScore: breakdown.certificationMatch.score,
        breakdownJson: breakdown as any,
        topMatchingTermsJson: breakdown.topMatchingTerms,
        computedAt: new Date(),
      },
    });

    return breakdown;
  }

  /**
   * Get full persistent ATS Score Detail for an application
   */
  static async getApplicationScore(applicationId: string): Promise<AtsScoreDetailDto> {
    let score = await prisma.aTSScore.findUnique({
      where: { applicationId },
      include: {
        application: {
          include: {
            applicant: true,
            job: { include: { company: true } },
          },
        },
      },
    });

    // If score record doesn't exist yet, compute on-demand
    if (!score) {
      await this.scoreApplication(applicationId);
      score = await prisma.aTSScore.findUnique({
        where: { applicationId },
        include: {
          application: {
            include: {
              applicant: true,
              job: { include: { company: true } },
            },
          },
        },
      });
    }

    if (!score) {
      throw new NotFoundError(`Unable to resolve ATS Score for application: ${applicationId}`);
    }

    // Fetch overrideBy user if set
    let overrideBy: { id: string; email: string; role: any } | null = null;
    if (score.overrideById) {
      overrideBy = await prisma.user.findUnique({
        where: { id: score.overrideById },
        select: { id: true, email: true, role: true },
      });
    }

    const rawBreakdown = score.breakdownJson as any;
    const topMatchingTerms = (score.topMatchingTermsJson as string[]) || rawBreakdown?.topMatchingTerms || [];

    return {
      id: score.id,
      applicationId: score.applicationId,
      overallScore: Number(score.overallScore),
      scoreBand: score.scoreBand,
      skillsScore: Number(score.skillsScore),
      experienceScore: Number(score.experienceScore),
      educationScore: Number(score.educationScore),
      semanticTfidfScore: Number(score.semanticTfidfScore),
      certificationScore: Number(score.certificationScore),
      breakdown: rawBreakdown as AtsScoreBreakdown,
      topMatchingTerms,
      manualOverrideScore: score.manualOverrideScore ? Number(score.manualOverrideScore) : null,
      overrideReason: score.overrideReason,
      overrideById: score.overrideById,
      overrideBy,
      computedAt: score.computedAt.toISOString(),
      applicant: {
        id: score.application.applicant.id,
        firstName: score.application.applicant.firstName,
        lastName: score.application.applicant.lastName,
        email: '',
        headline: score.application.applicant.headline,
      },
      job: {
        id: score.application.job.id,
        title: score.application.job.title,
        companyName: score.application.job.company.name,
      },
    };
  }

  /**
   * Recruiter manual score override with mandatory reason and audit log (FR-ATS-06, FR-ATS-10)
   */
  static async overrideScore(params: {
    applicationId: string;
    recruiterUserId: string;
    overrideScore: number;
    reason: string;
  }): Promise<AtsScoreDetailDto> {
    const { applicationId, recruiterUserId, overrideScore, reason } = params;

    if (overrideScore < 0 || overrideScore > 100) {
      throw new BadRequestError('Override score must be an integer between 0 and 100');
    }

    if (!reason || reason.trim().length < 5) {
      throw new BadRequestError('A mandatory justification reason (at least 5 characters) is required for score overrides');
    }

    // Verify existing score or create one
    let score = await prisma.aTSScore.findUnique({
      where: { applicationId },
    });

    if (!score) {
      await this.scoreApplication(applicationId);
      score = await prisma.aTSScore.findUnique({ where: { applicationId } });
    }

    if (!score) {
      throw new NotFoundError(`Score record not found for application ${applicationId}`);
    }

    const previousScore = Number(score.overallScore);

    // 1. Update ATSScore record
    await prisma.aTSScore.update({
      where: { applicationId },
      data: {
        manualOverrideScore: overrideScore,
        overrideReason: reason.trim(),
        overrideById: recruiterUserId,
      },
    });

    // 2. Create AuditLog row (FR-ATS-06 / NFR-18)
    await prisma.auditLog.create({
      data: {
        actorId: recruiterUserId,
        action: 'OVERRIDE_ATS_SCORE',
        targetType: 'APPLICATION',
        targetId: applicationId,
        detailsJson: {
          previousOverallScore: previousScore,
          manualOverrideScore: overrideScore,
          reason: reason.trim(),
        },
      },
    });

    return this.getApplicationScore(applicationId);
  }

  /**
   * Batch re-score all applications for a job vacancy (FR-ATS-08)
   */
  static async batchRescoreJobApplications(jobId: string): Promise<BatchRescoreResultDto> {
    const startTime = Date.now();

    const applications = await prisma.application.findMany({
      where: {
        jobId,
        status: { not: 'WITHDRAWN' },
      },
      select: { id: true },
    });

    let scoreSum = 0;
    for (const app of applications) {
      const breakdown = await this.scoreApplication(app.id);
      scoreSum += breakdown.overallScore;
    }

    const durationMs = Date.now() - startTime;
    const averageScore = applications.length > 0 ? Math.round(scoreSum / applications.length) : 0;

    return {
      jobId,
      totalApplications: applications.length,
      updatedScoresCount: applications.length,
      averageScore,
      durationMs,
    };
  }
}
