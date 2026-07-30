import { Router } from 'express';

import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import { listDiscoverableHandler } from './users.controller';

export const usersRouter = Router();

usersRouter.use(requireAuth);
usersRouter.get('/', asyncHandler(listDiscoverableHandler));
