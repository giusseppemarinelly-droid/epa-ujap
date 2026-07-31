import { Router } from 'express';

import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import {
  listIncomingHandler,
  listSentHandler,
  respondToConnectionHandler,
  sendConnectionHandler,
} from './connections.controller';

export const connectionsRouter = Router();

connectionsRouter.use(requireAuth);
connectionsRouter.get('/incoming', asyncHandler(listIncomingHandler));
connectionsRouter.get('/sent', asyncHandler(listSentHandler));
connectionsRouter.post('/', asyncHandler(sendConnectionHandler));
connectionsRouter.post('/:id/respond', asyncHandler(respondToConnectionHandler));
