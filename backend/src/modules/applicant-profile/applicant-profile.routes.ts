import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';

export const applicantProfileRouter = Router();

applicantProfileRouter.get('/me', authenticateToken, (req, res) => {
  res.status(200).json({ data: { message: 'Applicant profile endpoint ready' }, error: null });
});

export default applicantProfileRouter;
