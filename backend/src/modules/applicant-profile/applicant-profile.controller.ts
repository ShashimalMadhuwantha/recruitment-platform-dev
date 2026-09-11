import { Request, Response } from 'express';
import { applicantProfileService } from './applicant-profile.service';
import { resumeParserService } from './resume-parser.service';
import { CvBuilderService } from './cv-builder.service';
import { CvVersionService } from './cv-version.service';
import {
  updateProfileSchema,
  experienceSchema,
  educationSchema,
  skillSchema,
  certificationSchema,
  portfolioSchema,
  resumeUploadSchema,
} from './applicant-profile.types';

export class ApplicantProfileController {
  // ==========================================
  // Profile
  // ==========================================
  async getProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const profile = await applicantProfileService.getProfile(userId);
      return res.status(200).json({ data: profile, error: null });
    } catch (error: any) {
      return res.status(400).json({ data: null, error: { message: error.message, code: 'BAD_REQUEST' } });
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const parsed = updateProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          data: null,
          error: { message: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.format() },
        });
      }

      const updated = await applicantProfileService.updateProfile(userId, parsed.data);
      return res.status(200).json({ data: updated, error: null });
    } catch (error: any) {
      return res.status(400).json({ data: null, error: { message: error.message, code: 'BAD_REQUEST' } });
    }
  }

  // ==========================================
  // Experience
  // ==========================================
  async addExperience(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const parsed = experienceSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          data: null,
          error: { message: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.format() },
        });
      }

      const experience = await applicantProfileService.addExperience(userId, parsed.data);
      return res.status(201).json({ data: experience, error: null });
    } catch (error: any) {
      return res.status(400).json({ data: null, error: { message: error.message, code: 'BAD_REQUEST' } });
    }
  }

  async updateExperience(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const experienceId = req.params.id;
      const updated = await applicantProfileService.updateExperience(userId, experienceId, req.body);
      return res.status(200).json({ data: updated, error: null });
    } catch (error: any) {
      return res.status(400).json({ data: null, error: { message: error.message, code: 'BAD_REQUEST' } });
    }
  }

  async deleteExperience(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const experienceId = req.params.id;
      const result = await applicantProfileService.deleteExperience(userId, experienceId);
      return res.status(200).json({ data: result, error: null });
    } catch (error: any) {
      return res.status(400).json({ data: null, error: { message: error.message, code: 'BAD_REQUEST' } });
    }
  }

  // ==========================================
  // Education
  // ==========================================
  async addEducation(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const parsed = educationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          data: null,
          error: { message: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.format() },
        });
      }

      const education = await applicantProfileService.addEducation(userId, parsed.data);
      return res.status(201).json({ data: education, error: null });
    } catch (error: any) {
      return res.status(400).json({ data: null, error: { message: error.message, code: 'BAD_REQUEST' } });
    }
  }

  async updateEducation(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const educationId = req.params.id;
      const updated = await applicantProfileService.updateEducation(userId, educationId, req.body);
      return res.status(200).json({ data: updated, error: null });
    } catch (error: any) {
      return res.status(400).json({ data: null, error: { message: error.message, code: 'BAD_REQUEST' } });
    }
  }

  async deleteEducation(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const educationId = req.params.id;
      const result = await applicantProfileService.deleteEducation(userId, educationId);
      return res.status(200).json({ data: result, error: null });
    } catch (error: any) {
      return res.status(400).json({ data: null, error: { message: error.message, code: 'BAD_REQUEST' } });
    }
  }

  // ==========================================
  // Skills
  // ==========================================
  async addSkill(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const parsed = skillSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          data: null,
          error: { message: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.format() },
        });
      }

      const skill = await applicantProfileService.addSkill(userId, parsed.data);
      return res.status(201).json({ data: skill, error: null });
    } catch (error: any) {
      return res.status(400).json({ data: null, error: { message: error.message, code: 'BAD_REQUEST' } });
    }
  }

  async updateSkill(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const skillId = req.params.id;
      const updated = await applicantProfileService.updateSkill(userId, skillId, req.body);
      return res.status(200).json({ data: updated, error: null });
    } catch (error: any) {
      return res.status(400).json({ data: null, error: { message: error.message, code: 'BAD_REQUEST' } });
    }
  }

  async deleteSkill(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const skillId = req.params.id;
      const result = await applicantProfileService.deleteSkill(userId, skillId);
      return res.status(200).json({ data: result, error: null });
    } catch (error: any) {
      return res.status(400).json({ data: null, error: { message: error.message, code: 'BAD_REQUEST' } });
    }
  }

  // ==========================================
  // Certifications
  // ==========================================
  async addCertification(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const parsed = certificationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          data: null,
          error: { message: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.format() },
        });
      }

      const cert = await applicantProfileService.addCertification(userId, parsed.data);
      return res.status(201).json({ data: cert, error: null });
    } catch (error: any) {
      return res.status(400).json({ data: null, error: { message: error.message, code: 'BAD_REQUEST' } });
    }
  }

  async deleteCertification(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const certId = req.params.id;
      const result = await applicantProfileService.deleteCertification(userId, certId);
      return res.status(200).json({ data: result, error: null });
    } catch (error: any) {
      return res.status(400).json({ data: null, error: { message: error.message, code: 'BAD_REQUEST' } });
    }
  }

  // ==========================================
  // Portfolios
  // ==========================================
  async addPortfolio(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const parsed = portfolioSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          data: null,
          error: { message: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.format() },
        });
      }

      const item = await applicantProfileService.addPortfolio(userId, parsed.data);
      return res.status(201).json({ data: item, error: null });
    } catch (error: any) {
      return res.status(400).json({ data: null, error: { message: error.message, code: 'BAD_REQUEST' } });
    }
  }

  async deletePortfolio(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const portfolioId = req.params.id;
      const result = await applicantProfileService.deletePortfolio(userId, portfolioId);
      return res.status(200).json({ data: result, error: null });
    } catch (error: any) {
      return res.status(400).json({ data: null, error: { message: error.message, code: 'BAD_REQUEST' } });
    }
  }

  // ==========================================
  // Resumes / CV Upload & Parsing
  // ==========================================
  async uploadResume(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const profile = await applicantProfileService.getProfile(userId);

      // Support multer file or json body with fileData
      const file = (req as any).file;
      let fileName = file ? file.originalname : req.body.fileName;
      let fileSize = file ? file.size : req.body.fileSize;
      let mimeType = file ? file.mimetype : req.body.mimeType;
      const buffer = file ? file.buffer : undefined;
      const fileData = req.body.fileData;
      const versionLabel = req.body.versionLabel;
      const isPrimary = req.body.isPrimary === true || req.body.isPrimary === 'true';

      if (!file && !fileData) {
        return res.status(400).json({
          data: null,
          error: { message: 'No file or fileData provided', code: 'FILE_REQUIRED' },
        });
      }

      if (!fileName) fileName = 'resume.pdf';
      if (!mimeType) mimeType = 'application/pdf';
      if (!fileSize) fileSize = buffer ? buffer.length : 1024;

      if (fileSize > 5 * 1024 * 1024) {
        return res.status(400).json({
          data: null,
          error: { message: 'File size exceeds 5MB limit', code: 'FILE_TOO_LARGE' },
        });
      }

      const cv = await resumeParserService.saveAndParseResume({
        applicantId: profile.id,
        fileName,
        fileSize,
        mimeType,
        buffer,
        fileData,
        versionLabel,
        isPrimary,
      });

      return res.status(201).json({ data: cv, error: null });
    } catch (error: any) {
      return res.status(400).json({ data: null, error: { message: error.message, code: 'UPLOAD_FAILED' } });
    }
  }

  async listResumes(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const resumes = await applicantProfileService.listResumes(userId);
      return res.status(200).json({ data: resumes, error: null });
    } catch (error: any) {
      return res.status(400).json({ data: null, error: { message: error.message, code: 'BAD_REQUEST' } });
    }
  }

  async getResume(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const resume = await applicantProfileService.getResume(userId, req.params.id);
      return res.status(200).json({ data: resume, error: null });
    } catch (error: any) {
      return res.status(404).json({ data: null, error: { message: error.message, code: 'NOT_FOUND' } });
    }
  }

  async deleteResume(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const result = await applicantProfileService.deleteResume(userId, req.params.id);
      return res.status(200).json({ data: result, error: null });
    } catch (error: any) {
      return res.status(400).json({ data: null, error: { message: error.message, code: 'BAD_REQUEST' } });
    }
  }

  async setPrimaryResume(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const result = await applicantProfileService.setPrimaryResume(userId, req.params.id);
      return res.status(200).json({ data: result, error: null });
    } catch (error: any) {
      return res.status(400).json({ data: null, error: { message: error.message, code: 'BAD_REQUEST' } });
    }
  }

  async applyResumeToProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const result = await resumeParserService.applyResumeToProfile(userId, req.params.id);
      return res.status(200).json({ data: result, error: null });
    } catch (error: any) {
      return res.status(400).json({ data: null, error: { message: error.message, code: 'AUTOFILL_FAILED' } });
    }
  }

  // ==========================================
  // Epic 9: CV Builder, Versions & Selective Sync
  // ==========================================
  async buildResume(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const cv = await CvBuilderService.buildAndSaveCv(userId, req.body);
      return res.status(201).json({ data: cv, error: null });
    } catch (error: any) {
      return res.status(400).json({ data: null, error: { message: error.message, code: 'BUILD_FAILED' } });
    }
  }

  async downloadResume(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const downloadInfo = await CvVersionService.getDownloadInfo(req.params.id, userId);
      return res.download(downloadInfo.filePath, downloadInfo.fileName);
    } catch (error: any) {
      return res.status(404).json({ data: null, error: { message: error.message, code: 'FILE_NOT_FOUND' } });
    }
  }

  async listVersions(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const versions = await CvVersionService.listVersions(req.params.id, userId);
      return res.status(200).json({ data: versions, error: null });
    } catch (error: any) {
      return res.status(400).json({ data: null, error: { message: error.message, code: 'BAD_REQUEST' } });
    }
  }

  async restoreVersion(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const cv = await CvVersionService.restoreVersion(req.params.id, req.params.versionId, userId);
      return res.status(200).json({ data: cv, error: null });
    } catch (error: any) {
      return res.status(400).json({ data: null, error: { message: error.message, code: 'RESTORE_FAILED' } });
    }
  }

  async updateCVLabel(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const versionLabel = req.body.versionLabel;
      if (!versionLabel || !versionLabel.trim()) {
        return res.status(400).json({ data: null, error: { message: 'Version label is required', code: 'INVALID_INPUT' } });
      }
      const cv = await CvVersionService.updateLabel(req.params.id, versionLabel, userId);
      return res.status(200).json({ data: cv, error: null });
    } catch (error: any) {
      return res.status(400).json({ data: null, error: { message: error.message, code: 'UPDATE_FAILED' } });
    }
  }

  async duplicateCV(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const cv = await CvVersionService.duplicateCv(req.params.id, userId);
      return res.status(201).json({ data: cv, error: null });
    } catch (error: any) {
      return res.status(400).json({ data: null, error: { message: error.message, code: 'DUPLICATE_FAILED' } });
    }
  }

  async syncSelective(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const result = await resumeParserService.syncResumeSelective(userId, req.params.id, req.body);
      return res.status(200).json({ data: result, error: null });
    } catch (error: any) {
      return res.status(400).json({ data: null, error: { message: error.message, code: 'SYNC_FAILED' } });
    }
  }

  // ==========================================
  // Blind Recruitment / Anonymized Profile
  // ==========================================
  async getAnonymizedPreview(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const anonymized = await applicantProfileService.getAnonymizedProfile(userId, (req as any).user);
      return res.status(200).json({ data: anonymized, error: null });
    } catch (error: any) {
      return res.status(400).json({ data: null, error: { message: error.message, code: 'BAD_REQUEST' } });
    }
  }

  async getAnonymizedProfileById(req: Request, res: Response) {
    try {
      const profileId = req.params.id;
      const anonymized = await applicantProfileService.getAnonymizedProfile(profileId, (req as any).user);
      return res.status(200).json({ data: anonymized, error: null });
    } catch (error: any) {
      return res.status(404).json({ data: null, error: { message: error.message, code: 'NOT_FOUND' } });
    }
  }
}

export const applicantProfileController = new ApplicantProfileController();
export default applicantProfileController;
