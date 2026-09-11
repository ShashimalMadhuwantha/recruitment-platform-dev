import { Request, Response, NextFunction } from 'express';
import { ApplicationService } from './application.service';
import { pipelineManagementService } from './pipeline-management.service';

const applicationService = new ApplicationService();

export class ApplicationController {
  /**
   * POST /api/v1/applications
   * Submit an application
   */
  async submitApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await applicationService.submitApplication(req.body, req.user!.id);
      return res.status(201).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/applications/my-applications
   * List authenticated applicant's applications
   */
  async getMyApplications(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await applicationService.getMyApplications(req.user!.id);
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/applications/:id
   * Get single application details
   */
  async getApplicationById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await applicationService.getApplicationById(
        req.params.id,
        req.user!.id,
        req.user!.role
      );
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/applications/:id/withdraw
   * Withdraw an active application
   */
  async withdrawApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await applicationService.withdrawApplication(
        req.params.id,
        req.user!.id,
        req.body?.reason
      );
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/applications/jobs/:jobId
   * List all applications for a vacancy (Recruiter Pipeline with filtering & sorting)
   */
  async getJobApplications(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await pipelineManagementService.getJobApplicationsWithFilters(
        req.params.jobId,
        req.user!.id,
        req.user!.role,
        {
          search: req.query.search as string,
          status: req.query.status as string,
          scoreBand: req.query.scoreBand as string,
          sortBy: req.query.sortBy as any,
          sortOrder: req.query.sortOrder as any,
        }
      );
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/applications/:id/stage
   * Move single candidate stage with audit trail (FR-RC-12)
   */
  async moveCandidateStage(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await pipelineManagementService.moveCandidateStage(
        req.params.id,
        req.user!.id,
        req.user!.role,
        req.body
      );
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/applications/bulk-stage
   * Move multiple candidates stage (FR-RC-14)
   */
  async bulkMoveCandidateStage(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await pipelineManagementService.bulkMoveCandidateStage(
        req.user!.id,
        req.user!.role,
        req.body
      );
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/applications/:id/notes
   * Add internal recruiter team note and rating (FR-RC-15)
   */
  async addCandidateNote(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await pipelineManagementService.addCandidateNote(
        req.params.id,
        req.user!.id,
        req.user!.role,
        req.body
      );
      return res.status(201).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/applications/:id/notes
   * Get candidate notes (FR-RC-15)
   */
  async getCandidateNotes(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await pipelineManagementService.getCandidateNotes(
        req.params.id,
        req.user!.id,
        req.user!.role
      );
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/applications/notes/:noteId
   * Delete internal recruiter note (FR-RC-15)
   */
  async deleteCandidateNote(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await pipelineManagementService.deleteCandidateNote(
        req.params.noteId,
        req.user!.id,
        req.user!.role
      );
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/applications/compare
   * Side-by-side comparison for 2 to 4 candidates (FR-RC-16)
   */
  async compareCandidates(req: Request, res: Response, next: NextFunction) {
    try {
      const { applicationIds } = req.body;
      const result = await pipelineManagementService.compareCandidates(
        applicationIds,
        req.user!.id,
        req.user!.role
      );
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }
}

export default new ApplicationController();
