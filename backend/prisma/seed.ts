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
    // Programming Languages
    { name: 'TypeScript', category: 'Programming Languages', aliasesJson: ['TS', 'Typescript'] },
    { name: 'JavaScript', category: 'Programming Languages', aliasesJson: ['JS', 'ES6', 'ECMAScript'] },
    { name: 'Python', category: 'Programming Languages', aliasesJson: ['Python 3', 'Py'] },
    { name: 'Java', category: 'Programming Languages', aliasesJson: ['Java 8', 'Java 17', 'Core Java'] },
    { name: 'C#', category: 'Programming Languages', aliasesJson: ['CSharp', '.NET C#'] },
    { name: 'Go', category: 'Programming Languages', aliasesJson: ['Golang'] },
    { name: 'Rust', category: 'Programming Languages', aliasesJson: ['Rustlang'] },
    { name: 'C++', category: 'Programming Languages', aliasesJson: ['CPP'] },
    { name: 'PHP', category: 'Programming Languages', aliasesJson: ['PHP 8'] },
    { name: 'Ruby', category: 'Programming Languages', aliasesJson: ['Ruby on Rails'] },
    { name: 'Swift', category: 'Programming Languages', aliasesJson: ['Apple Swift', 'iOS Swift'] },
    { name: 'Kotlin', category: 'Programming Languages', aliasesJson: ['Android Kotlin'] },

    // Frontend
    { name: 'React', category: 'Frontend', aliasesJson: ['ReactJS', 'React.js'] },
    { name: 'Next.js', category: 'Frontend', aliasesJson: ['NextJS', 'Next'] },
    { name: 'Vue.js', category: 'Frontend', aliasesJson: ['Vue', 'VueJS', 'Vue 3'] },
    { name: 'Angular', category: 'Frontend', aliasesJson: ['Angular 2+', 'AngularJS'] },
    { name: 'Tailwind CSS', category: 'Frontend', aliasesJson: ['Tailwind', 'TailwindCSS'] },
    { name: 'HTML5', category: 'Frontend', aliasesJson: ['HTML', 'Web Markup'] },
    { name: 'CSS3', category: 'Frontend', aliasesJson: ['CSS', 'Cascading Style Sheets', 'SCSS', 'Sass'] },
    { name: 'Redux', category: 'Frontend', aliasesJson: ['Redux Toolkit', 'RTK'] },
    { name: 'Webpack', category: 'Frontend', aliasesJson: ['Vite', 'Bundling'] },

    // Backend
    { name: 'Node.js', category: 'Backend', aliasesJson: ['NodeJS', 'Node'] },
    { name: 'Express.js', category: 'Backend', aliasesJson: ['Express', 'ExpressJS'] },
    { name: 'NestJS', category: 'Backend', aliasesJson: ['Nest.js'] },
    { name: 'Django', category: 'Backend', aliasesJson: ['Python Django'] },
    { name: 'FastAPI', category: 'Backend', aliasesJson: ['Python FastAPI'] },
    { name: 'Spring Boot', category: 'Backend', aliasesJson: ['Spring Framework', 'Java Spring'] },
    { name: 'ASP.NET Core', category: 'Backend', aliasesJson: ['.NET Core', 'ASP.NET'] },

    // Databases
    { name: 'MySQL', category: 'Databases', aliasesJson: ['MySQL Database', 'RDBMS'] },
    { name: 'PostgreSQL', category: 'Databases', aliasesJson: ['Postgres', 'PGSQL'] },
    { name: 'MongoDB', category: 'Databases', aliasesJson: ['Mongo', 'NoSQL'] },
    { name: 'Redis', category: 'Databases', aliasesJson: ['Redis Cache'] },
    { name: 'Elasticsearch', category: 'Databases', aliasesJson: ['ELK Stack', 'Elastic'] },
    { name: 'DynamoDB', category: 'Databases', aliasesJson: ['AWS DynamoDB'] },
    { name: 'Prisma ORM', category: 'Databases', aliasesJson: ['Prisma'] },

    // DevOps & Tools
    { name: 'Git', category: 'DevOps & Tools', aliasesJson: ['GitHub', 'GitLab', 'Version Control'] },
    { name: 'Docker', category: 'DevOps & Tools', aliasesJson: ['Containerization', 'Docker Compose'] },
    { name: 'Kubernetes', category: 'DevOps & Tools', aliasesJson: ['K8s'] },
    { name: 'CI/CD Pipelines', category: 'DevOps & Tools', aliasesJson: ['GitHub Actions', 'Jenkins', 'GitLab CI'] },
    { name: 'Terraform', category: 'DevOps & Tools', aliasesJson: ['IaC', 'Infrastructure as Code'] },
    { name: 'Nginx', category: 'DevOps & Tools', aliasesJson: ['NGINX Web Server'] },
    { name: 'Linux / Bash', category: 'DevOps & Tools', aliasesJson: ['Shell Scripting', 'Unix'] },

    // Cloud Infrastructure
    { name: 'Amazon Web Services (AWS)', category: 'Cloud Infrastructure', aliasesJson: ['AWS', 'EC2', 'S3', 'Lambda'] },
    { name: 'Microsoft Azure', category: 'Cloud Infrastructure', aliasesJson: ['Azure', 'Azure Cloud'] },
    { name: 'Google Cloud Platform (GCP)', category: 'Cloud Infrastructure', aliasesJson: ['GCP', 'Google Cloud'] },

    // Architecture
    { name: 'REST APIs', category: 'Architecture', aliasesJson: ['RESTful APIs', 'API Design'] },
    { name: 'GraphQL', category: 'Architecture', aliasesJson: ['GQL', 'Apollo GraphQL'] },
    { name: 'Microservices Architecture', category: 'Architecture', aliasesJson: ['Microservices', 'Distributed Systems'] },
    { name: 'Event-Driven Architecture', category: 'Architecture', aliasesJson: ['Kafka', 'RabbitMQ', 'Message Queues'] },
    { name: 'System Design', category: 'Architecture', aliasesJson: ['High Availability', 'Scalability'] },

    // AI & Data
    { name: 'Natural Language Processing', category: 'AI & Data', aliasesJson: ['NLP', 'Text Processing'] },
    { name: 'Machine Learning', category: 'AI & Data', aliasesJson: ['ML', 'Scikit-learn'] },
    { name: 'Deep Learning', category: 'AI & Data', aliasesJson: ['PyTorch', 'TensorFlow', 'Neural Networks'] },
    { name: 'Large Language Models (LLMs)', category: 'AI & Data', aliasesJson: ['LangChain', 'OpenAI', 'Prompt Engineering'] },
    { name: 'Data Analysis', category: 'AI & Data', aliasesJson: ['Data Analytics', 'Pandas', 'NumPy'] },
    { name: 'Data Engineering', category: 'AI & Data', aliasesJson: ['ETL', 'Apache Spark', 'Airflow'] },

    // Quality Assurance
    { name: 'Unit Testing', category: 'Quality Assurance', aliasesJson: ['Vitest', 'Jest', 'TDD'] },
    { name: 'End-to-End Testing (E2E)', category: 'Quality Assurance', aliasesJson: ['Cypress', 'Playwright', 'Selenium'] },
    { name: 'Integration Testing', category: 'Quality Assurance', aliasesJson: ['API Testing', 'Postman'] },

    // Design
    { name: 'UI/UX Design', category: 'Design', aliasesJson: ['Figma', 'User Experience', 'Prototyping'] },
    { name: 'Design Systems', category: 'Design', aliasesJson: ['Storybook', 'Component Libraries'] },

    // Management & Agile
    { name: 'Agile / Scrum', category: 'Management', aliasesJson: ['Scrum', 'Kanban', 'Sprint Planning'] },
    { name: 'Product Management', category: 'Management', aliasesJson: ['PRD', 'Roadmapping', 'User Stories'] },
    { name: 'Technical Leadership', category: 'Management', aliasesJson: ['Team Lead', 'Engineering Manager'] },
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
  // 5. Seed Default Subscription Plans (Free, Pro, Enterprise)
  const defaultPlans = [
    {
      name: 'Free Starter',
      tier: 'FREE' as const,
      maxJobPosts: 3,
      maxSeats: 2,
      maxAtsScans: 50,
      priceMonthly: 0.00,
      featuresJson: {
        customScreeningQuestions: false,
        advancedAtsWeightOverride: false,
        analyticsExport: false,
      },
    },
    {
      name: 'Pro Recruiter',
      tier: 'PRO' as const,
      maxJobPosts: 20,
      maxSeats: 10,
      maxAtsScans: 500,
      priceMonthly: 99.00,
      featuresJson: {
        customScreeningQuestions: true,
        advancedAtsWeightOverride: true,
        analyticsExport: true,
      },
    },
    {
      name: 'Enterprise ATS',
      tier: 'ENTERPRISE' as const,
      maxJobPosts: 9999,
      maxSeats: 100,
      maxAtsScans: 99999,
      priceMonthly: 399.00,
      featuresJson: {
        customScreeningQuestions: true,
        advancedAtsWeightOverride: true,
        analyticsExport: true,
        dedicatedAccountManager: true,
        customIntegrations: true,
      },
    },
  ];

  for (const plan of defaultPlans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: {},
      create: plan,
    });
  }
  console.log(`✅ Seeded ${defaultPlans.length} default subscription plans`);

  // 6. Seed Prohibited / Discriminatory Keywords Dictionary
  const initialBannedKeywords = [
    { keyword: 'recent graduate only', category: 'DISCRIMINATION' as const, severity: 'BLOCK' },
    { keyword: 'young and energetic', category: 'DISCRIMINATION' as const, severity: 'BLOCK' },
    { keyword: 'native english speaker only', category: 'DISCRIMINATION' as const, severity: 'BLOCK' },
    { keyword: 'must provide photo with age', category: 'DISCRIMINATION' as const, severity: 'BLOCK' },
    { keyword: 'single female preferred', category: 'DISCRIMINATION' as const, severity: 'BLOCK' },
    { keyword: 'get rich quick', category: 'SPAM' as const, severity: 'BLOCK' },
    { keyword: 'wire transfer required before start', category: 'SPAM' as const, severity: 'BLOCK' },
    { keyword: 'unpaid mandatory 60hr trial', category: 'MISLEADING' as const, severity: 'WARN' },
  ];

  for (const item of initialBannedKeywords) {
    await prisma.bannedKeyword.upsert({
      where: { keyword: item.keyword },
      update: {},
      create: item,
    });
  }
  console.log(`✅ Seeded ${initialBannedKeywords.length} moderation keywords`);

  // 7. Seed Standard Industries & Locations
  const standardIndustries = [
    { name: 'Information Technology & Services', category: 'Technology' },
    { name: 'Financial Services & Banking', category: 'Finance' },
    { name: 'Healthcare & Life Sciences', category: 'Healthcare' },
    { name: 'E-commerce & Retail', category: 'Retail' },
    { name: 'Education & EdTech', category: 'Education' },
    { name: 'Manufacturing & Engineering', category: 'Engineering' },
  ];

  for (const industry of standardIndustries) {
    await prisma.industry.upsert({
      where: { name: industry.name },
      update: {},
      create: industry,
    });
  }
  console.log(`✅ Seeded ${standardIndustries.length} industries`);

  const standardLocations = [
    { city: 'San Francisco', state: 'CA', country: 'United States', isRemoteAllowed: true },
    { city: 'New York', state: 'NY', country: 'United States', isRemoteAllowed: true },
    { city: 'London', state: 'Greater London', country: 'United Kingdom', isRemoteAllowed: true },
    { city: 'Colombo', state: 'Western Province', country: 'Sri Lanka', isRemoteAllowed: true },
    { city: 'Singapore', state: 'Central', country: 'Singapore', isRemoteAllowed: true },
    { city: 'Berlin', state: 'Berlin', country: 'Germany', isRemoteAllowed: true },
  ];

  for (const loc of standardLocations) {
    await prisma.location.upsert({
      where: {
        city_state_country: {
          city: loc.city,
          state: loc.state,
          country: loc.country,
        },
      },
      update: {},
      create: loc,
    });
  }
  console.log(`✅ Seeded ${standardLocations.length} standard locations`);

  // 8. Seed Notification Templates
  const notificationTemplates = [
    {
      name: 'Candidate Application Received',
      code: 'APP_RECEIVED',
      channel: 'EMAIL' as const,
      subject: 'Application Received: {{job_title}} at {{company_name}}',
      body: 'Hi {{candidate_name}},\n\nThank you for applying for {{job_title}} at {{company_name}}. We have received your application and resume. Our hiring team will review your qualifications and reach out with next steps.\n\nBest regards,\nThe {{company_name}} Recruitment Team',
      variablesJson: ['candidate_name', 'job_title', 'company_name', 'portal_url'],
    },
    {
      name: 'Application Status Stage Update',
      code: 'APP_STAGE_UPDATE',
      channel: 'EMAIL' as const,
      subject: 'Update on your application for {{job_title}}',
      body: 'Dear {{candidate_name}},\n\nYour application status for {{job_title}} at {{company_name}} has been updated to: {{stage_name}}.\n\nYou can track your application status anytime at {{portal_url}}.\n\nSincerely,\n{{company_name}} Hiring Team',
      variablesJson: ['candidate_name', 'job_title', 'company_name', 'stage_name', 'portal_url'],
    },
    {
      name: 'Interview Invitation',
      code: 'INTERVIEW_INVITE',
      channel: 'EMAIL' as const,
      subject: 'Interview Invitation: {{job_title}} with {{company_name}}',
      body: 'Hi {{candidate_name}},\n\nWe are pleased to invite you for an interview for the {{job_title}} position.\n\nInterview Details:\nDate & Time: {{interview_time}}\nType: {{interview_type}}\nLink / Location: {{meeting_link}}\n\nPlease let us know if you have any questions.\n\nBest regards,\n{{recruiter_name}}',
      variablesJson: ['candidate_name', 'job_title', 'company_name', 'interview_time', 'interview_type', 'meeting_link', 'recruiter_name'],
    },
    {
      name: 'Company Account Approved Notice',
      code: 'COMPANY_APPROVED',
      channel: 'EMAIL' as const,
      subject: 'Welcome to ATS Platform - Your Company Account is Approved!',
      body: 'Hello {{admin_name}},\n\nCongratulations! Your company account for {{company_name}} has been approved by the platform administrators.\n\nYou can now log in, post jobs, configure hiring workflows, and screen applicants.\n\nLogin URL: {{portal_url}}/login\n\nWelcome aboard,\nThe Platform Admin Team',
      variablesJson: ['admin_name', 'company_name', 'portal_url'],
    },
    {
      name: 'Official Job Offer Extended',
      code: 'JOB_OFFER_RECEIVED',
      channel: 'EMAIL' as const,
      subject: 'Official Job Offer: {{job_title}} at {{company_name}}',
      body: 'Dear {{candidate_name}},\n\nCongratulations! We are delighted to extend an official offer of employment for the position of {{job_title}} with {{company_name}}.\n\nOffer Summary:\n• Position: {{job_title}}\n• Starting Base Salary: {{base_salary}} ({{currency}})\n• Projected Start Date: {{start_date}}\n• Offer Expiration Date: {{expiration_date}}\n\nPlease log in to your candidate portal to review the complete offer terms, benefits package, and submit your formal acceptance:\n{{portal_url}}\n\nWe are excited about the prospect of you joining our team!\n\nWarm regards,\n{{recruiter_name}}\n{{company_name}} Recruitment Team',
      variablesJson: ['candidate_name', 'job_title', 'company_name', 'base_salary', 'currency', 'start_date', 'expiration_date', 'recruiter_name', 'portal_url'],
    },
    {
      name: 'Candidate Accepted Job Offer',
      code: 'OFFER_ACCEPTED',
      channel: 'EMAIL' as const,
      subject: 'Offer Accepted: {{candidate_name}} - {{job_title}}',
      body: 'Hello {{recruiter_name}},\n\nGreat news! {{candidate_name}} has officially accepted the employment offer for {{job_title}} at {{company_name}}.\n\nOffer Details:\n• Candidate: {{candidate_name}}\n• Position: {{job_title}}\n• Projected Start Date: {{start_date}}\n\nYou can review the signed acceptance and finalize onboarding workflows in the candidate pipeline:\n{{portal_url}}\n\nBest regards,\nRecruitATS Notification Service',
      variablesJson: ['recruiter_name', 'candidate_name', 'job_title', 'company_name', 'start_date', 'portal_url'],
    },
    {
      name: 'Candidate Declined Job Offer',
      code: 'OFFER_DECLINED',
      channel: 'EMAIL' as const,
      subject: 'Offer Declined: {{candidate_name}} - {{job_title}}',
      body: 'Hello {{recruiter_name}},\n\n{{candidate_name}} has declined the employment offer for {{job_title}} at {{company_name}}.\n\nDecline Reason / Feedback:\n"{{decline_reason}}"\n\nYou can review the application history and manage other active pipeline candidates here:\n{{portal_url}}\n\nBest regards,\nRecruitATS Notification Service',
      variablesJson: ['recruiter_name', 'candidate_name', 'job_title', 'company_name', 'decline_reason', 'portal_url'],
    },
    {
      name: 'Welcome to the Team - Candidate Hired',
      code: 'CANDIDATE_HIRED',
      channel: 'EMAIL' as const,
      subject: 'Welcome to {{company_name}}! Congratulations on your new role',
      body: 'Dear {{candidate_name}},\n\nCongratulations and welcome to {{company_name}}!\n\nWe are thrilled to officially welcome you aboard as our new {{job_title}}. Your hiring process has been successfully completed.\n\nKey Details:\n• Position: {{job_title}}\n• Organization: {{company_name}}\n• Start Date: {{start_date}}\n\nOur team will follow up with onboarding instructions, orientation schedules, and workspace setup details. You can view your candidate portal anytime at:\n{{portal_url}}\n\nCongratulations once again on your new role!\n\nWarmest regards,\nThe {{company_name}} Team',
      variablesJson: ['candidate_name', 'job_title', 'company_name', 'start_date', 'portal_url'],
    },
  ];

  for (const template of notificationTemplates) {
    await prisma.notificationTemplate.upsert({
      where: { code: template.code },
      update: {},
      create: template,
    });
  }
  console.log(`✅ Seeded ${notificationTemplates.length} notification templates`);

  // 9. Seed Integration Settings Placeholders
  const integrationSettings = [
    {
      provider: 'SMTP_EMAIL' as const,
      configJson: { host: 'smtp.sendgrid.net', port: 587, fromEmail: 'no-reply@atsplatform.local', fromName: 'Recruiting Platform ATS' },
      status: 'CONNECTED' as const,
    },
    {
      provider: 'GOOGLE_OAUTH' as const,
      configJson: { clientId: 'google-client-id-placeholder.apps.googleusercontent.com', allowedDomains: [] },
      status: 'NOT_CONFIGURED' as const,
    },
    {
      provider: 'LINKEDIN_OAUTH' as const,
      configJson: { clientId: 'linkedin-client-id-placeholder' },
      status: 'NOT_CONFIGURED' as const,
    },
    {
      provider: 'ZOOM_CALENDAR' as const,
      configJson: { zoomApiKey: 'zoom-key-placeholder', calendarSyncEnabled: false },
      status: 'NOT_CONFIGURED' as const,
    },
  ];

  for (const integration of integrationSettings) {
    await prisma.systemIntegrationSetting.upsert({
      where: { provider: integration.provider },
      update: {},
      create: integration,
    });
  }
  console.log(`✅ Seeded ${integrationSettings.length} integration settings`);

  // 10. Seed System Feature Flags & Plan Tier Matrix
  const featureFlags = [
    {
      key: 'ai_ats_scoring',
      name: 'AI-Powered ATS Match Scoring',
      description: 'Enables semantic parsing, skill extraction, and candidate fit matching',
      isGloballyEnabled: true,
      enabledTiersJson: ['PRO', 'ENTERPRISE'],
    },
    {
      key: 'multi_tenant_custom_domain',
      name: 'Company Custom Domain & White-labeling',
      description: 'Allows enterprise employers to host branded career sites on custom subdomains',
      isGloballyEnabled: true,
      enabledTiersJson: ['ENTERPRISE'],
    },
    {
      key: 'advanced_analytics_export',
      name: 'Advanced Pipeline Analytics & CSV/PDF Export',
      description: 'Provides in-depth time-to-hire metrics, stage dropoff stats, and data exports',
      isGloballyEnabled: true,
      enabledTiersJson: ['PRO', 'ENTERPRISE'],
    },
    {
      key: 'direct_candidate_messaging',
      name: 'In-app Direct Messaging with Applicants',
      description: 'Facilitates real-time conversation between recruiters and candidates',
      isGloballyEnabled: true,
      enabledTiersJson: ['FREE', 'PRO', 'ENTERPRISE'],
    },
    {
      key: 'semantic_cv_search',
      name: 'Vector Semantic CV Talent Pool Search',
      description: 'Search entire applicant resume repository using natural language queries',
      isGloballyEnabled: false,
      enabledTiersJson: ['ENTERPRISE'],
    },
  ];

  for (const flag of featureFlags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: {},
      create: flag,
    });
  }
  console.log(`✅ Seeded ${featureFlags.length} system feature flags`);

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
