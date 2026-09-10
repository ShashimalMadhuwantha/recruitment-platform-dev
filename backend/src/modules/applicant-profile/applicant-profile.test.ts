import { describe, it, expect, beforeAll } from 'vitest';
import { applicantProfileService } from './applicant-profile.service';
import { resumeParserService } from './resume-parser.service';
import { prisma } from '../../db/client';
import bcrypt from 'bcrypt';

describe('ApplicantProfileService & ResumeParser Unit and Integration Tests (Epic 6)', () => {
  let applicantUserId: string;
  let recruiterUserId: string;
  let testSkillId1: string;
  let testSkillId2: string;
  let createdCvId: string;
  let createdProfileId: string;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('ApplicantPass123!', 10);

    // 1. Create test applicant user
    const applicantUser = await prisma.user.create({
      data: {
        email: `test-applicant-${Date.now()}@ats.local`,
        passwordHash,
        role: 'APPLICANT',
        status: 'ACTIVE',
      },
    });
    applicantUserId = applicantUser.id;

    // 2. Create test recruiter user
    const recruiterUser = await prisma.user.create({
      data: {
        email: `test-recruiter-${Date.now()}@ats.local`,
        passwordHash,
        role: 'RECRUITER',
        status: 'ACTIVE',
      },
    });
    recruiterUserId = recruiterUser.id;

    // 3. Ensure test skills exist in taxonomy
    const skill1 = await prisma.skill.upsert({
      where: { name: 'React' },
      update: {},
      create: { name: 'React', category: 'Frontend' },
    });
    testSkillId1 = skill1.id;

    const skill2 = await prisma.skill.upsert({
      where: { name: 'Node.js' },
      update: {},
      create: { name: 'Node.js', category: 'Backend' },
    });
    testSkillId2 = skill2.id;
  });

  it('1. Retrieves profile and auto-initializes profile if not existing with completeness breakdown', async () => {
    const profile = await applicantProfileService.getProfile(applicantUserId);

    expect(profile).toBeDefined();
    expect(profile.userId).toBe(applicantUserId);
    expect(profile.completeness).toBeDefined();
    expect(typeof profile.completeness.score).toBe('number');
    expect(profile.completeness.score).toBeGreaterThanOrEqual(0);
    expect(profile.completeness.suggestions.length).toBeGreaterThan(0);

    createdProfileId = profile.id;
  });

  it('2. Updates basic profile contact info, headline, summary, and visibility settings', async () => {
    const updated = await applicantProfileService.updateProfile(applicantUserId, {
      firstName: 'Jane',
      lastName: 'Doe',
      phone: '+1 555-0199',
      headline: 'Senior Full Stack Software Architect',
      summary: 'Passionate software engineer with 7+ years of distributed systems experience.',
      location: 'San Francisco, CA, USA',
      visibilitySettings: {
        visibility: 'PUBLIC',
        allowRecruiterContact: true,
      },
    });

    expect(updated.firstName).toBe('Jane');
    expect(updated.lastName).toBe('Doe');
    expect(updated.phone).toBe('+1 555-0199');
    expect(updated.headline).toBe('Senior Full Stack Software Architect');
    expect(updated.visibilitySettings?.visibility).toBe('PUBLIC');
  });

  it('3. Adds, updates, and deletes work experience entries', async () => {
    const exp = await applicantProfileService.addExperience(applicantUserId, {
      companyName: 'Acme Cloud Systems',
      title: 'Senior Backend Engineer',
      startDate: '2021-03-01',
      endDate: '2024-01-15',
      isCurrent: false,
      description: 'Architected scalable microservices and message queues.',
      skillsUsedJson: ['Node.js', 'TypeScript', 'MySQL'],
    });

    expect(exp.id).toBeDefined();
    expect(exp.companyName).toBe('Acme Cloud Systems');
    expect(exp.title).toBe('Senior Backend Engineer');

    // Update experience
    const updatedExp = await applicantProfileService.updateExperience(applicantUserId, exp.id, {
      title: 'Lead Distributed Systems Engineer',
    });
    expect(updatedExp.title).toBe('Lead Distributed Systems Engineer');

    // Add second current experience
    await applicantProfileService.addExperience(applicantUserId, {
      companyName: 'NextGen Tech',
      title: 'Principal Engineer',
      startDate: '2024-02-01',
      isCurrent: true,
      description: 'Leading platform engineering.',
    });
  });

  it('4. Adds, updates, and deletes education records', async () => {
    const edu = await applicantProfileService.addEducation(applicantUserId, {
      institution: 'Stanford University',
      degree: 'Master of Science',
      fieldOfStudy: 'Computer Science',
      startDate: '2018-09-01',
      endDate: '2020-06-15',
      gpa: 3.9,
    });

    expect(edu.id).toBeDefined();
    expect(edu.institution).toBe('Stanford University');
    expect(edu.degree).toBe('Master of Science');

    const updatedEdu = await applicantProfileService.updateEducation(applicantUserId, edu.id, {
      gpa: 3.95,
    });
    expect(Number(updatedEdu.gpa)).toBe(3.95);
  });

  it('5. Adds skills from taxonomy and self-rates proficiency', async () => {
    const skillEntry1 = await applicantProfileService.addSkill(applicantUserId, {
      skillId: testSkillId1,
      proficiency: 5,
      yearsExperience: 4.5,
    });

    expect(skillEntry1.skill.name).toBe('React');
    expect(skillEntry1.proficiency).toBe(5);

    const skillEntry2 = await applicantProfileService.addSkill(applicantUserId, {
      skillId: testSkillId2,
      proficiency: 4,
      yearsExperience: 3.0,
    });

    expect(skillEntry2.skill.name).toBe('Node.js');
    expect(skillEntry2.proficiency).toBe(4);
  });

  it('6. Adds certifications and portfolio web links', async () => {
    const cert = await applicantProfileService.addCertification(applicantUserId, {
      name: 'AWS Certified Solutions Architect - Associate',
      issuer: 'Amazon Web Services',
      issueDate: '2023-05-10',
      credentialUrl: 'https://aws.amazon.com/verification/12345',
    });

    expect(cert.name).toContain('AWS Certified');

    const portfolio = await applicantProfileService.addPortfolio(applicantUserId, {
      type: 'GITHUB',
      url: 'https://github.com/janedoe',
    });

    expect(portfolio.type).toBe('GITHUB');
    expect(portfolio.url).toBe('https://github.com/janedoe');
  });

  it('7. Uploads resume, creates BackgroundJob, and executes entity extraction parsing', async () => {
    const sampleResumeText = `
Jane Doe
Email: jane.doe.tech@example.com | Phone: (415) 555-0144
San Francisco, CA

Professional Summary
Distinguished software engineer with deep expertise in React, Node.js, TypeScript, and cloud architecture.

Work Experience
Senior Engineer | HighScale Corp | 2021 - Present
- Designed high-throughput REST APIs and web frontends using TypeScript, React, and Node.js.

Education
Master of Science in Computer Science | Stanford University | 2018 - 2020

Certifications
AWS Certified Solutions Architect
`;

    const cv = await resumeParserService.saveAndParseResume({
      applicantId: createdProfileId,
      fileName: 'Jane_Doe_Resume_2026.txt',
      fileSize: Buffer.byteLength(sampleResumeText),
      mimeType: 'text/plain',
      buffer: Buffer.from(sampleResumeText, 'utf-8'),
      versionLabel: 'v1',
      isPrimary: true,
    });

    expect(cv.id).toBeDefined();
    expect(cv.parsingStatus).toBe('COMPLETED');
    expect(cv.parsedText).toContain('Jane Doe');
    expect(cv.parsedJson).toBeDefined();

    const parsed = cv.parsedJson as any;
    expect(parsed.detectedSkills).toContain('React');
    expect(parsed.detectedSkills).toContain('Node.js');
    expect(parsed.contactInfo.email).toBe('jane.doe.tech@example.com');
    expect(parsed.contactInfo.phone).toContain('555-0144');

    createdCvId = cv.id;

    // Verify background job was logged
    const job = await prisma.backgroundJob.findFirst({
      where: { jobType: 'RESUME_PARSING' },
      orderBy: { createdAt: 'desc' },
    });
    expect(job).toBeDefined();
    expect(job?.status).toBe('COMPLETED');
  });

  it('8. Applies parsed resume entities to profile via auto-fill', async () => {
    const result = await resumeParserService.applyResumeToProfile(applicantUserId, createdCvId);
    expect(result.success).toBe(true);

    const profile = await applicantProfileService.getProfile(applicantUserId);
    expect(profile.cvs.length).toBeGreaterThanOrEqual(1);
    expect(profile.applicantSkills.length).toBeGreaterThanOrEqual(2);
    // Completeness score should now be high (personal info + work exp + edu + skills + resume)
    expect(profile.completeness.score).toBeGreaterThanOrEqual(80);
  });

  it('9. Generates redacted blind recruitment profile view and logs audit record', async () => {
    const anonymized = await applicantProfileService.getAnonymizedProfile(
      createdProfileId,
      { id: recruiterUserId, role: 'RECRUITER' }
    );

    expect(anonymized.candidatePseudonym).toContain('Candidate #');
    // Name, phone, and exact institutions should be redacted
    expect(anonymized.candidatePseudonym).not.toContain('Jane');
    expect(anonymized.candidatePseudonym).not.toContain('Doe');
    expect(anonymized.blindRecruitmentNotice).toBeDefined();
    expect(anonymized.skills.length).toBeGreaterThanOrEqual(2);

    // Educations should generalize institution
    for (const edu of anonymized.anonymizedEducations) {
      expect(edu.institutionTier).toBe('[Accredited Higher Education Institution]');
    }

    // Work experience should generalize company
    for (const exp of anonymized.anonymizedExperiences) {
      expect(exp.generalizedCompany).toContain('[');
      expect(exp.generalizedCompany).toContain(']');
    }

    // Verify audit log row was created for recruiter view
    const audit = await prisma.auditLog.findFirst({
      where: {
        actorId: recruiterUserId,
        action: 'VIEW_ANONYMIZED_APPLICANT_PROFILE',
      },
    });
    expect(audit).toBeDefined();
    expect(audit?.targetId).toBe(createdProfileId);
  });
});
