import {
  PrismaClient,
  JobStatus,
  EmploymentType,
  SkillPriority,
  ScoreBand,
  ApplicationStatus,
  UserRole,
  UserStatus,
} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Seeding full Epic 7 ATS data for Recruiter & Applicant...');

  // 1. Fetch Lasindu (Recruiter) and company Nibm
  const lasindu = await prisma.user.findUnique({
    where: { email: 'lasinduthemiya96@gmail.com' },
    include: { recruiterProfile: { include: { company: true } } },
  });

  if (!lasindu || !lasindu.recruiterProfile?.companyId) {
    throw new Error('Lasindu recruiter profile or company not found!');
  }

  const companyId = lasindu.recruiterProfile.companyId;

  // 2. Fetch skills from taxonomy
  const reactSkill = await prisma.skill.findUnique({ where: { name: 'React' } });
  const tsSkill = await prisma.skill.findUnique({ where: { name: 'TypeScript' } });
  const nodeSkill = await prisma.skill.findUnique({ where: { name: 'Node.js' } });
  const gqlSkill = await prisma.skill.findUnique({ where: { name: 'GraphQL' } });
  const postgresSkill = await prisma.skill.findUnique({ where: { name: 'PostgreSQL' } });
  const dockerSkill = await prisma.skill.findUnique({ where: { name: 'Docker' } });

  // 3. Ensure Job 1: "Senior Full-Stack Engineer (React / Node.js)"
  const job1Id = '36a383f4-4d3f-48a7-a4bb-f527e951c5ea';
  let job1 = await prisma.jobVacancy.findUnique({ where: { id: job1Id } });
  if (!job1) {
    job1 = await prisma.jobVacancy.create({
      data: {
        id: job1Id,
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
• Solid backend experience with Node.js, Express, and relational databases.`,
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
          ],
        },
      },
    });
  }
  console.log(`✅ Verified Job 1: "${job1.title}" (${job1.id})`);

  // 4. Ensure Job 2: "Full Stack React / Node Developer" (with dedicated stable ID)
  const job2Id = '77b21a88-251c-4b68-b80c-99d9804b32c0';
  let job2 = await prisma.jobVacancy.findUnique({ where: { id: job2Id } });
  if (!job2) {
    job2 = await prisma.jobVacancy.create({
      data: {
        id: job2Id,
        companyId,
        createdById: lasindu.id,
        title: 'Full Stack React / Node Developer',
        description: `Join our agile product development team building high-performance ATS recruiting software.
Responsibilities:
• Develop dynamic frontend user experiences with React and Tailwind CSS.
• Build secure REST APIs with Node.js, Express, and PostgreSQL.
• Integrate automated CI/CD and unit testing suites.
Requirements:
• 2+ years of full stack software development experience.
• Familiarity with modern TypeScript, React, and relational databases.`,
        location: 'Colombo, Western Province, Sri Lanka',
        employmentType: EmploymentType.FULL_TIME,
        status: JobStatus.PUBLISHED,
        salaryMin: 180000,
        salaryMax: 300000,
        jobRequirement: {
          create: {
            minExperienceYears: 2,
            maxExperienceYears: 5,
            educationLevel: 'Bachelor',
          },
        },
        jobRequiredSkills: {
          create: [
            ...(reactSkill ? [{ skillId: reactSkill.id, priority: SkillPriority.MUST_HAVE, minProficiency: 3, weight: 1.0 }] : []),
            ...(nodeSkill ? [{ skillId: nodeSkill.id, priority: SkillPriority.MUST_HAVE, minProficiency: 3, weight: 1.0 }] : []),
            ...(postgresSkill ? [{ skillId: postgresSkill.id, priority: SkillPriority.NICE_TO_HAVE, minProficiency: 3, weight: 0.5 }] : []),
          ],
        },
      },
    });
  }
  console.log(`✅ Verified Job 2: "${job2.title}" (${job2.id})`);

  // 5. Ensure Shashimal profile exists and has required skills for high match
  let shashimal = await prisma.user.findUnique({
    where: { email: 'shashimalmadhuwantha12@gmail.com' },
    include: { applicantProfile: true },
  });

  if (shashimal?.applicantProfile) {
    // Tag React, TypeScript, Node.js to Shashimal profile so ATS computes high match
    if (reactSkill) {
      await prisma.applicantSkill.upsert({
        where: { applicantId_skillId: { applicantId: shashimal.applicantProfile.id, skillId: reactSkill.id } },
        update: { proficiency: 4, yearsExperience: 2.5 },
        create: { applicantId: shashimal.applicantProfile.id, skillId: reactSkill.id, proficiency: 4, yearsExperience: 2.5 },
      });
    }
    if (tsSkill) {
      await prisma.applicantSkill.upsert({
        where: { applicantId_skillId: { applicantId: shashimal.applicantProfile.id, skillId: tsSkill.id } },
        update: { proficiency: 4, yearsExperience: 2.0 },
        create: { applicantId: shashimal.applicantProfile.id, skillId: tsSkill.id, proficiency: 4, yearsExperience: 2.0 },
      });
    }
    if (nodeSkill) {
      await prisma.applicantSkill.upsert({
        where: { applicantId_skillId: { applicantId: shashimal.applicantProfile.id, skillId: nodeSkill.id } },
        update: { proficiency: 4, yearsExperience: 2.0 },
        create: { applicantId: shashimal.applicantProfile.id, skillId: nodeSkill.id, proficiency: 4, yearsExperience: 2.0 },
      });
    }
    console.log(`✅ Enriched Shashimal profile taxonomy skills (React, TypeScript, Node.js)`);
  }

  // Helper to upsert an application with ATS Score
  const upsertApplicationWithScore = async (
    applicantProfileId: string,
    jobId: string,
    status: ApplicationStatus,
    scoreData: {
      overallScore: number;
      scoreBand: ScoreBand;
      skillsScore: number;
      experienceScore: number;
      educationScore: number;
      semanticTfidfScore: number;
      certificationScore: number;
      matchedSkills: string[];
      missingSkills: string[];
      missingMustHaves: string[];
      topMatchingTerms: string[];
    }
  ) => {
    let app = await prisma.application.findUnique({
      where: { applicantId_jobId: { applicantId: applicantProfileId, jobId } },
      include: { atsScore: true },
    });

    if (!app) {
      app = await prisma.application.create({
        data: {
          applicantId: applicantProfileId,
          jobId,
          status,
          appliedAt: new Date(),
        },
        include: { atsScore: true },
      });
    } else {
      await prisma.application.update({
        where: { id: app.id },
        data: { status },
      });
    }

    const breakdownJson = {
      overallScore: scoreData.overallScore,
      scoreBand: scoreData.scoreBand,
      bandLabel: scoreData.scoreBand === 'HIGH' ? 'Strong match' : scoreData.scoreBand === 'MID' ? 'Partial match' : 'Weak match',
      skillsMatch: {
        score: scoreData.skillsScore,
        weight: 40,
        matchedItems: scoreData.matchedSkills,
        missingItems: scoreData.missingSkills,
        details: {
          mustHaveMet: scoreData.missingMustHaves.length === 0,
          matchedSkills: scoreData.matchedSkills,
          missingSkills: scoreData.missingSkills,
          missingMustHaves: scoreData.missingMustHaves,
        },
      },
      experienceMatch: {
        score: scoreData.experienceScore,
        weight: 25,
        details: {
          applicantExperienceYears: 3.5,
          requiredExperienceYears: 3.0,
          roleRelevanceFactor: 1.0,
        },
      },
      educationMatch: {
        score: scoreData.educationScore,
        weight: 15,
        details: {
          applicantEducationLevel: "Bachelor's Degree",
          requiredEducationLevel: "Bachelor's Degree",
          degreeMatched: true,
          fieldMatched: true,
        },
      },
      semanticMatch: {
        score: scoreData.semanticTfidfScore,
        weight: 15,
        details: {
          cosineSimilarity: scoreData.semanticTfidfScore / 100,
        },
      },
      certificationMatch: {
        score: scoreData.certificationScore,
        weight: 5,
        matchedItems: ['AWS Certified Solutions Architect'],
        missingItems: [],
        details: {},
      },
      topMatchingTerms: scoreData.topMatchingTerms,
      computedAt: new Date().toISOString(),
    };

    if (app.atsScore) {
      await prisma.aTSScore.update({
        where: { id: app.atsScore.id },
        data: {
          overallScore: scoreData.overallScore,
          scoreBand: scoreData.scoreBand,
          skillsScore: scoreData.skillsScore,
          experienceScore: scoreData.experienceScore,
          educationScore: scoreData.educationScore,
          semanticTfidfScore: scoreData.semanticTfidfScore,
          certificationScore: scoreData.certificationScore,
          breakdownJson,
          topMatchingTermsJson: scoreData.topMatchingTerms,
        },
      });
    } else {
      await prisma.aTSScore.create({
        data: {
          applicationId: app.id,
          overallScore: scoreData.overallScore,
          scoreBand: scoreData.scoreBand,
          skillsScore: scoreData.skillsScore,
          experienceScore: scoreData.experienceScore,
          educationScore: scoreData.educationScore,
          semanticTfidfScore: scoreData.semanticTfidfScore,
          certificationScore: scoreData.certificationScore,
          breakdownJson,
          topMatchingTermsJson: scoreData.topMatchingTerms,
        },
      });
    }

    return app;
  };

  // 6. Link Shashimal to Job 1 and Job 2
  let shashimalApp1: any = null;
  let shashimalApp2: any = null;
  if (shashimal?.applicantProfile) {
    shashimalApp1 = await upsertApplicationWithScore(
      shashimal.applicantProfile.id,
      job1.id,
      ApplicationStatus.SCREENING,
      {
        overallScore: 88.5,
        scoreBand: ScoreBand.HIGH,
        skillsScore: 92.0,
        experienceScore: 85.0,
        educationScore: 90.0,
        semanticTfidfScore: 84.0,
        certificationScore: 80.0,
        matchedSkills: ['React', 'TypeScript', 'Node.js'],
        missingSkills: ['GraphQL'],
        missingMustHaves: [],
        topMatchingTerms: ['software engineering', 'full-stack developer', 'react', 'node.js', 'rest api', 'microservices'],
      }
    );

    shashimalApp2 = await upsertApplicationWithScore(
      shashimal.applicantProfile.id,
      job2.id,
      ApplicationStatus.APPLIED,
      {
        overallScore: 84.0,
        scoreBand: ScoreBand.HIGH,
        skillsScore: 88.0,
        experienceScore: 80.0,
        educationScore: 90.0,
        semanticTfidfScore: 82.0,
        certificationScore: 80.0,
        matchedSkills: ['React', 'Node.js'],
        missingSkills: ['PostgreSQL'],
        missingMustHaves: [],
        topMatchingTerms: ['full-stack', 'react', 'node.js', 'database', 'engineering'],
      }
    );
    console.log(`✅ Seeded applications & ATS Scores for Shashimal (Job 1: 88.5%, Job 2: 84.0%)`);
  }

  // 7. Seed pipeline candidate users for Job 1 so Recruiter Pipeline has rich candidates:
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const candidatesData = [
    {
      email: 'alex.turner@example.com',
      firstName: 'Alex',
      lastName: 'Turner',
      role: 'Senior Full-Stack Engineer',
      status: ApplicationStatus.SCREENING,
      score: 94.0,
      band: ScoreBand.HIGH,
      skills: 96,
      exp: 95,
      edu: 90,
      semantic: 92,
      cert: 90,
      matched: ['React', 'TypeScript', 'Node.js', 'GraphQL'],
      missing: [],
      terms: ['react', 'microservices', 'typescript', 'high-throughput', 'node.js'],
    },
    {
      email: 'maria.silva@example.com',
      firstName: 'Maria',
      lastName: 'Silva',
      role: 'Frontend UI/UX Specialist',
      status: ApplicationStatus.APPLIED,
      score: 92.0,
      band: ScoreBand.HIGH,
      skills: 94,
      exp: 90,
      edu: 90,
      semantic: 90,
      cert: 85,
      matched: ['React', 'TypeScript'],
      missing: ['Node.js'],
      terms: ['react', 'frontend', 'tailwind', 'ui/ux', 'responsive'],
    },
    {
      email: 'david.kim@example.com',
      firstName: 'David',
      lastName: 'Kim',
      role: 'Backend Python Developer',
      status: ApplicationStatus.APPLIED,
      score: 64.0,
      band: ScoreBand.MID,
      skills: 55,
      exp: 75,
      edu: 80,
      semantic: 60,
      cert: 50,
      matched: ['Node.js'],
      missing: ['React', 'TypeScript'],
      terms: ['backend', 'python', 'apis', 'databases'],
    },
    {
      email: 'sarah.chen@example.com',
      firstName: 'Sarah',
      lastName: 'Chen',
      role: 'TypeScript Cloud Architect',
      status: ApplicationStatus.INTERVIEW,
      score: 96.5,
      band: ScoreBand.HIGH,
      skills: 98,
      exp: 96,
      edu: 95,
      semantic: 95,
      cert: 95,
      matched: ['React', 'TypeScript', 'Node.js', 'GraphQL'],
      missing: [],
      terms: ['architecture', 'cloud', 'typescript', 'aws', 'scalability'],
    },
    {
      email: 'james.wilson@example.com',
      firstName: 'James',
      lastName: 'Wilson',
      role: 'Senior React Developer',
      status: ApplicationStatus.INTERVIEW,
      score: 84.5,
      band: ScoreBand.HIGH,
      skills: 88,
      exp: 82,
      edu: 85,
      semantic: 82,
      cert: 80,
      matched: ['React', 'TypeScript'],
      missing: ['GraphQL'],
      terms: ['react', 'components', 'typescript', 'web apps'],
    },
  ];

  const pipelineCandidates: Array<{
    id: string;
    name: string;
    role: string;
    score: number;
    stage: string;
  }> = [];

  // Add Shashimal to pipeline list
  if (shashimalApp1) {
    pipelineCandidates.push({
      id: shashimalApp1.id,
      name: 'Shashimal Madhuwantha',
      role: 'Software Engineering Undergraduate — Full-Stack',
      score: 88.5,
      stage: 'Screening',
    });
  }

  for (const c of candidatesData) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: { status: UserStatus.ACTIVE },
      create: {
        email: c.email,
        passwordHash,
        role: UserRole.APPLICANT,
        status: UserStatus.ACTIVE,
      },
    });

    const profile = await prisma.applicantProfile.upsert({
      where: { userId: user.id },
      update: { firstName: c.firstName, lastName: c.lastName },
      create: {
        userId: user.id,
        firstName: c.firstName,
        lastName: c.lastName,
        headline: c.role,
        location: 'Colombo, Sri Lanka',
      },
    });

    const app = await upsertApplicationWithScore(profile.id, job1.id, c.status, {
      overallScore: c.score,
      scoreBand: c.band,
      skillsScore: c.skills,
      experienceScore: c.exp,
      educationScore: c.edu,
      semanticTfidfScore: c.semantic,
      certificationScore: c.cert,
      matchedSkills: c.matched,
      missingSkills: c.missing,
      missingMustHaves: c.missing.filter((m) => m === 'React' || m === 'TypeScript' || m === 'Node.js'),
      topMatchingTerms: c.terms,
    });

    pipelineCandidates.push({
      id: app.id,
      name: `${c.firstName} ${c.lastName}`,
      role: c.role,
      score: c.score,
      stage: c.status === ApplicationStatus.INTERVIEW ? 'Interview' : c.status === ApplicationStatus.SCREENING ? 'Screening' : 'Applied',
    });
  }

  console.log(`\n🎉 Seed completed! Candidates in pipeline:`);
  console.log(JSON.stringify(pipelineCandidates, null, 2));

  console.log(`\nJob 1 ID: ${job1.id}`);
  console.log(`Job 2 ID: ${job2.id}`);
}

main()
  .catch((err) => {
    console.error('Error seeding data:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
