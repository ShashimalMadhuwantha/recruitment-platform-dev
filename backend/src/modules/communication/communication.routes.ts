import { Router } from 'express';
import { communicationController } from './communication.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';

// Router for /api/v1/applications/:applicationId/...
export const applicationCommunicationRouter = Router();
applicationCommunicationRouter.use(authenticateToken);

// In-app messaging within application thread (FR-RC-17, FR-AP-25)
applicationCommunicationRouter.post(
  '/:applicationId/messages',
  (req, res, next) => communicationController.sendMessage(req, res, next)
);
applicationCommunicationRouter.get(
  '/:applicationId/messages',
  (req, res, next) => communicationController.getMessages(req, res, next)
);

// Interview scheduling within application (FR-RC-18, FR-AP-26)
applicationCommunicationRouter.post(
  '/:applicationId/interviews',
  requireRole('RECRUITER', 'SUPER_ADMIN'),
  (req, res, next) => communicationController.scheduleInterview(req, res, next)
);
applicationCommunicationRouter.get(
  '/:applicationId/interviews',
  (req, res, next) => communicationController.getApplicationInterviews(req, res, next)
);

// Router for /api/v1/interviews/:id/...
export const interviewsRouter = Router();
interviewsRouter.use(authenticateToken);

// Update interview status (e.g. cancel, reschedule)
interviewsRouter.patch(
  '/:id/status',
  (req, res, next) => communicationController.updateInterviewStatus(req, res, next)
);

// Download calendar invite .ics RFC 5545 file
interviewsRouter.get(
  '/:id/calendar.ics',
  (req, res, next) => communicationController.downloadIcsCalendar(req, res, next)
);

// Structured interviewer feedback scorecard (FR-RC-20)
interviewsRouter.post(
  '/:id/feedback',
  requireRole('RECRUITER', 'SUPER_ADMIN'),
  (req, res, next) => communicationController.submitInterviewFeedback(req, res, next)
);

export default { applicationCommunicationRouter, interviewsRouter };
