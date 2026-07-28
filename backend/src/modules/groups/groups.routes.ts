import { Router } from 'express';

import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import {
  createGroupHandler,
  getGroupHandler,
  joinGroupHandler,
  leaveGroupHandler,
  listGroupsHandler,
} from './groups.controller';

export const groupsRouter = Router();

groupsRouter.get('/', asyncHandler(listGroupsHandler));
groupsRouter.get('/:id', asyncHandler(getGroupHandler));
groupsRouter.post('/', requireAuth, asyncHandler(createGroupHandler));
groupsRouter.post('/:id/join', requireAuth, asyncHandler(joinGroupHandler));
groupsRouter.post('/:id/leave', requireAuth, asyncHandler(leaveGroupHandler));
