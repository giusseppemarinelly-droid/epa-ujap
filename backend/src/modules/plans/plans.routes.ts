import { Router } from 'express';

import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import {
  cancelPlanHandler,
  createPlanHandler,
  getPlanHandler,
  joinPlanHandler,
  leavePlanHandler,
  listPlansHandler,
  updatePlanHandler,
} from './plans.controller';

export const plansRouter = Router();

plansRouter.get('/', asyncHandler(listPlansHandler));
plansRouter.get('/:id', asyncHandler(getPlanHandler));
plansRouter.post('/', requireAuth, asyncHandler(createPlanHandler));
plansRouter.patch('/:id', requireAuth, asyncHandler(updatePlanHandler));
plansRouter.delete('/:id', requireAuth, asyncHandler(cancelPlanHandler));
plansRouter.post('/:id/join', requireAuth, asyncHandler(joinPlanHandler));
plansRouter.post('/:id/leave', requireAuth, asyncHandler(leavePlanHandler));
