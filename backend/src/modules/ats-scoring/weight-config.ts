import { ScoreWeightConfig } from '@recruitment-platform/shared';
import { prisma } from '../../db/client';

export const DEFAULT_SCORE_WEIGHTS: ScoreWeightConfig = {
  skillsWeight: 0.40,
  experienceWeight: 0.25,
  educationWeight: 0.15,
  semanticWeight: 0.15,
  certificationWeight: 0.05,
};

export async function resolveScoreWeights(
  companyId?: string | null,
  jobId?: string | null
): Promise<ScoreWeightConfig> {
  // 1. Check job-specific weights
  if (jobId) {
    const jobConfig = await prisma.scoreWeightConfig.findFirst({
      where: { jobId },
    });
    if (jobConfig) {
      return {
        skillsWeight: Number(jobConfig.skillsWeight),
        experienceWeight: Number(jobConfig.experienceWeight),
        educationWeight: Number(jobConfig.educationWeight),
        semanticWeight: Number(jobConfig.semanticWeight),
        certificationWeight: Number(jobConfig.certificationWeight),
      };
    }
  }

  // 2. Check company-level weights
  if (companyId) {
    const companyConfig = await prisma.scoreWeightConfig.findFirst({
      where: { companyId, jobId: null },
    });
    if (companyConfig) {
      return {
        skillsWeight: Number(companyConfig.skillsWeight),
        experienceWeight: Number(companyConfig.experienceWeight),
        educationWeight: Number(companyConfig.educationWeight),
        semanticWeight: Number(companyConfig.semanticWeight),
        certificationWeight: Number(companyConfig.certificationWeight),
      };
    }
  }

  // 3. Check global default in DB
  const globalConfig = await prisma.scoreWeightConfig.findFirst({
    where: { isDefault: true },
  });

  if (globalConfig) {
    return {
      skillsWeight: Number(globalConfig.skillsWeight),
      experienceWeight: Number(globalConfig.experienceWeight),
      educationWeight: Number(globalConfig.educationWeight),
      semanticWeight: Number(globalConfig.semanticWeight),
      certificationWeight: Number(globalConfig.certificationWeight),
    };
  }

  return DEFAULT_SCORE_WEIGHTS;
}
