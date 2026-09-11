import fs from 'fs';
import path from 'path';
import { prisma } from '../../db/client';
import { NotFoundError, ForbiddenError } from '../../middleware/error.middleware';
import type { CVVersionDto, CVDto } from '@recruitment-platform/shared';

export class CvVersionService {
  /**
   * List all historical version snapshots for a specific CV
   */
  static async listVersions(cvId: string, userId: string): Promise<CVVersionDto[]> {
    const profile = await prisma.applicantProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) throw new NotFoundError('Applicant profile not found.');

    const cv = await prisma.cV.findUnique({
      where: { id: cvId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
        },
      },
    });

    if (!cv) throw new NotFoundError('CV not found.');
    if (cv.applicantId !== profile.id) {
      throw new ForbiddenError('You do not have permission to view versions for this CV.');
    }

    return cv.versions.map((v) => ({
      id: v.id,
      cvId: v.cvId,
      versionNumber: v.versionNumber,
      versionLabel: v.versionLabel,
      fileRef: v.fileRef,
      fileName: v.fileName,
      fileSize: v.fileSize,
      mimeType: v.mimeType,
      parsedText: v.parsedText,
      parsedJson: v.parsedJson as any,
      createdFrom: v.createdFrom,
      templateName: v.templateName,
      createdAt: v.createdAt.toISOString(),
    }));
  }

  /**
   * Restore a historical CV version snapshot, rolling active CV back to it and adding a restore version entry
   */
  static async restoreVersion(cvId: string, versionId: string, userId: string): Promise<CVDto> {
    const profile = await prisma.applicantProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) throw new NotFoundError('Applicant profile not found.');

    const cv = await prisma.cV.findUnique({
      where: { id: cvId },
      include: {
        versions: { orderBy: { versionNumber: 'desc' } },
      },
    });

    if (!cv) throw new NotFoundError('CV not found.');
    if (cv.applicantId !== profile.id) {
      throw new ForbiddenError('You do not have permission to restore this CV.');
    }

    const targetVersion = cv.versions.find((v) => v.id === versionId);
    if (!targetVersion) {
      throw new NotFoundError('Version snapshot not found.');
    }

    const latestVersionNumber = cv.versions[0]?.versionNumber ?? 1;
    const newVersionNumber = latestVersionNumber + 1;
    const restoredLabel = `${targetVersion.versionLabel} (Restored)`;

    // 1. Update active CV record
    const updatedCv = await prisma.cV.update({
      where: { id: cvId },
      data: {
        fileRef: targetVersion.fileRef,
        fileName: targetVersion.fileName,
        fileSize: targetVersion.fileSize,
        mimeType: targetVersion.mimeType,
        parsedText: targetVersion.parsedText,
        parsedJson: targetVersion.parsedJson as any,
        versionLabel: restoredLabel,
        templateName: targetVersion.templateName,
        createdFrom: 'RESTORE',
      },
    });

    // 2. Snapshot the restore event in CVVersion
    await prisma.cVVersion.create({
      data: {
        cvId,
        versionNumber: newVersionNumber,
        versionLabel: restoredLabel,
        fileRef: targetVersion.fileRef,
        fileName: targetVersion.fileName,
        fileSize: targetVersion.fileSize,
        mimeType: targetVersion.mimeType,
        parsedText: targetVersion.parsedText,
        parsedJson: targetVersion.parsedJson as any,
        createdFrom: 'RESTORE',
        templateName: targetVersion.templateName,
      },
    });

    return {
      id: updatedCv.id,
      applicantId: updatedCv.applicantId,
      fileRef: updatedCv.fileRef,
      fileName: updatedCv.fileName,
      fileSize: updatedCv.fileSize,
      mimeType: updatedCv.mimeType,
      parsedText: updatedCv.parsedText,
      parsedJson: updatedCv.parsedJson as any,
      versionLabel: updatedCv.versionLabel,
      isPrimary: updatedCv.isPrimary,
      parsingStatus: updatedCv.parsingStatus,
      createdFrom: updatedCv.createdFrom,
      templateName: updatedCv.templateName,
      createdAt: updatedCv.createdAt.toISOString(),
      updatedAt: updatedCv.updatedAt?.toISOString(),
    };
  }

  /**
   * Update version label of a CV
   */
  static async updateLabel(cvId: string, versionLabel: string, userId: string): Promise<CVDto> {
    const profile = await prisma.applicantProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) throw new NotFoundError('Applicant profile not found.');

    const cv = await prisma.cV.findUnique({ where: { id: cvId } });
    if (!cv) throw new NotFoundError('CV not found.');
    if (cv.applicantId !== profile.id) {
      throw new ForbiddenError('You do not have permission to edit this CV.');
    }

    const updated = await prisma.cV.update({
      where: { id: cvId },
      data: { versionLabel: versionLabel.trim() },
    });

    return {
      id: updated.id,
      applicantId: updated.applicantId,
      fileRef: updated.fileRef,
      fileName: updated.fileName,
      fileSize: updated.fileSize,
      mimeType: updated.mimeType,
      parsedText: updated.parsedText,
      parsedJson: updated.parsedJson as any,
      versionLabel: updated.versionLabel,
      isPrimary: updated.isPrimary,
      parsingStatus: updated.parsingStatus,
      createdFrom: updated.createdFrom,
      templateName: updated.templateName,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt?.toISOString(),
    };
  }

  /**
   * Duplicate a CV to create an independent new tailored copy
   */
  static async duplicateCv(cvId: string, userId: string): Promise<CVDto> {
    const profile = await prisma.applicantProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) throw new NotFoundError('Applicant profile not found.');

    const cv = await prisma.cV.findUnique({ where: { id: cvId } });
    if (!cv) throw new NotFoundError('CV not found.');
    if (cv.applicantId !== profile.id) {
      throw new ForbiddenError('You do not have permission to duplicate this CV.');
    }

    const duplicateLabel = `${cv.versionLabel || 'Resume'} (Copy)`;

    const duplicated = await prisma.cV.create({
      data: {
        applicantId: profile.id,
        fileRef: cv.fileRef,
        fileName: cv.fileName,
        fileSize: cv.fileSize,
        mimeType: cv.mimeType,
        parsedText: cv.parsedText,
        parsedJson: cv.parsedJson as any,
        versionLabel: duplicateLabel,
        isPrimary: false,
        parsingStatus: cv.parsingStatus,
        createdFrom: cv.createdFrom,
        templateName: cv.templateName,
      },
    });

    // Create initial v1 snapshot for the copy
    await prisma.cVVersion.create({
      data: {
        cvId: duplicated.id,
        versionNumber: 1,
        versionLabel: duplicateLabel,
        fileRef: cv.fileRef,
        fileName: cv.fileName,
        fileSize: cv.fileSize,
        mimeType: cv.mimeType,
        parsedText: cv.parsedText,
        parsedJson: cv.parsedJson as any,
        createdFrom: duplicated.createdFrom || 'UPLOAD',
        templateName: duplicated.templateName,
      },
    });

    return {
      id: duplicated.id,
      applicantId: duplicated.applicantId,
      fileRef: duplicated.fileRef,
      fileName: duplicated.fileName,
      fileSize: duplicated.fileSize,
      mimeType: duplicated.mimeType,
      parsedText: duplicated.parsedText,
      parsedJson: duplicated.parsedJson as any,
      versionLabel: duplicated.versionLabel,
      isPrimary: duplicated.isPrimary,
      parsingStatus: duplicated.parsingStatus,
      createdFrom: duplicated.createdFrom,
      templateName: duplicated.templateName,
      createdAt: duplicated.createdAt.toISOString(),
      updatedAt: duplicated.updatedAt?.toISOString(),
    };
  }

  /**
   * Resolve file path for downloading a CV file
   */
  static async getDownloadInfo(cvId: string, userId: string): Promise<{ filePath: string; fileName: string; mimeType: string }> {
    const profile = await prisma.applicantProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) throw new NotFoundError('Applicant profile not found.');

    const cv = await prisma.cV.findUnique({ where: { id: cvId } });
    if (!cv) throw new NotFoundError('CV not found.');
    if (cv.applicantId !== profile.id) {
      throw new ForbiddenError('You do not have permission to download this CV.');
    }

    // Resolve path: could be uploads/resumes/filename or public/samples/
    let fullPath = path.resolve(process.cwd(), 'uploads', cv.fileRef);
    if (!fs.existsSync(fullPath)) {
      // Check uploads direct
      fullPath = path.resolve(process.cwd(), 'uploads/resumes', cv.fileName);
    }
    if (!fs.existsSync(fullPath)) {
      // Check samples
      fullPath = path.resolve(process.cwd(), '../frontend/public', cv.fileRef);
    }

    return {
      filePath: fullPath,
      fileName: cv.fileName,
      mimeType: cv.mimeType || 'application/pdf',
    };
  }
}

export default CvVersionService;
