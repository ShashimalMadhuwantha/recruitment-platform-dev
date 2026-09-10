import { PrismaClient, JobStatus, EmploymentType, SkillPriority, ScoreBand, ApplicationStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Seeding job vacancy for lasinduthemiya96@gmail.com (Nibm)...');

  const lasindu = await prisma.user.findUnique({
    where: { email: 'lasinduthemiya96@gmail.com' },
    include: { recruiterProfile: { include: { company: true } } },
  });

  if (!lasindu || !lasindu.recruiterProfile?.companyId) {
    throw new Error('Lasindu recruiter profile or company not found!');
  }

  const companyId = lasindu.recruiterProfile.companyId;

  // 1. Fetch skills
  const reactSkill = await prisma.skill.findUnique({ where: { name: 'React' } });
  const tsSkill = await prisma.skill.findUnique({ where: { name: 'TypeScript' } });
  const nodeSkill = await prisma.skill.findUnique({ where: { name: 'Node.js' } });
  const gqlSkill = await prisma.skill.findUnique({ where: { name: 'GraphQL' } });
  const dockerSkill = await prisma.skill.findUnique({ where: { name: 'Docker' } });

  // 2. Create Job Vacancy
  const job = await prisma.jobVacancy.create({
    data: {
      companyId,
      createdById: lasindu.id,
      title: 'Senior Full-Stack Engineer (React / Node.js)',
      description: `We are seeking an experienced Senior Full-Stack Engineer to lead the design and implementation of modern scalable web applications.

Responsibilities:
• Architect, build, and maintain robust web applications using React, TypeScript, and Node.js microservices.
• Collaborate with cross-functional teams to design intuitive, high-performance user interfaces.
• Build scalable REST and GraphQL APIs backed by relational databases (PostgreSQL/MySQL).
• Write clean, well-tested code following best engineering practices and automated CI/CD workflows.

Requirements:
• 3+ years of professional full-stack software development experience.
• Strong proficiency with React, modern JavaScript/TypeScript, and state management.
• Solid backend experience with Node.js, Express, and relational databases.
• Familiarity with containerization (Docker) and cloud deployments.`,
      location: 'Colombo, Western Province, Sri Lanka',
      employmentType: EmploymentType.FULL_TIME,
      status: JobStatus.PUBLISHED,
      salaryMin: 250000,
      salaryMax: 450000,
      jobRequirement: {
        create: {
          minExperienceYears: 3,
          maxExperienceYears: 8,
          educationLevel: 'Bachelor',
          requiredCertifications: ['AWS Certified Solutions Architect'],
        },
      },
      jobRequiredSkills: {
        create: [
          ...(reactSkill ? [{ skillId: reactSkill.id, priority: SkillPriority.MUST_HAVE, minProficiency: 4, weight: 1.0 }] : []),
          ...(tsSkill ? [{ skillId: tsSkill.id, priority: SkillPriority.MUST_HAVE, minProficiency: 4, weight: 1.0 }] : []),
          ...(nodeSkill ? [{ skillId: nodeSkill.id, priority: SkillPriority.MUST_HAVE, minProficiency: 4, weight: 1.0 }] : []),
          ...(gqlSkill ? [{ skillId: gqlSkill.id, priority: SkillPriority.NICE_TO_HAVE, minProficiency: 3, weight: 0.5 }] : []),
          ...(dockerSkill ? [{ skillId: dockerSkill.id, priority: SkillPriority.NICE_TO_HAVE, minProficiency: 3, weight: 0.5 }] : []),
        ],
      },
    },
  });

  console.log(`✅ Created Job Vacancy: "${job.title}" (ID: ${job.id})`);

  // 3. Create Audit Log
  await prisma.auditLog.create({
    data: {
      actorId: lasindu.id,
      action: 'CREATE_JOB_VACANCY',
      targetType: 'JOB_VACANCY',
      targetId: job.id,
      detailsJson: { title: job.title, status: job.status },
    },
  });

  // 4. Link demo candidate (Alex Turner) if available
  const demoApplicant = await prisma.user.findFirst({
    where: { email: 'candidate.demo@atsplatform.local' },
    include: { applicantProfile: true },
  });

  if (demoApplicant && demoApplicant.applicantProfile) {
    const defaultStage = await prisma.pipelineStage.findFirst({
      where: { name: 'Screening' },
    });

    const application = await prisma.application.create({
      data: {
        jobId: job.id,
        applicantId: demoApplicant.applicantProfile.id,
        status: ApplicationStatus.SCREENING,
        appliedAt: new Date(),
      },
    });

    if (defaultStage) {
      await prisma.candidatePipeline.create({
        data: {
          applicationId: application.id,
          stageId: defaultStage.id,
          movedById: lasindu.id,
        },
      });
    }

    // Create ATS Score for this applicant
    await prisma.aTSScore.create({
      data: {
        applicationId: application.id,
        overallScore: 88.5,
        scoreBand: ScoreBand.HIGH,
        skillsScore: 92.0,
        experienceScore: 85.0,
        educationScore: 90.0,
        semanticTfidfScore: 84.0,
        certificationScore: 80.0,
        breakdownJson: {
          mustHaveMet: true,
          missingMustHaves: [],
          matchedSkills: ['React', 'TypeScript', 'Node.js'],
          missingSkills: ['GraphQL'],
        },
        topMatchingTermsJson: ['microservices', 'react', 'typescript', 'node.js', 'scaling', 'api'],
      },
    });

    console.log(`✅ Seeded Application & ATS Score (88.5% - HIGH) for demo candidate Alex Turner`);
  }

  console.log('🎉 Done! Job is now visible in Lasindu recruiter dashboard.');
}

main()
  .catch((err) => {
    console.error('Error seeding job:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

