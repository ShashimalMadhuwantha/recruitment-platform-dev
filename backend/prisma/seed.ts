import { PrismaClient, UserRole, UserStatus, ScoreBand } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Seed Super Admin User
  const adminEmail = process.env.ADMIN_INITIAL_EMAIL || 'admin@atsplatform.local';
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'AdminSecurePassword123!';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      superAdminProfile: {
        create: {
          permissions: {
            all: true,
            manageCompanies: true,
            manageUsers: true,
            manageSystemConfig: true,
            viewAnalytics: true,
          },
        },
      },
    },
  });

  console.log(`✅ Super Admin created/verified: ${admin.email}`);

  // 2. Seed Default Global ATS Score Weight Configuration
  const defaultWeightConfig = await prisma.scoreWeightConfig.findFirst({
    where: { isDefault: true },
  });

  if (!defaultWeightConfig) {
    await prisma.scoreWeightConfig.create({
      data: {
        isDefault: true,
        skillsWeight: 0.40,
        experienceWeight: 0.25,
        educationWeight: 0.15,
        semanticWeight: 0.15,
        certificationWeight: 0.05,
      },
    });
    console.log('✅ Default ScoreWeightConfig (40/25/15/15/5) created');
  }

  // 3. Seed Standard Skills Taxonomy
  const standardSkills = [
    { name: 'TypeScript', category: 'Programming Languages', aliasesJson: ['TS', 'Typescript'] },
    { name: 'JavaScript', category: 'Programming Languages', aliasesJson: ['JS', 'ES6', 'ECMAScript'] },
    { name: 'React', category: 'Frontend', aliasesJson: ['ReactJS', 'React.js'] },
    { name: 'Node.js', category: 'Backend', aliasesJson: ['NodeJS', 'Node'] },
    { name: 'Express.js', category: 'Backend', aliasesJson: ['Express', 'ExpressJS'] },
    { name: 'MySQL', category: 'Databases', aliasesJson: ['MySQL Database', 'RDBMS'] },
    { name: 'PostgreSQL', category: 'Databases', aliasesJson: ['Postgres', 'PGSQL'] },
    { name: 'Tailwind CSS', category: 'Frontend', aliasesJson: ['Tailwind', 'TailwindCSS'] },
    { name: 'HTML5', category: 'Frontend', aliasesJson: ['HTML', 'Web Markup'] },
    { name: 'CSS3', category: 'Frontend', aliasesJson: ['CSS', 'Cascading Style Sheets'] },
    { name: 'Git', category: 'DevOps & Tools', aliasesJson: ['GitHub', 'GitLab', 'Version Control'] },
    { name: 'Nginx', category: 'DevOps & Tools', aliasesJson: ['NGINX Web Server'] },
    { name: 'PM2', category: 'DevOps & Tools', aliasesJson: ['Process Manager 2'] },
    { name: 'REST APIs', category: 'Architecture', aliasesJson: ['RESTful APIs', 'API Design'] },
    { name: 'GraphQL', category: 'Architecture', aliasesJson: ['GQL'] },
    { name: 'Python', category: 'Programming Languages', aliasesJson: ['Python 3', 'Py'] },
    { name: 'Data Analysis', category: 'Data Science', aliasesJson: ['Data Analytics'] },
    { name: 'Natural Language Processing', category: 'AI & Data', aliasesJson: ['NLP', 'Text Processing'] },
    { name: 'Unit Testing', category: 'Quality Assurance', aliasesJson: ['Vitest', 'Jest', 'TDD'] },
    { name: 'UI/UX Design', category: 'Design', aliasesJson: ['Figma', 'User Experience'] },
  ];

  for (const skill of standardSkills) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: {},
      create: skill,
    });
  }
  console.log(`✅ Seeded ${standardSkills.length} master taxonomy skills`);

  // 4. Seed Standard Pipeline Stages
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
    const existing = await prisma.pipelineStage.findFirst({
      where: { name: stage.name, jobId: null },
    });
    if (!existing) {
      await prisma.pipelineStage.create({
        data: stage,
      });
    }
  }
  console.log('✅ Seeded default pipeline stages');

  console.log('🎉 Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
