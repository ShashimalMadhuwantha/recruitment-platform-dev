import { Router } from 'express';
import { AtsScoringController } from './ats-scoring.controller';
import { authenticateToken } from '../../middleware/auth.middleware';

export const atsScoringRouter = Router();

// Public / Authenticated preview endpoint for testing scoring before applying (FR-ATS-02)
atsScoringRouter.post('/preview', AtsScoringController.previewScore);

// Score or re-score a specific application (FR-ATS-01 / FR-ATS-08)
atsScoringRouter.post('/applications/:applicationId/score', authenticateToken, AtsScoringController.scoreApplication);

export default atsScoringRouter;
