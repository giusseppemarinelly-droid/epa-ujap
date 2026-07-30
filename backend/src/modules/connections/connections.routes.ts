import { Router } from 'express';

import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import { sendConnectionHandler } from './connections.controller';

export const connectionsRouter = Router();

connectionsRouter.use(requireAuth);
connectionsRouter.post('/', asyncHandler(sendConnectionHandler));
