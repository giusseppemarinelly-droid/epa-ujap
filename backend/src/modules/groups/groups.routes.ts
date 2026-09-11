import { Router } from 'express';

import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import {
  createGroupHandler,
  deleteGroupHandler,
  getGroupHandler,
  joinGroupHandler,
  leaveGroupHandler,
  listGroupsHandler,
  updateGroupHandler,
} from './groups.controller';

export const groupsRouter = Router();

groupsRouter.get('/', asyncHandler(listGroupsHandler));
groupsRouter.get('/:id', asyncHandler(getGroupHandler));
groupsRouter.post('/', requireAuth, asyncHandler(createGroupHandler));
groupsRouter.patch('/:id', requireAuth, asyncHandler(updateGroupHandler));
groupsRouter.delete('/:id', requireAuth, asyncHandler(deleteGroupHandler));
groupsRouter.post('/:id/join', requireAuth, asyncHandler(joinGroupHandler));
groupsRouter.post('/:id/leave', requireAuth, asyncHandler(leaveGroupHandler));
