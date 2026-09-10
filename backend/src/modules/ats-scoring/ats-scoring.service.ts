import { calculateSkillsMatch } from './sub-scores/skills-match';
import { calculateExperienceMatch } from './sub-scores/experience-match';
import { calculateEducationMatch } from './sub-scores/education-match';
import { calculateSemanticMatch } from './sub-scores/semantic-match';
import { calculateCertificationMatch } from './sub-scores/certification-match';
import { resolveScoreWeights } from './weight-config';
import { determineScoreBand } from './explainability';
import { ApplicantScoreInput, JobScoreInput, AtsScoreBreakdown } from './ats-scoring.types';
import { prisma } from '../../db/client';
import { NotFoundError } from '../../middleware/error.middleware';

export class AtsScoringService {
  /**
   * Pure scoring calculation from memory input
   */
  static calculateScore(
    applicant: ApplicantScoreInput,
    job: JobScoreInput,
    weights = {
      skillsWeight: 0.40,
      experienceWeight: 0.25,
      educationWeight: 0.15,
      semanticWeight: 0.15,
      certificationWeight: 0.05,
    }
  ): AtsScoreBreakdown {
    const skillsRes = calculateSkillsMatch(applicant, job);
    const expRes = calculateExperienceMatch(applicant, job);
    const eduRes = calculateEducationMatch(applicant, job);
    const semanticRes = calculateSemanticMatch(applicant, job);
    const certRes = calculateCertificationMatch(applicant, job);

    const weightedSkills = skillsRes.score * weights.skillsWeight * 100;
    const weightedExp = expRes.score * weights.experienceWeight * 100;
    const weightedEdu = eduRes.score * weights.educationWeight * 100;
    const weightedSemantic = semanticRes.score * weights.semanticWeight * 100;
    const weightedCert = certRes.score * weights.certificationWeight * 100;

    const overallScore = Math.round(
      weightedSkills + weightedExp + weightedEdu + weightedSemantic + weightedCert
    );

    const { band, label } = determineScoreBand(overallScore);

    return {
      overallScore,
      scoreBand: band,
      bandLabel: label,
      skillsMatch: {
        score: Math.round(skillsRes.score * 100),
        weight: weights.skillsWeight * 100,
        weightedScore: Math.round(weightedSkills),
        matchedItems: skillsRes.matchedItems,
        missingItems: skillsRes.missingItems,
        details: skillsRes.details,
      },
      experienceMatch: {
        score: Math.round(expRes.score * 100),
        weight: weights.experienceWeight * 100,
        weightedScore: Math.round(weightedExp),
        details: expRes.details,
      },
      educationMatch: {
        score: Math.round(eduRes.score * 100),
        weight: weights.educationWeight * 100,
        weightedScore: Math.round(weightedEdu),
        details: eduRes.details,
      },
      semanticMatch: {
        score: Math.round(semanticRes.score * 100),
        weight: weights.semanticWeight * 100,
        weightedScore: Math.round(weightedSemantic),
        details: semanticRes.details,
      },
      certificationMatch: {
        score: Math.round(certRes.score * 100),
        weight: weights.certificationWeight * 100,
        weightedScore: Math.round(weightedCert),
        matchedItems: certRes.matchedItems,
        missingItems: certRes.missingItems,
      },
      topMatchingTerms: semanticRes.topMatchingTerms,
      computedAt: new Date().toISOString(),
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

    // Build ApplicantScoreInput
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

    // Build JobScoreInput
    const jobInput: JobScoreInput = {
      jobTitle: job.title,
      jobDescriptionText: job.description,
      requiredSkills: job.jobRequiredSkills.map((jrs) => ({
        name: jrs.skill.name,
        priority: jrs.priority as 'MUST_HAVE' | 'NICE_TO_HAVE',
        weight: Number(jrs.weight),
        minProficiency: jrs.minProficiency,
      })),
      minExperienceYears: Number(job.jobRequirement?.minExperienceYears || 0),
      maxExperienceYears: Number(job.jobRequirement?.maxExperienceYears || undefined),
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
}
