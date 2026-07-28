import { Router } from 'express';

import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import {
  loginHandler,
  meHandler,
  signupHandler,
  updateProfileHandler,
  verifyHandler,
} from './auth.controller';

export const authRouter = Router();

authRouter.post('/signup', asyncHandler(signupHandler));
authRouter.post('/verify', asyncHandler(verifyHandler));
authRouter.post('/login', asyncHandler(loginHandler));
authRouter.get('/me', requireAuth, asyncHandler(meHandler));
authRouter.patch('/me', requireAuth, asyncHandler(updateProfileHandler));
