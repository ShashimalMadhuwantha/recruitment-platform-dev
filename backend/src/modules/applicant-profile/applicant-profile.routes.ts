import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { applicantProfileController } from './applicant-profile.controller';

export const applicantProfileRouter = Router();

// Optional multer setup with safe fallback to body parsing
let uploadMiddleware: any = (_req: any, _res: any, next: any) => next();
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const multer = require('multer');
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
  });
  uploadMiddleware = upload.single('resume');
} catch {
  // Fallback to JSON base64
}

// All routes require authentication
applicantProfileRouter.use(authenticateToken);

// ========================================================
// 1. Profile Core Endpoints
// ========================================================
applicantProfileRouter.get(
  '/profile',
  requireRole('APPLICANT', 'SUPER_ADMIN'),
  (req, res) => applicantProfileController.getProfile(req, res)
);

applicantProfileRouter.get(
  '/me',
  requireRole('APPLICANT', 'SUPER_ADMIN'),
  (req, res) => applicantProfileController.getProfile(req, res)
);

applicantProfileRouter.put(
  '/profile',
  requireRole('APPLICANT', 'SUPER_ADMIN'),
  (req, res) => applicantProfileController.updateProfile(req, res)
);

// ========================================================
// 2. Experience Endpoints
// ========================================================
applicantProfileRouter.post(
  '/profile/experience',
  requireRole('APPLICANT', 'SUPER_ADMIN'),
  (req, res) => applicantProfileController.addExperience(req, res)
);

applicantProfileRouter.put(
  '/profile/experience/:id',
  requireRole('APPLICANT', 'SUPER_ADMIN'),
  (req, res) => applicantProfileController.updateExperience(req, res)
);

applicantProfileRouter.delete(
  '/profile/experience/:id',
  requireRole('APPLICANT', 'SUPER_ADMIN'),
  (req, res) => applicantProfileController.deleteExperience(req, res)
);

// ========================================================
// 3. Education Endpoints
// ========================================================
applicantProfileRouter.post(
  '/profile/education',
  requireRole('APPLICANT', 'SUPER_ADMIN'),
  (req, res) => applicantProfileController.addEducation(req, res)
);

applicantProfileRouter.put(
  '/profile/education/:id',
  requireRole('APPLICANT', 'SUPER_ADMIN'),
  (req, res) => applicantProfileController.updateEducation(req, res)
);

applicantProfileRouter.delete(
  '/profile/education/:id',
  requireRole('APPLICANT', 'SUPER_ADMIN'),
  (req, res) => applicantProfileController.deleteEducation(req, res)
);

// ========================================================
// 4. Skills Endpoints
// ========================================================
applicantProfileRouter.post(
  '/profile/skills',
  requireRole('APPLICANT', 'SUPER_ADMIN'),
  (req, res) => applicantProfileController.addSkill(req, res)
);

applicantProfileRouter.put(
  '/profile/skills/:id',
  requireRole('APPLICANT', 'SUPER_ADMIN'),
  (req, res) => applicantProfileController.updateSkill(req, res)
);

applicantProfileRouter.delete(
  '/profile/skills/:id',
  requireRole('APPLICANT', 'SUPER_ADMIN'),
  (req, res) => applicantProfileController.deleteSkill(req, res)
);

// ========================================================
// 5. Certifications & Portfolio Endpoints
// ========================================================
applicantProfileRouter.post(
  '/profile/certifications',
  requireRole('APPLICANT', 'SUPER_ADMIN'),
  (req, res) => applicantProfileController.addCertification(req, res)
);

applicantProfileRouter.delete(
  '/profile/certifications/:id',
  requireRole('APPLICANT', 'SUPER_ADMIN'),
  (req, res) => applicantProfileController.deleteCertification(req, res)
);

applicantProfileRouter.post(
  '/profile/portfolio',
  requireRole('APPLICANT', 'SUPER_ADMIN'),
  (req, res) => applicantProfileController.addPortfolio(req, res)
);

applicantProfileRouter.delete(
  '/profile/portfolio/:id',
  requireRole('APPLICANT', 'SUPER_ADMIN'),
  (req, res) => applicantProfileController.deletePortfolio(req, res)
);

// ========================================================
// 6. Resume Upload & Management Endpoints
// ========================================================
applicantProfileRouter.post(
  '/resume',
  requireRole('APPLICANT', 'SUPER_ADMIN'),
  uploadMiddleware,
  (req, res) => applicantProfileController.uploadResume(req, res)
);

applicantProfileRouter.get(
  '/resume',
  requireRole('APPLICANT', 'SUPER_ADMIN'),
  (req, res) => applicantProfileController.listResumes(req, res)
);

applicantProfileRouter.get(
  '/resume/:id',
  requireRole('APPLICANT', 'SUPER_ADMIN'),
  (req, res) => applicantProfileController.getResume(req, res)
);

applicantProfileRouter.delete(
  '/resume/:id',
  requireRole('APPLICANT', 'SUPER_ADMIN'),
  (req, res) => applicantProfileController.deleteResume(req, res)
);

applicantProfileRouter.put(
  '/resume/:id/primary',
  requireRole('APPLICANT', 'SUPER_ADMIN'),
  (req, res) => applicantProfileController.setPrimaryResume(req, res)
);

applicantProfileRouter.post(
  '/resume/:id/apply-to-profile',
  requireRole('APPLICANT', 'SUPER_ADMIN'),
  (req, res) => applicantProfileController.applyResumeToProfile(req, res)
);

// ========================================================
// 7. Blind Recruitment / Anonymized View Endpoints
// ========================================================
applicantProfileRouter.get(
  '/profile/anonymized-preview',
  requireRole('APPLICANT', 'SUPER_ADMIN'),
  (req, res) => applicantProfileController.getAnonymizedPreview(req, res)
);

applicantProfileRouter.get(
  '/profile/:id/anonymized',
  requireRole('RECRUITER', 'SUPER_ADMIN', 'APPLICANT'),
  (req, res) => applicantProfileController.getAnonymizedProfileById(req, res)
);

export default applicantProfileRouter;
