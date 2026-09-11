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
  console.log('🚀 Seeding 12 diverse published jobs across different recruiters, skills, and areas (Epic 8)...');

  const passwordHash = await bcrypt.hash('RecruiterPass123!', 10);

  // 1. Helper to ensure a Company and Recruiter User
  const ensureCompanyAndRecruiter = async (
    companyName: string,
    slug: string,
    industry: string,
    recruiterEmail: string,
    title: string
  ) => {
    let company = await prisma.company.findFirst({ where: { name: companyName } });
    if (!company) {
      const plan = await prisma.subscriptionPlan.findFirst({ where: { tier: 'ENTERPRISE' } }) 
        || await prisma.subscriptionPlan.findFirst();
      company = await prisma.company.create({
        data: {
          name: companyName,
          slug,
          industry,
          status: 'ACTIVE',
          size: '51-200',
          planId: plan?.id || null,
        },
      });
    }

    let user = await prisma.user.findUnique({
      where: { email: recruiterEmail },
      include: { recruiterProfile: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: recruiterEmail,
          passwordHash,
          role: UserRole.RECRUITER,
          status: UserStatus.ACTIVE,
          recruiterProfile: {
            create: {
              companyId: company.id,
              title,
            },
          },
        },
        include: { recruiterProfile: true },
      });
    } else if (!user.recruiterProfile) {
      await prisma.recruiterProfile.create({
        data: {
          userId: user.id,
          companyId: company.id,
          title,
        },
      });
    }

    return { company, user };
  };

  // Ensure 5 distinct companies & recruiters
  // Company 1: Nibm Technologies (existing Lasindu recruiter)
  const nibmRecruiter = await prisma.user.findUnique({
    where: { email: 'lasinduthemiya96@gmail.com' },
    include: { recruiterProfile: { include: { company: true } } },
  });

  let nibmCompanyId = nibmRecruiter?.recruiterProfile?.companyId;
  let nibmUserId = nibmRecruiter?.id;

  if (!nibmCompanyId || !nibmUserId) {
    const res = await ensureCompanyAndRecruiter(
      'Nibm Technologies',
      'nibm-tech-lk',
      'Information Technology',
      'lasinduthemiya96@gmail.com',
      'Lead Technical Recruiter'
    );
    nibmCompanyId = res.company.id;
    nibmUserId = res.user.id;
  }

  // Company 2: Sysco Labs Sri Lanka
  const sysco = await ensureCompanyAndRecruiter(
    'Sysco Labs Sri Lanka',
    'syscolabs-sl',
    'Enterprise Software & Logistics',
    'recruiter.sysco@syscolabs.local',
    'Senior Talent Acquisition Partner'
  );

  // Company 3: Octa Innovations (AI Studio)
  const octa = await ensureCompanyAndRecruiter(
    'Octa Innovations',
    'octa-innovations-ai',
    'Artificial Intelligence & Data',
    'hiring@octainnovations.io',
    'Head of People & Culture'
  );

  // Company 4: Apex Cloud Solutions
  const apex = await ensureCompanyAndRecruiter(
    'Apex Cloud Solutions',
    'apex-cloud-uk',
    'Cloud Computing & Infrastructure',
    'careers@apexcloud.co',
    'Engineering Hiring Manager'
  );

  // Company 5: FinPeak Digital
  const finpeak = await ensureCompanyAndRecruiter(
    'FinPeak Digital',
    'finpeak-digital-fintech',
    'Financial Technology',
    'recruiting@finpeak.com',
    'VP of Talent Acquisition'
  );

  // 2. Fetch skill IDs lookup map
  const skillsMap: Record<string, string> = {};
  const allSkills = await prisma.skill.findMany();
  for (const s of allSkills) {
    skillsMap[s.name.toLowerCase()] = s.id;
  }

  const getSkillId = (name: string) => skillsMap[name.toLowerCase()] || null;

  // 3. Clear existing applications for candidate Shashimal so they can apply fresh to ANY job!
  const shashimal = await prisma.user.findUnique({
    where: { email: 'shashimalmadhuwantha12@gmail.com' },
    include: { applicantProfile: true },
  });

  if (shashimal?.applicantProfile) {
    const deletedApps = await prisma.application.deleteMany({
      where: { applicantId: shashimal.applicantProfile.id },
    });
    console.log(`🧹 Cleared ${deletedApps.count} existing applications for Shashimal (ready to apply fresh to any vacancy)`);
  }

  // 4. Definitions of the 12 Open Job Vacancies
  const jobDefinitions = [
    // Job 1: Nibm
    {
      id: '36a383f4-4d3f-48a7-a4bb-f527e951c5ea',
      companyId: nibmCompanyId,
      createdById: nibmUserId,
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
      requirementsSummary: '3+ years React/Node.js, TypeScript, PostgreSQL, and GraphQL',
      location: 'Colombo, Western Province, Sri Lanka (Hybrid)',
      employmentType: EmploymentType.FULL_TIME,
      salaryMin: 250000,
      salaryMax: 450000,
      skills: [
        { name: 'React', priority: SkillPriority.MUST_HAVE, minProficiency: 4, weight: 1.0 },
        { name: 'TypeScript', priority: SkillPriority.MUST_HAVE, minProficiency: 4, weight: 1.0 },
        { name: 'Node.js', priority: SkillPriority.MUST_HAVE, minProficiency: 4, weight: 1.0 },
        { name: 'GraphQL', priority: SkillPriority.NICE_TO_HAVE, minProficiency: 3, weight: 0.5 },
      ],
      screeningQuestions: [
        {
          id: 'sq-1',
          question: 'Do you have at least 3 years of commercial experience with React and TypeScript?',
          type: 'boolean',
          requiredAnswer: 'true',
          isKnockout: true,
        },
        {
          id: 'sq-2',
          question: 'Are you authorized to work in Sri Lanka or available for Colombo hybrid working model?',
          type: 'boolean',
          requiredAnswer: 'true',
          isKnockout: true,
        },
        {
          id: 'sq-3',
          question: 'What is your notice period (in days)?',
          type: 'text',
          isKnockout: false,
        },
      ],
    },

    // Job 2: Nibm
    {
      id: '77b21a88-251c-4b68-b80c-99d9804b32c0',
      companyId: nibmCompanyId,
      createdById: nibmUserId,
      title: 'Full Stack React / Node Developer',
      description: `Join our agile product development team building high-performance recruiting and ATS software.

Responsibilities:
• Develop dynamic frontend user experiences with React and Tailwind CSS.
• Build secure REST APIs with Node.js, Express, and PostgreSQL/MySQL.
• Integrate automated CI/CD and unit testing suites.

Requirements:
• 2+ years of full stack software development experience.
• Familiarity with modern TypeScript, React, and relational databases.`,
      requirementsSummary: '2+ years experience in React, Node.js, and SQL',
      location: 'Colombo, Western Province, Sri Lanka',
      employmentType: EmploymentType.FULL_TIME,
      salaryMin: 180000,
      salaryMax: 300000,
      skills: [
        { name: 'React', priority: SkillPriority.MUST_HAVE, minProficiency: 3, weight: 1.0 },
        { name: 'Node.js', priority: SkillPriority.MUST_HAVE, minProficiency: 3, weight: 1.0 },
        { name: 'PostgreSQL', priority: SkillPriority.NICE_TO_HAVE, minProficiency: 3, weight: 0.5 },
      ],
      screeningQuestions: [
        {
          id: 'sq-201',
          question: 'Do you have hands-on experience building web applications with React and Node.js?',
          type: 'boolean',
          requiredAnswer: 'true',
          isKnockout: true,
        },
        {
          id: 'sq-202',
          question: 'What is your expected monthly salary (LKR)?',
          type: 'text',
          isKnockout: false,
        },
      ],
    },

    // Job 3: Octa Innovations (Frontend UI/UX)
    {
      id: 'a1111111-2222-3333-4444-555555555555',
      companyId: octa.company.id,
      createdById: octa.user.id,
      title: 'Frontend UI/UX Specialist (React & Tailwind CSS)',
      description: `We are looking for a creative and detail-oriented Frontend Developer to craft beautiful user interfaces for our AI-powered platforms.

Key Responsibilities:
• Build modern, responsive, and pixel-perfect web interfaces using React and Tailwind CSS.
• Collaborate closely with product managers and UX designers to build intuitive design systems.
• Optimize application speed, accessibility, and cross-browser responsiveness.

Qualifications:
• 2+ years of experience with React, TypeScript, HTML5, and Tailwind CSS.
• Strong aesthetic eye for modern micro-interactions, dark modes, and typography.`,
      requirementsSummary: 'React, Tailwind CSS, TypeScript, UI/UX Design principles',
      location: 'Remote (Global)',
      employmentType: EmploymentType.REMOTE,
      salaryMin: 220000,
      salaryMax: 380000,
      skills: [
        { name: 'React', priority: SkillPriority.MUST_HAVE, minProficiency: 4, weight: 1.0 },
        { name: 'Tailwind CSS', priority: SkillPriority.MUST_HAVE, minProficiency: 4, weight: 1.0 },
        { name: 'TypeScript', priority: SkillPriority.MUST_HAVE, minProficiency: 3, weight: 1.0 },
        { name: 'UI/UX Design', priority: SkillPriority.NICE_TO_HAVE, minProficiency: 3, weight: 0.5 },
      ],
      screeningQuestions: [
        {
          id: 'sq-301',
          question: 'Do you have commercial experience with React, Tailwind CSS, and Design Systems?',
          type: 'boolean',
          requiredAnswer: 'true',
          isKnockout: true,
        },
        {
          id: 'sq-302',
          question: 'Can you provide a link to your online portfolio or GitHub profile?',
          type: 'text',
          isKnockout: false,
        },
      ],
    },

    // Job 4: Nibm (Associate Full Stack)
    {
      id: 'b2222222-3333-4444-5555-666666666666',
      companyId: nibmCompanyId,
      createdById: nibmUserId,
      title: 'Associate Software Engineer (Full Stack)',
      description: `An exciting opportunity for emerging talent or recent graduates looking to launch their career in a high-growth tech environment.

What you will do:
• Work alongside senior engineers to design and ship customer-facing web features.
• Write unit tests and maintain clean codebase standards.
• Learn modern devops, database design, and automated CI/CD practices.

Requirements:
• Foundational knowledge of JavaScript, React, Node.js, and SQL.
• Passion for learning, problem solving, and building great products.`,
      requirementsSummary: 'Degree or Diploma in Software Engineering, JavaScript, React, SQL',
      location: 'Galle / Colombo, Sri Lanka (Hybrid)',
      employmentType: EmploymentType.FULL_TIME,
      salaryMin: 120000,
      salaryMax: 200000,
      skills: [
        { name: 'JavaScript', priority: SkillPriority.MUST_HAVE, minProficiency: 3, weight: 1.0 },
        { name: 'React', priority: SkillPriority.MUST_HAVE, minProficiency: 3, weight: 1.0 },
        { name: 'Software Engineering', priority: SkillPriority.MUST_HAVE, minProficiency: 3, weight: 1.0 },
        { name: 'SQL', priority: SkillPriority.NICE_TO_HAVE, minProficiency: 2, weight: 0.5 },
      ],
      screeningQuestions: [
        {
          id: 'sq-401',
          question: 'Do you hold a Degree or Higher Diploma in Software Engineering / Computer Science?',
          type: 'boolean',
          requiredAnswer: 'true',
          isKnockout: true,
        },
        {
          id: 'sq-402',
          question: 'Are you available to join within 30 days?',
          type: 'boolean',
          requiredAnswer: 'true',
          isKnockout: false,
        },
      ],
    },

    // Job 5: Octa Innovations (AI / Python)
    {
      id: 'c3333333-4444-5555-6666-777777777777',
      companyId: octa.company.id,
      createdById: octa.user.id,
      title: 'Python & AI / Machine Learning Engineer',
      description: `Octa Innovations is seeking an AI/ML Engineer to develop natural language processing and semantic recommendation algorithms for automated talent intelligence.

Responsibilities:
• Train, fine-tune, and deploy transformer-based LLMs and semantic search models.
• Architect scalable Python data pipelines and RESTful microservices.
• Optimize model inference latency for real-time scoring.

Requirements:
• 3+ years experience with Python, Machine Learning, and NLP.
• Hands-on familiarity with PyTorch, TF-IDF, vector embeddings, and Docker.`,
      requirementsSummary: 'Python, Machine Learning, Deep Learning, REST APIs, Vector Search',
      location: 'Singapore / Remote',
      employmentType: EmploymentType.REMOTE,
      salaryMin: 350000,
      salaryMax: 650000,
      skills: [
        { name: 'Python', priority: SkillPriority.MUST_HAVE, minProficiency: 4, weight: 1.0 },
        { name: 'Machine Learning', priority: SkillPriority.MUST_HAVE, minProficiency: 4, weight: 1.0 },
        { name: 'Deep Learning', priority: SkillPriority.MUST_HAVE, minProficiency: 3, weight: 1.0 },
        { name: 'REST APIs', priority: SkillPriority.NICE_TO_HAVE, minProficiency: 3, weight: 0.5 },
      ],
      screeningQuestions: [
        {
          id: 'sq-501',
          question: 'Have you built and deployed machine learning or NLP models into production systems?',
          type: 'boolean',
          requiredAnswer: 'true',
          isKnockout: true,
        },
        {
          id: 'sq-502',
          question: 'Please share your GitHub, HuggingFace, or Kaggle profile link:',
          type: 'text',
          isKnockout: false,
        },
      ],
    },

    // Job 6: Apex Cloud Solutions (DevOps / AWS)
    {
      id: 'd4444444-5555-6666-7777-888888888888',
      companyId: apex.company.id,
      createdById: apex.user.id,
      title: 'Senior Cloud & DevOps Architect (AWS / Kubernetes)',
      description: `Lead our cloud infrastructure modernization efforts across multi-region Kubernetes clusters.

What you will do:
• Build resilient Infrastructure as Code (IaC) using Terraform.
• Manage automated CI/CD deployment pipelines with Git, Docker, and Kubernetes.
• Ensure zero-downtime high availability, security hardening, and observability.

Requirements:
• 4+ years of cloud architecture experience with AWS and container orchestration.
• Proven expertise with Kubernetes, Terraform, Docker, and Linux systems.`,
      requirementsSummary: 'AWS, Kubernetes, Docker, Terraform, Linux/Bash, CI/CD',
      location: 'London, Greater London, United Kingdom (Remote Eligible)',
      employmentType: EmploymentType.REMOTE,
      salaryMin: 500000,
      salaryMax: 850000,
      skills: [
        { name: 'AWS', priority: SkillPriority.MUST_HAVE, minProficiency: 4, weight: 1.0 },
        { name: 'Kubernetes', priority: SkillPriority.MUST_HAVE, minProficiency: 4, weight: 1.0 },
        { name: 'Docker', priority: SkillPriority.MUST_HAVE, minProficiency: 4, weight: 1.0 },
        { name: 'Terraform', priority: SkillPriority.NICE_TO_HAVE, minProficiency: 3, weight: 0.5 },
      ],
      screeningQuestions: [
        {
          id: 'sq-601',
          question: 'Do you hold an active AWS Certified Solutions Architect or equivalent certification?',
          type: 'boolean',
          requiredAnswer: 'true',
          isKnockout: true,
        },
        {
          id: 'sq-602',
          question: 'Do you have hands-on experience managing production Kubernetes (EKS/GKE) clusters?',
          type: 'boolean',
          requiredAnswer: 'true',
          isKnockout: true,
        },
      ],
    },

    // Job 7: FinPeak Digital (Java / Spring Boot)
    {
      id: 'e5555555-6666-7777-8888-999999999999',
      companyId: finpeak.company.id,
      createdById: finpeak.user.id,
      title: 'Backend Java & Spring Boot Microservices Developer',
      description: `Join FinPeak Digital's core banking engineering team building high-throughput payment transaction processors.

Responsibilities:
• Architect resilient, fault-tolerant microservices with Java and Spring Boot.
• Optimize high-volume transactional MySQL/PostgreSQL databases.
• Integrate distributed event messaging and cache layers.

Requirements:
• 3+ years enterprise development experience with Core Java and Spring Boot.
• Solid background in relational databases, SQL tuning, and secure API design.`,
      requirementsSummary: 'Java 17, Spring Boot, Microservices, MySQL, REST APIs',
      location: 'Colombo, Western Province, Sri Lanka',
      employmentType: EmploymentType.FULL_TIME,
      salaryMin: 280000,
      salaryMax: 480000,
      skills: [
        { name: 'Java', priority: SkillPriority.MUST_HAVE, minProficiency: 4, weight: 1.0 },
        { name: 'Spring Boot', priority: SkillPriority.MUST_HAVE, minProficiency: 4, weight: 1.0 },
        { name: 'Microservices Architecture', priority: SkillPriority.MUST_HAVE, minProficiency: 3, weight: 1.0 },
        { name: 'MySQL', priority: SkillPriority.NICE_TO_HAVE, minProficiency: 3, weight: 0.5 },
      ],
      screeningQuestions: [
        {
          id: 'sq-701',
          question: 'Do you have at least 2 years of enterprise experience with Java and Spring Boot?',
          type: 'boolean',
          requiredAnswer: 'true',
          isKnockout: true,
        },
        {
          id: 'sq-702',
          question: 'Are you comfortable working in a regulated financial services environment?',
          type: 'boolean',
          requiredAnswer: 'true',
          isKnockout: false,
        },
      ],
    },

    // Job 8: FinPeak Digital (Mobile / React Native)
    {
      id: 'f6666666-7777-8888-9999-000000000000',
      companyId: finpeak.company.id,
      createdById: finpeak.user.id,
      title: 'Mobile Application Engineer (React Native & Mobile)',
      description: `We are seeking an energetic Mobile Developer to lead development of our next-generation consumer digital wallet mobile application.

Responsibilities:
• Build performant cross-platform mobile apps for iOS and Android using React Native.
• Integrate biometric authentication, push notifications, and offline data sync.
• Ensure native fluid animations and 60fps user experience.

Requirements:
• 2+ years of mobile engineering experience with React Native and JavaScript/TypeScript.
• Familiarity with App Store & Google Play submission cycles.`,
      requirementsSummary: 'React Native, TypeScript, Mobile UI, State Management, REST APIs',
      location: 'Kandy, Central Province, Sri Lanka (Hybrid)',
      employmentType: EmploymentType.FULL_TIME,
      salaryMin: 200000,
      salaryMax: 360000,
      skills: [
        { name: 'React', priority: SkillPriority.MUST_HAVE, minProficiency: 4, weight: 1.0 },
        { name: 'TypeScript', priority: SkillPriority.MUST_HAVE, minProficiency: 3, weight: 1.0 },
        { name: 'JavaScript', priority: SkillPriority.MUST_HAVE, minProficiency: 4, weight: 1.0 },
      ],
      screeningQuestions: [
        {
          id: 'sq-801',
          question: 'Have you published at least one React Native app to the Google Play Store or Apple App Store?',
          type: 'boolean',
          requiredAnswer: 'true',
          isKnockout: true,
        },
        {
          id: 'sq-802',
          question: 'Are you open to hybrid work at our Kandy or Colombo technology center?',
          type: 'boolean',
          requiredAnswer: 'true',
          isKnockout: false,
        },
      ],
    },

    // Job 9: Sysco Labs Sri Lanka (Data Engineering)
    {
      id: '11111111-aaaa-bbbb-cccc-dddddddddddd',
      companyId: sysco.company.id,
      createdById: sysco.user.id,
      title: 'Data Engineer (Python, SQL & Data Pipelines)',
      description: `Sysco Labs is expanding its enterprise data intelligence team to build reliable analytical data pipelines.

Key Responsibilities:
• Build and orchestrate robust ETL/ELT pipelines using Python and SQL.
• Maintain data warehouse schemas and ensure optimal query performance on multi-terabyte datasets.
• Collaborate with business intelligence analysts to serve clean, verified operational metrics.

Requirements:
• 2+ years of data engineering experience with SQL, Python, and relational/analytical databases.
• Strong understanding of data modeling, indexing, and pipeline monitoring.`,
      requirementsSummary: 'Python, SQL, PostgreSQL, Data Engineering, ETL Pipelines',
      location: 'Colombo, Western Province, Sri Lanka',
      employmentType: EmploymentType.FULL_TIME,
      salaryMin: 240000,
      salaryMax: 420000,
      skills: [
        { name: 'Python', priority: SkillPriority.MUST_HAVE, minProficiency: 4, weight: 1.0 },
        { name: 'SQL', priority: SkillPriority.MUST_HAVE, minProficiency: 4, weight: 1.0 },
        { name: 'PostgreSQL', priority: SkillPriority.MUST_HAVE, minProficiency: 3, weight: 1.0 },
        { name: 'Data Engineering', priority: SkillPriority.NICE_TO_HAVE, minProficiency: 3, weight: 0.5 },
      ],
      screeningQuestions: [
        {
          id: 'sq-901',
          question: 'Do you have hands-on experience building automated data transformation (ETL) pipelines?',
          type: 'boolean',
          requiredAnswer: 'true',
          isKnockout: true,
        },
        {
          id: 'sq-902',
          question: 'What is your current notice period in days?',
          type: 'text',
          isKnockout: false,
        },
      ],
    },

    // Job 10: Sysco Labs Sri Lanka (QA Automation)
    {
      id: '22222222-bbbb-cccc-dddd-eeeeeeeeeeee',
      companyId: sysco.company.id,
      createdById: sysco.user.id,
      title: 'QA Automation Engineer (Playwright & E2E Testing)',
      description: `Ensure the utmost reliability and performance of our mission-critical logistics software suite.

Responsibilities:
• Design and maintain end-to-end (E2E) automated regression test suites using Playwright and TypeScript.
• Integrate automated test runners into GitHub Actions CI/CD pipelines.
• Perform defect triaging, test case authoring, and API load testing.

Requirements:
• 2+ years in automated software testing with modern JavaScript/TypeScript test frameworks.
• Deep understanding of REST API validation and web test automation.`,
      requirementsSummary: 'Playwright, TypeScript, End-to-End Testing, Unit Testing, CI/CD',
      location: 'Colombo, Sri Lanka (Hybrid)',
      employmentType: EmploymentType.FULL_TIME,
      salaryMin: 190000,
      salaryMax: 320000,
      skills: [
        { name: 'End-to-End Testing (E2E)', priority: SkillPriority.MUST_HAVE, minProficiency: 4, weight: 1.0 },
        { name: 'TypeScript', priority: SkillPriority.MUST_HAVE, minProficiency: 3, weight: 1.0 },
        { name: 'Unit Testing', priority: SkillPriority.MUST_HAVE, minProficiency: 3, weight: 1.0 },
        { name: 'Integration Testing', priority: SkillPriority.NICE_TO_HAVE, minProficiency: 3, weight: 0.5 },
      ],
      screeningQuestions: [
        {
          id: 'sq-1001',
          question: 'Do you have experience writing automated E2E test scripts with Playwright, Cypress, or Selenium?',
          type: 'boolean',
          requiredAnswer: 'true',
          isKnockout: true,
        },
        {
          id: 'sq-1002',
          question: 'Are you available to work from our Colombo office on designated hybrid days?',
          type: 'boolean',
          requiredAnswer: 'true',
          isKnockout: false,
        },
      ],
    },

    // Job 11: Apex Cloud Solutions (Go / Microservices)
    {
      id: '33333333-cccc-dddd-eeee-ffffffffffff',
      companyId: apex.company.id,
      createdById: apex.user.id,
      title: 'Lead Go / Golang Backend Architect',
      description: `Apex Cloud Solutions is building ultra-low-latency distributed networking microservices in Go.

What you will do:
• Architect and implement distributed microservices handling millions of concurrent requests.
• Optimize memory footprints, Goroutine concurrency patterns, and network I/O.
• Collaborate with infrastructure engineers to deploy on AWS and Kubernetes.

Requirements:
• 4+ years of professional backend software development with at least 2 years dedicated in Go.
• Deep knowledge of event-driven architectures, Redis caching, and Docker.`,
      requirementsSummary: 'Go (Golang), Microservices, REST APIs, Docker, Redis, Concurrency',
      location: 'New York, NY (Remote)',
      employmentType: EmploymentType.REMOTE,
      salaryMin: 450000,
      salaryMax: 750000,
      skills: [
        { name: 'Go', priority: SkillPriority.MUST_HAVE, minProficiency: 4, weight: 1.0 },
        { name: 'Microservices Architecture', priority: SkillPriority.MUST_HAVE, minProficiency: 4, weight: 1.0 },
        { name: 'Docker', priority: SkillPriority.MUST_HAVE, minProficiency: 3, weight: 1.0 },
        { name: 'REST APIs', priority: SkillPriority.NICE_TO_HAVE, minProficiency: 3, weight: 0.5 },
      ],
      screeningQuestions: [
        {
          id: 'sq-1101',
          question: 'Do you have at least 2 years of production experience writing high-performance backend systems in Go?',
          type: 'boolean',
          requiredAnswer: 'true',
          isKnockout: true,
        },
        {
          id: 'sq-1102',
          question: 'Are you comfortable collaborating with a distributed engineering team across US and EU time zones?',
          type: 'boolean',
          requiredAnswer: 'true',
          isKnockout: false,
        },
      ],
    },

    // Job 12: Sysco Labs Sri Lanka (Software Engineering Intern)
    {
      id: '44444444-dddd-eeee-ffff-000000000000',
      companyId: sysco.company.id,
      createdById: sysco.user.id,
      title: 'Software Engineering Intern (Undergraduate / Fresh Graduate)',
      description: `Kickstart your software engineering career with an immersive 6-month internship at Sysco Labs!

What you will learn & contribute:
• Work on real-world web applications used by thousands of businesses worldwide.
• Pair with experienced mentors on frontend (React) and backend (Node/Python) features.
• Participate in Agile sprint ceremonies, code reviews, and automated testing workshops.

Requirements:
• Undergraduate or recent graduate in Computer Science, Software Engineering, or related field.
• Hands-on familiarity with JavaScript, HTML, CSS, and basic programming concepts.`,
      requirementsSummary: 'Undergraduate Internship, JavaScript, React, Python, HTML/CSS',
      location: 'Colombo, Western Province, Sri Lanka',
      employmentType: EmploymentType.INTERNSHIP,
      salaryMin: 60000,
      salaryMax: 90000,
      skills: [
        { name: 'JavaScript', priority: SkillPriority.MUST_HAVE, minProficiency: 3, weight: 1.0 },
        { name: 'React', priority: SkillPriority.MUST_HAVE, minProficiency: 2, weight: 1.0 },
        { name: 'Python', priority: SkillPriority.NICE_TO_HAVE, minProficiency: 2, weight: 0.5 },
        { name: 'HTML5', priority: SkillPriority.MUST_HAVE, minProficiency: 3, weight: 0.5 },
      ],
      screeningQuestions: [
        {
          id: 'sq-1201',
          question: 'Are you currently pursuing or recently completed an undergraduate degree or diploma in Software Engineering / IT?',
          type: 'boolean',
          requiredAnswer: 'true',
          isKnockout: true,
        },
        {
          id: 'sq-1202',
          question: 'Are you available for a full-time 6-month continuous internship in Colombo?',
          type: 'boolean',
          requiredAnswer: 'true',
          isKnockout: true,
        },
      ],
    },
  ];

  // 5. Upsert all 12 jobs and their skills
  for (const def of jobDefinitions) {
    await prisma.jobVacancy.upsert({
      where: { id: def.id },
      update: {
        title: def.title,
        description: def.description,
        requirementsSummary: def.requirementsSummary,
        location: def.location,
        employmentType: def.employmentType,
        salaryMin: def.salaryMin,
        salaryMax: def.salaryMax,
        status: JobStatus.PUBLISHED,
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        screeningQuestionsJson: def.screeningQuestions,
      },
      create: {
        id: def.id,
        companyId: def.companyId,
        createdById: def.createdById,
        title: def.title,
        description: def.description,
        requirementsSummary: def.requirementsSummary,
        location: def.location,
        employmentType: def.employmentType,
        salaryMin: def.salaryMin,
        salaryMax: def.salaryMax,
        status: JobStatus.PUBLISHED,
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        screeningQuestionsJson: def.screeningQuestions,
      },
    });

    for (const s of def.skills) {
      const sId = getSkillId(s.name);
      if (sId) {
        await prisma.jobRequiredSkill.upsert({
          where: { jobId_skillId: { jobId: def.id, skillId: sId } },
          update: { priority: s.priority, minProficiency: s.minProficiency, weight: s.weight },
          create: { jobId: def.id, skillId: sId, priority: s.priority, minProficiency: s.minProficiency, weight: s.weight },
        });
      }
    }
  }

  // 6. Ensure other demo candidates (Alex Turner, Maria Silva, etc.) are in Job 1 for recruiter pipeline testing
  const upsertCandidate = async (
    email: string,
    firstName: string,
    lastName: string,
    headline: string,
    jobId: string,
    status: ApplicationStatus,
    score: number,
    band: ScoreBand
  ) => {
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          role: UserRole.APPLICANT,
          status: UserStatus.ACTIVE,
          applicantProfile: {
            create: {
              firstName,
              lastName,
              headline,
              summary: `${headline} with solid engineering experience.`,
            },
          },
        },
      });
    }

    const profile = await prisma.applicantProfile.findUnique({ where: { userId: user.id } });
    if (!profile) return;

    let app = await prisma.application.findUnique({
      where: { applicantId_jobId: { applicantId: profile.id, jobId } },
    });

    if (!app) {
      app = await prisma.application.create({
        data: {
          applicantId: profile.id,
          jobId,
          status,
          appliedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      });
    }

    await prisma.aTSScore.upsert({
      where: { applicationId: app.id },
      update: {
        overallScore: score,
        scoreBand: band,
        skillsScore: score - 2,
        experienceScore: score - 4,
        educationScore: 90,
        semanticTfidfScore: score - 5,
        certificationScore: 80,
      },
      create: {
        applicationId: app.id,
        overallScore: score,
        scoreBand: band,
        skillsScore: score - 2,
        experienceScore: score - 4,
        educationScore: 90,
        semanticTfidfScore: score - 5,
        certificationScore: 80,
        breakdownJson: {
          bandLabel: band === 'HIGH' ? 'Strong match' : 'Moderate match',
          scoreBand: band,
          overallScore: score,
        },
      },
    });
  };

  await upsertCandidate('alex.turner@example.com', 'Alex', 'Turner', 'Senior Full-Stack Engineer', jobDefinitions[0].id, ApplicationStatus.SCREENING, 94.0, ScoreBand.HIGH);
  await upsertCandidate('maria.silva@example.com', 'Maria', 'Silva', 'Frontend UI/UX Specialist', jobDefinitions[0].id, ApplicationStatus.APPLIED, 92.0, ScoreBand.HIGH);
  await upsertCandidate('sarah.chen@example.com', 'Sarah', 'Chen', 'TypeScript Cloud Architect', jobDefinitions[0].id, ApplicationStatus.INTERVIEW, 96.5, ScoreBand.HIGH);

  console.log(`\n🎉 SEED OF 12 JOBS COMPLETED SUCCESSFULLY!`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🏢 COMPANIES & RECRUITERS INCLUDED:`);
  console.log(`1. Nibm Technologies (Recruiter: lasinduthemiya96@gmail.com)`);
  console.log(`2. Sysco Labs Sri Lanka (Recruiter: recruiter.sysco@syscolabs.local)`);
  console.log(`3. Octa Innovations (Recruiter: hiring@octainnovations.io)`);
  console.log(`4. Apex Cloud Solutions (Recruiter: careers@apexcloud.co)`);
  console.log(`5. FinPeak Digital (Recruiter: recruiting@finpeak.com)`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📋 12 OPEN PUBLISHED JOBS (ALL WITH SCREENING QUESTIONS):`);
  jobDefinitions.forEach((j, i) => {
    console.log(` ${i + 1}. [${j.employmentType}] ${j.title} — ${j.location} (ID: ${j.id})`);
  });
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`👉 Shashimal (shashimalmadhuwantha12@gmail.com) currently has 0 applications!`);
  console.log(`👉 You can now search by keyword, filter by location/remote, view details, preview scores, and apply!`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
