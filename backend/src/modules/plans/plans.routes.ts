import { Router } from 'express';

import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import {
  createPlanHandler,
  getPlanHandler,
  joinPlanHandler,
  leavePlanHandler,
  listPlansHandler,
} from './plans.controller';

export const plansRouter = Router();

plansRouter.get('/', asyncHandler(listPlansHandler));
plansRouter.get('/:id', asyncHandler(getPlanHandler));
plansRouter.post('/', requireAuth, asyncHandler(createPlanHandler));
plansRouter.post('/:id/join', requireAuth, asyncHandler(joinPlanHandler));
plansRouter.post('/:id/leave', requireAuth, asyncHandler(leavePlanHandler));
