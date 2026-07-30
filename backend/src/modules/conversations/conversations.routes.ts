import { Router } from 'express';

import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import {
  createGroupConversationHandler,
  getMessagesHandler,
  listConversationsHandler,
  markReadHandler,
  sendMessageHandler,
  startDirectConversationHandler,
} from './conversations.controller';

export const conversationsRouter = Router();

conversationsRouter.use(requireAuth);
conversationsRouter.get('/', asyncHandler(listConversationsHandler));
conversationsRouter.post('/direct', asyncHandler(startDirectConversationHandler));
conversationsRouter.post('/group', asyncHandler(createGroupConversationHandler));
conversationsRouter.get('/:id/messages', asyncHandler(getMessagesHandler));
conversationsRouter.post('/:id/messages', asyncHandler(sendMessageHandler));
conversationsRouter.post('/:id/read', asyncHandler(markReadHandler));
