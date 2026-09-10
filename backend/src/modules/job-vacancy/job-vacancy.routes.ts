import { Router } from 'express';

export const jobVacancyRouter = Router();

jobVacancyRouter.get('/', (_req, res) => {
  res.status(200).json({ data: [], total: 0, error: null });
});

export default jobVacancyRouter;
