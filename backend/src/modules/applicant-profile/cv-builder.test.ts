import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { CvBuilderService } from './cv-builder.service';
import { CvVersionService } from './cv-version.service';
import { resumeParserService } from './resume-parser.service';
import { prisma } from '../../db/client';
import bcrypt from 'bcrypt';

describe('Epic 9: CV Builder, Version History & Smart Selective Sync Tests', () => {
  let applicantUserId: string;
  let profileId: string;
  let builtCvId: string;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('TestPass123!', 10);
    const user = await prisma.user.create({
      data: {
        email: `test-cv-builder-${Date.now()}@ats.local`,
        passwordHash,
        role: 'APPLICANT',
        status: 'ACTIVE',
      },
    });
    applicantUserId = user.id;

    const skillReact = await prisma.skill.upsert({
      where: { name: 'React' },
      update: {},
      create: { name: 'React', category: 'Technical' },
    });

    const skillTS = await prisma.skill.upsert({
      where: { name: 'TypeScript' },
      update: {},
      create: { name: 'TypeScript', category: 'Technical' },
    });

    const profile = await prisma.applicantProfile.create({
      data: {
        userId: user.id,
        firstName: 'Taylor',
        lastName: 'Swift',
        headline: 'Lead Frontend Developer',
        summary: 'Experienced software engineer specialized in modern TypeScript, React component design, and scalable architectures.',
        location: 'San Francisco, CA',
        phone: '+1 555-0199',
        applicantSkills: {
          create: [
            { skillId: skillReact.id, proficiency: 4, yearsExperience: 3.5 },
            { skillId: skillTS.id, proficiency: 4, yearsExperience: 3.0 },
          ],
        },
        workExperiences: {
          create: [
            {
              companyName: 'Starlight Tech',
              title: 'Senior Frontend Engineer',
              startDate: new Date('2021-03-01'),
              isCurrent: true,
              description: 'Architected design system components and high-throughput web portals.',
            },
          ],
        },
        educations: {
          create: [
            {
              institution: 'Stanford University',
              degree: 'Bachelor of Science',
              fieldOfStudy: 'Computer Science',
              startDate: new Date('2016-09-01'),
              endDate: new Date('2020-06-01'),
            },
          ],
        },
        certifications: {
          create: [
            {
              name: 'AWS Certified Cloud Practitioner',
              issuer: 'Amazon Web Services',
              issueDate: new Date('2022-05-10'),
            },
          ],
        },
      },
    });
    profileId = profile.id;
  });

  it('1. Generates and persists CV using MODERN_CLEAN template', async () => {
    const result = await CvBuilderService.buildAndSaveCv(applicantUserId, {
      template: 'MODERN_CLEAN',
      versionLabel: 'Modern Clean Frontend CV',
      includedSections: {
        summary: true,
        skills: true,
        experience: true,
        education: true,
        certifications: true,
      },
      makePrimary: true,
    });

    expect(result.id).toBeDefined();
    expect(result.isPrimary).toBe(true);
    expect(result.versionLabel).toBe('Modern Clean Frontend CV');
    expect(result.templateName).toBe('MODERN_CLEAN');
    expect(result.createdFrom).toBe('BUILDER');
    expect(result.fileSize).toBeGreaterThan(500);
    expect(result.parsedText).toContain('Taylor Swift');
    builtCvId = result.id;
  });

  it('2. Generates and updates CV using TECHNICAL_ATS template', async () => {
    const result = await CvBuilderService.buildAndSaveCv(applicantUserId, {
      template: 'TECHNICAL_ATS',
      versionLabel: 'Technical ATS CV v2',
      targetCvId: builtCvId,
      includedSections: {
        summary: true,
        skills: true,
        experience: true,
        education: true,
        certifications: true,
      },
      customHeadline: 'Senior Full-Stack Architect',
    });

    expect(result.id).toBe(builtCvId);
    expect(result.templateName).toBe('TECHNICAL_ATS');
    expect(result.versionLabel).toBe('Technical ATS CV v2');
    expect(result.parsedText).toContain('Taylor Swift');
  });

  it('3. Generates CV using EXECUTIVE_CLASSIC template', async () => {
    const result = await CvBuilderService.buildAndSaveCv(applicantUserId, {
      template: 'EXECUTIVE_CLASSIC',
      versionLabel: 'Executive Classic CV',
      includedSections: {
        summary: true,
        skills: true,
        experience: true,
        education: true,
        certifications: false,
      },
    });

    expect(result.id).toBeDefined();
    expect(result.templateName).toBe('EXECUTIVE_CLASSIC');
    expect(result.parsedText).toContain('Taylor Swift');
  });

  it('4. Lists version history snapshots for built CV', async () => {
    const versions = await CvVersionService.listVersions(builtCvId, applicantUserId);

    expect(versions.length).toBeGreaterThanOrEqual(2);
    expect(versions[0].versionNumber).toBeGreaterThan(versions[1].versionNumber);
    expect(versions.some((v) => v.createdFrom === 'BUILDER')).toBe(true);
  });

  it('5. Updates CV version label inline', async () => {
    const updated = await CvVersionService.updateLabel(builtCvId, 'Renamed Master CV', applicantUserId);
    expect(updated.versionLabel).toBe('Renamed Master CV');
  });

  it('6. Duplicates CV into an independent tailored copy', async () => {
    const duplicate = await CvVersionService.duplicateCv(builtCvId, applicantUserId);

    expect(duplicate.id).not.toBe(builtCvId);
    expect(duplicate.versionLabel).toContain('(Copy)');
    expect(duplicate.isPrimary).toBe(false);

    // Verify copy has its own version snapshot
    const copyVersions = await CvVersionService.listVersions(duplicate.id, applicantUserId);
    expect(copyVersions.length).toBe(1);
    expect(copyVersions[0].versionNumber).toBe(1);
  });

  it('7. Restores earlier CV version snapshot (rollback)', async () => {
    const versions = await CvVersionService.listVersions(builtCvId, applicantUserId);
    const targetSnapshot = versions[versions.length - 1]; // First version

    const restored = await CvVersionService.restoreVersion(builtCvId, targetSnapshot.id, applicantUserId);

    expect(restored.id).toBe(builtCvId);
    expect(restored.createdFrom).toBe('RESTORE');
    expect(restored.versionLabel).toContain('(Restored)');

    // Verify new restore snapshot added to history
    const updatedVersions = await CvVersionService.listVersions(builtCvId, applicantUserId);
    expect(updatedVersions.length).toBe(versions.length + 1);
    expect(updatedVersions[0].createdFrom).toBe('RESTORE');
  });

  it('8. Selectively synchronizes parsed resume items into profile', async () => {
    const syncRes = await resumeParserService.syncResumeSelective(applicantUserId, builtCvId, {
      updateHeadline: true,
      selectedSkillNames: ['GraphQL', 'Docker'],
      importExperiences: false,
      importEducations: false,
    });

    expect(syncRes.success).toBe(true);
    expect(syncRes.importedSkillsCount).toBeGreaterThanOrEqual(1);

    // Verify profile has the new skills
    const updatedProfile = await prisma.applicantProfile.findUnique({
      where: { userId: applicantUserId },
      include: { applicantSkills: { include: { skill: true } } },
    });

    const skillNames = updatedProfile?.applicantSkills.map((s) => s.skill.name);
    expect(skillNames).toContain('GraphQL');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
