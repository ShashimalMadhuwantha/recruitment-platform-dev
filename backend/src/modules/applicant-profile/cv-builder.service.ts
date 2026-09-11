import fs from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { prisma } from '../../db/client';
import { NotFoundError } from '../../middleware/error.middleware';
import type { CVBuilderRequestDto, CVDto } from '@recruitment-platform/shared';

/**
 * Sanitize text to remove characters not supported by standard WinAnsi PDF fonts
 */
function sanitizePdfText(text?: string | null): string {
  if (!text) return '';
  return text
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/[•]/g, '-')
    .replace(/[^\x00-\xFF]/g, ' ')
    .trim();
}

export class CvBuilderService {
  /**
   * Build a polished PDF resume from applicant profile data and persist as CV & version record
   */
  static async buildAndSaveCv(userId: string, payload: CVBuilderRequestDto): Promise<CVDto> {
    const profile = await prisma.applicantProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { email: true } },
        applicantSkills: { include: { skill: true } },
        workExperiences: { orderBy: { startDate: 'desc' } },
        educations: { orderBy: { startDate: 'desc' } },
        certifications: { orderBy: { issueDate: 'desc' } },
        portfolios: true,
        cvs: true,
      },
    });

    if (!profile) {
      throw new NotFoundError('Applicant profile not found.');
    }

    // Filter skills based on user selection if specified
    const selectedSkills = payload.selectedSkillIds && payload.selectedSkillIds.length > 0
      ? profile.applicantSkills.filter((s) => payload.selectedSkillIds!.includes(s.id) || payload.selectedSkillIds!.includes(s.skillId))
      : profile.applicantSkills;

    // Filter experiences
    const selectedExperiences = payload.selectedExperienceIds && payload.selectedExperienceIds.length > 0
      ? profile.workExperiences.filter((e) => payload.selectedExperienceIds!.includes(e.id))
      : profile.workExperiences;

    // Filter educations
    const selectedEducations = payload.selectedEducationIds && payload.selectedEducationIds.length > 0
      ? profile.educations.filter((ed) => payload.selectedEducationIds!.includes(ed.id))
      : profile.educations;

    // Filter certifications
    const selectedCertifications = payload.selectedCertificationIds && payload.selectedCertificationIds.length > 0
      ? profile.certifications.filter((c) => payload.selectedCertificationIds!.includes(c.id))
      : profile.certifications;

    // Generate PDF Binary
    const pdfBytes = await this.renderPdf({
      profile,
      template: payload.template || 'MODERN_CLEAN',
      headline: payload.customHeadline || profile.headline || 'Professional',
      summary: payload.customSummary || profile.summary || '',
      includedSections: payload.includedSections || {
        summary: true,
        skills: true,
        experience: true,
        education: true,
        certifications: true,
        portfolio: true,
      },
      skills: selectedSkills,
      experiences: selectedExperiences,
      educations: selectedEducations,
      certifications: selectedCertifications,
      portfolios: profile.portfolios,
    });

    // Ensure upload directory exists
    const uploadsDir = path.resolve(process.cwd(), 'uploads/resumes');
    fs.mkdirSync(uploadsDir, { recursive: true });

    const safeName = `${profile.firstName}_${profile.lastName}`.replace(/[^a-zA-Z0-9_-]/g, '_');
    const labelSlug = (payload.versionLabel || 'Resume').replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = Date.now();
    const fileName = `${safeName}_${labelSlug}_${timestamp}.pdf`;
    const filePath = path.join(uploadsDir, fileName);
    const fileRef = `resumes/${fileName}`;

    fs.writeFileSync(filePath, Buffer.from(pdfBytes));

    // Assemble extracted text from structured profile data for searchability & ATS matching
    const extractedTextParts = [
      `${profile.firstName} ${profile.lastName}`,
      payload.customHeadline || profile.headline || '',
      profile.user.email,
      profile.phone || '',
      profile.location || '',
      payload.customSummary || profile.summary || '',
      selectedSkills.map((s) => s.skill.name).join(', '),
      ...selectedExperiences.map((e) => `${e.title} at ${e.companyName}. ${e.description || ''}`),
      ...selectedEducations.map((ed) => `${ed.degree} in ${ed.fieldOfStudy || ''} from ${ed.institution}`),
      ...selectedCertifications.map((c) => `${c.name} ${c.issuer || ''}`),
    ];
    const extractedText = extractedTextParts.filter(Boolean).join('\n');

    const parsedJson = {
      fullName: `${profile.firstName} ${profile.lastName}`,
      headline: payload.customHeadline || profile.headline,
      email: profile.user.email,
      phone: profile.phone,
      location: profile.location,
      summary: payload.customSummary || profile.summary,
      skills: selectedSkills.map((s) => s.skill.name),
      experienceYears: selectedExperiences.length > 0 ? selectedExperiences.length * 1.5 : 1,
      educationLevel: selectedEducations[0]?.degree || 'Bachelor',
      experience: selectedExperiences.map((e) => ({
        company: e.companyName,
        title: e.title,
        startDate: e.startDate?.toISOString().slice(0, 10),
        endDate: e.endDate?.toISOString().slice(0, 10),
        description: e.description,
      })),
      education: selectedEducations.map((ed) => ({
        institution: ed.institution,
        degree: ed.degree,
        fieldOfStudy: ed.fieldOfStudy,
        startDate: ed.startDate?.toISOString().slice(0, 10),
        endDate: ed.endDate?.toISOString().slice(0, 10),
      })),
    };

    let targetCv: any;
    let nextVersionNumber = 1;

    // Check if updating an existing CV or creating new
    if (payload.targetCvId) {
      targetCv = await prisma.cV.findUnique({
        where: { id: payload.targetCvId },
        include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
      });
      if (!targetCv || targetCv.applicantId !== profile.id) {
        throw new NotFoundError('Target CV not found for updating.');
      }
      nextVersionNumber = (targetCv.versions[0]?.versionNumber ?? 0) + 1;

      // Update existing CV record
      targetCv = await prisma.cV.update({
        where: { id: payload.targetCvId },
        data: {
          fileRef,
          fileName,
          fileSize: pdfBytes.length,
          mimeType: 'application/pdf',
          parsedText: extractedText,
          parsedJson,
          versionLabel: payload.versionLabel || targetCv.versionLabel,
          templateName: payload.template,
          createdFrom: 'BUILDER',
          isPrimary: payload.makePrimary ? true : targetCv.isPrimary,
        },
      });
    } else {
      const existingCvsCount = profile.cvs.length;
      const isPrimary = payload.makePrimary ?? existingCvsCount === 0;

      if (isPrimary) {
        await prisma.cV.updateMany({
          where: { applicantId: profile.id },
          data: { isPrimary: false },
        });
      }

      targetCv = await prisma.cV.create({
        data: {
          applicantId: profile.id,
          fileRef,
          fileName,
          fileSize: pdfBytes.length,
          mimeType: 'application/pdf',
          parsedText: extractedText,
          parsedJson,
          versionLabel: payload.versionLabel || `Resume v${existingCvsCount + 1}`,
          templateName: payload.template,
          createdFrom: 'BUILDER',
          isPrimary,
          parsingStatus: 'COMPLETED',
        },
      });
    }

    // Snapshot in CVVersion table
    await prisma.cVVersion.create({
      data: {
        cvId: targetCv.id,
        versionNumber: nextVersionNumber,
        versionLabel: payload.versionLabel || targetCv.versionLabel || `v${nextVersionNumber}`,
        fileRef,
        fileName,
        fileSize: pdfBytes.length,
        mimeType: 'application/pdf',
        parsedText: extractedText,
        parsedJson,
        createdFrom: 'BUILDER',
        templateName: payload.template,
      },
    });

    return {
      id: targetCv.id,
      applicantId: targetCv.applicantId,
      fileRef: targetCv.fileRef,
      fileName: targetCv.fileName,
      fileSize: targetCv.fileSize,
      mimeType: targetCv.mimeType,
      parsedText: targetCv.parsedText,
      parsedJson: targetCv.parsedJson as any,
      versionLabel: targetCv.versionLabel,
      isPrimary: targetCv.isPrimary,
      parsingStatus: targetCv.parsingStatus,
      createdFrom: targetCv.createdFrom,
      templateName: targetCv.templateName,
      createdAt: targetCv.createdAt.toISOString(),
      updatedAt: targetCv.updatedAt?.toISOString(),
    };
  }

  /**
   * PDF Document Layout & Styling Engine
   */
  private static async renderPdf(data: {
    profile: any;
    template: 'MODERN_CLEAN' | 'TECHNICAL_ATS' | 'EXECUTIVE_CLASSIC';
    headline: string;
    summary: string;
    includedSections: any;
    skills: any[];
    experiences: any[];
    educations: any[];
    certifications: any[];
    portfolios: any[];
  }): Promise<Uint8Array> {
    const doc = await PDFDocument.create();

    // Fonts setup based on template style
    let fontBold: any;
    let fontRegular: any;
    let fontItalic: any;

    if (data.template === 'EXECUTIVE_CLASSIC') {
      fontBold = await doc.embedFont(StandardFonts.TimesRomanBold);
      fontRegular = await doc.embedFont(StandardFonts.TimesRoman);
      fontItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);
    } else {
      fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
      fontRegular = await doc.embedFont(StandardFonts.Helvetica);
      fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);
    }

    // Colors
    const brandBlue = rgb(0.18, 0.29, 0.55); // #2F4B8C
    const darkNavy = rgb(0.11, 0.16, 0.29); // #1B2A4A
    const darkText = rgb(0.11, 0.14, 0.19); // #1B2330
    const secondaryText = rgb(0.36, 0.39, 0.45); // #5B6472
    const mutedLine = rgb(0.87, 0.89, 0.92); // #DFE3EA

    let page = doc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    let y = height - 48;

    const checkPageBreak = (neededHeight: number) => {
      if (y - neededHeight < 40) {
        page = doc.addPage([595.28, 841.89]);
        y = height - 48;
      }
    };

    const fullName = sanitizePdfText(`${data.profile.firstName} ${data.profile.lastName}`);
    const headline = sanitizePdfText(data.headline);
    const email = sanitizePdfText(data.profile.user.email);
    const phone = sanitizePdfText(data.profile.phone || '');
    const location = sanitizePdfText(data.profile.location || '');

    // 1. HEADER SECTION
    if (data.template === 'MODERN_CLEAN') {
      page.drawRectangle({
        x: 0,
        y: height - 8,
        width,
        height: 8,
        color: brandBlue,
      });

      page.drawText(fullName, {
        x: 48,
        y,
        size: 22,
        font: fontBold,
        color: darkNavy,
      });
      y -= 18;

      if (headline) {
        page.drawText(headline, {
          x: 48,
          y,
          size: 11.5,
          font: fontBold,
          color: brandBlue,
        });
        y -= 16;
      }

      const contactLine = [email, phone, location].filter(Boolean).join('   |   ');
      page.drawText(contactLine, {
        x: 48,
        y,
        size: 9,
        font: fontRegular,
        color: secondaryText,
      });
      y -= 14;

      page.drawLine({
        start: { x: 48, y },
        end: { x: width - 48, y },
        thickness: 1,
        color: mutedLine,
      });
      y -= 18;
    } else if (data.template === 'EXECUTIVE_CLASSIC') {
      const nameWidth = fontBold.widthOfTextAtSize(fullName, 22);
      page.drawText(fullName, {
        x: (width - nameWidth) / 2,
        y,
        size: 22,
        font: fontBold,
        color: darkNavy,
      });
      y -= 18;

      if (headline) {
        const headlineWidth = fontRegular.widthOfTextAtSize(headline, 11);
        page.drawText(headline, {
          x: (width - headlineWidth) / 2,
          y,
          size: 11,
          font: fontItalic,
          color: secondaryText,
        });
        y -= 16;
      }

      const contactLine = [email, phone, location].filter(Boolean).join('   •   ');
      const contactWidth = fontRegular.widthOfTextAtSize(contactLine, 9);
      page.drawText(contactLine, {
        x: (width - contactWidth) / 2,
        y,
        size: 9,
        font: fontRegular,
        color: secondaryText,
      });
      y -= 12;

      page.drawLine({
        start: { x: 80, y },
        end: { x: width - 80, y },
        thickness: 1,
        color: darkNavy,
      });
      y -= 18;
    } else {
      page.drawText(fullName.toUpperCase(), {
        x: 48,
        y,
        size: 20,
        font: fontBold,
        color: darkText,
      });
      y -= 16;

      if (headline) {
        page.drawText(headline, {
          x: 48,
          y,
          size: 11,
          font: fontBold,
          color: darkText,
        });
        y -= 14;
      }

      const contactLine = [email, phone, location].filter(Boolean).join('  |  ');
      page.drawText(contactLine, {
        x: 48,
        y,
        size: 9.5,
        font: fontRegular,
        color: darkText,
      });
      y -= 14;

      page.drawLine({
        start: { x: 48, y },
        end: { x: width - 48, y },
        thickness: 1.2,
        color: darkText,
      });
      y -= 16;
    }

    const drawSectionTitle = (title: string) => {
      checkPageBreak(36);
      if (data.template === 'MODERN_CLEAN') {
        page.drawText(title.toUpperCase(), {
          x: 48,
          y,
          size: 10.5,
          font: fontBold,
          color: brandBlue,
        });
        y -= 4;
        page.drawLine({
          start: { x: 48, y },
          end: { x: width - 48, y },
          thickness: 0.75,
          color: mutedLine,
        });
        y -= 12;
      } else if (data.template === 'EXECUTIVE_CLASSIC') {
        page.drawText(title.toUpperCase(), {
          x: 48,
          y,
          size: 11,
          font: fontBold,
          color: darkNavy,
        });
        y -= 4;
        page.drawLine({
          start: { x: 48, y },
          end: { x: width - 48, y },
          thickness: 0.75,
          color: darkNavy,
        });
        y -= 12;
      } else {
        page.drawText(title.toUpperCase(), {
          x: 48,
          y,
          size: 11,
          font: fontBold,
          color: darkText,
        });
        y -= 3;
        page.drawLine({
          start: { x: 48, y },
          end: { x: width - 48, y },
          thickness: 1,
          color: darkText,
        });
        y -= 10;
      }
    };

    // 2. PROFESSIONAL SUMMARY
    if (data.includedSections?.summary && data.summary) {
      drawSectionTitle('Professional Summary');
      const sanitizedSummary = sanitizePdfText(data.summary);
      checkPageBreak(40);
      page.drawText(sanitizedSummary, {
        x: 48,
        y,
        size: 9.5,
        font: fontRegular,
        color: darkText,
        maxWidth: width - 96,
        lineHeight: 13.5,
      });
      const lines = Math.ceil(sanitizedSummary.length / 85);
      y -= Math.max(lines * 14, 20) + 10;
    }

    // 3. TECHNICAL SKILLS
    if (data.includedSections?.skills && data.skills && data.skills.length > 0) {
      drawSectionTitle('Technical Skills & Expertise');
      checkPageBreak(30);

      const skillNames = data.skills.map((s) => sanitizePdfText(s.skill.name));
      const skillsChunks: string[] = [];
      let currentChunk: string[] = [];

      for (const sk of skillNames) {
        currentChunk.push(sk);
        if (currentChunk.length >= 6) {
          skillsChunks.push(currentChunk.join('  •  '));
          currentChunk = [];
        }
      }
      if (currentChunk.length > 0) {
        skillsChunks.push(currentChunk.join('  •  '));
      }

      for (const line of skillsChunks) {
        checkPageBreak(16);
        page.drawText(`•  ${line}`, {
          x: 48,
          y,
          size: 9.5,
          font: fontRegular,
          color: darkText,
          maxWidth: width - 96,
        });
        y -= 14;
      }
      y -= 6;
    }

    // 4. PROFESSIONAL EXPERIENCE
    if (data.includedSections?.experience && data.experiences && data.experiences.length > 0) {
      drawSectionTitle('Professional Experience');

      for (const exp of data.experiences) {
        checkPageBreak(55);

        const company = sanitizePdfText(exp.companyName);
        const title = sanitizePdfText(exp.title);
        const startYear = exp.startDate ? new Date(exp.startDate).getFullYear() : '';
        const endYear = exp.isCurrent ? 'Present' : exp.endDate ? new Date(exp.endDate).getFullYear() : '';
        const dateStr = startYear ? `${startYear} - ${endYear}` : '';

        page.drawText(title, {
          x: 48,
          y,
          size: 10.5,
          font: fontBold,
          color: darkNavy,
        });

        if (dateStr) {
          const dateWidth = fontRegular.widthOfTextAtSize(dateStr, 9);
          page.drawText(dateStr, {
            x: width - 48 - dateWidth,
            y,
            size: 9,
            font: fontRegular,
            color: secondaryText,
          });
        }
        y -= 13;

        page.drawText(company, {
          x: 48,
          y,
          size: 9.5,
          font: fontItalic,
          color: brandBlue,
        });
        y -= 13;

        if (exp.description) {
          const desc = sanitizePdfText(exp.description);
          page.drawText(desc, {
            x: 48,
            y,
            size: 9,
            font: fontRegular,
            color: darkText,
            maxWidth: width - 96,
            lineHeight: 13,
          });
          const lines = Math.ceil(desc.length / 85);
          y -= Math.max(lines * 13, 16) + 6;
        } else {
          y -= 4;
        }
      }
      y -= 4;
    }

    // 5. EDUCATION
    if (data.includedSections?.education && data.educations && data.educations.length > 0) {
      drawSectionTitle('Education');

      for (const edu of data.educations) {
        checkPageBreak(35);

        const inst = sanitizePdfText(edu.institution);
        const degree = sanitizePdfText(`${edu.degree}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}`);
        const year = edu.endDate ? new Date(edu.endDate).getFullYear() : edu.startDate ? new Date(edu.startDate).getFullYear() : '';

        page.drawText(degree, {
          x: 48,
          y,
          size: 10,
          font: fontBold,
          color: darkNavy,
        });

        if (year) {
          const yrStr = String(year);
          const yrWidth = fontRegular.widthOfTextAtSize(yrStr, 9);
          page.drawText(yrStr, {
            x: width - 48 - yrWidth,
            y,
            size: 9,
            font: fontRegular,
            color: secondaryText,
          });
        }
        y -= 12;

        page.drawText(inst, {
          x: 48,
          y,
          size: 9,
          font: fontRegular,
          color: secondaryText,
        });
        y -= 14;
      }
      y -= 4;
    }

    // 6. CERTIFICATIONS
    if (data.includedSections?.certifications && data.certifications && data.certifications.length > 0) {
      drawSectionTitle('Certifications & Credentials');

      for (const cert of data.certifications) {
        checkPageBreak(25);
        const certName = sanitizePdfText(cert.name);
        const issuer = sanitizePdfText(cert.issuer || '');
        const certLine = issuer ? `${certName} — ${issuer}` : certName;

        page.drawText(`•  ${certLine}`, {
          x: 48,
          y,
          size: 9,
          font: fontRegular,
          color: darkText,
          maxWidth: width - 96,
        });
        y -= 13;
      }
    }

    return doc.save();
  }
}

export default CvBuilderService;
