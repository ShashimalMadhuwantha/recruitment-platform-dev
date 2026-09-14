import { Request, Response, NextFunction } from 'express';
import { communicationService } from './communication.service';
import {
  sendMessageSchema,
  createInterviewSchema,
  updateInterviewStatusSchema,
  submitFeedbackSchema,
} from './communication.types';

export class CommunicationController {
  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { applicationId } = req.params;
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;
      const validated = sendMessageSchema.parse(req.body);

      const result = await communicationService.sendMessage(
        applicationId,
        userId,
        userRole,
        validated
      );
      return res.status(201).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const { applicationId } = req.params;
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;

      const result = await communicationService.getMessages(applicationId, userId, userRole);
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  async scheduleInterview(req: Request, res: Response, next: NextFunction) {
    try {
      const { applicationId } = req.params;
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;
      const validated = createInterviewSchema.parse(req.body);

      const result = await communicationService.scheduleInterview(
        applicationId,
        userId,
        userRole,
        validated
      );
      return res.status(201).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  async getApplicationInterviews(req: Request, res: Response, next: NextFunction) {
    try {
      const { applicationId } = req.params;
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;

      const result = await communicationService.getApplicationInterviews(
        applicationId,
        userId,
        userRole
      );
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  async updateInterviewStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;
      const validated = updateInterviewStatusSchema.parse(req.body);

      const result = await communicationService.updateInterviewStatus(
        id,
        userId,
        userRole,
        validated
      );
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  async submitInterviewFeedback(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;
      const validated = submitFeedbackSchema.parse(req.body);

      const result = await communicationService.submitInterviewFeedback(
        id,
        userId,
        userRole,
        validated
      );
      return res.status(200).json({ data: result, error: null });
    } catch (err) {
      next(err);
    }
  }

  async downloadIcsCalendar(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;

      const icsData = await communicationService.generateIcsCalendar(id, userId, userRole);

      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="interview-${id}.ics"`);
      return res.send(icsData);
    } catch (err) {
      next(err);
    }
  }
}

export const communicationController = new CommunicationController();
