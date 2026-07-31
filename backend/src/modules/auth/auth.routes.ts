import { Router } from 'express';

import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import {
  addGalleryPhotoHandler,
  heartbeatHandler,
  loginHandler,
  meHandler,
  removeGalleryPhotoHandler,
  signupHandler,
  updateProfileHandler,
  uploadPhotoHandler,
  verifyHandler,
} from './auth.controller';

export const authRouter = Router();

authRouter.post('/signup', asyncHandler(signupHandler));
authRouter.post('/verify', asyncHandler(verifyHandler));
authRouter.post('/login', asyncHandler(loginHandler));
authRouter.get('/me', requireAuth, asyncHandler(meHandler));
authRouter.post('/heartbeat', requireAuth, asyncHandler(heartbeatHandler));
authRouter.patch('/me', requireAuth, asyncHandler(updateProfileHandler));
authRouter.post('/me/photo', requireAuth, asyncHandler(uploadPhotoHandler));
authRouter.post('/me/photos', requireAuth, asyncHandler(addGalleryPhotoHandler));
authRouter.delete('/me/photos', requireAuth, asyncHandler(removeGalleryPhotoHandler));
