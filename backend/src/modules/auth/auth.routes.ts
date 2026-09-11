import { Router } from 'express';

import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import {
  addGalleryPhotoHandler,
  heartbeatHandler,
  loginHandler,
  meHandler,
  refreshHandler,
  removeGalleryPhotoHandler,
  reorderPhotosHandler,
  resendHandler,
  signupHandler,
  updateProfileHandler,
  uploadCoverHandler,
  uploadPhotoHandler,
  verifyHandler,
} from './auth.controller';

export const authRouter = Router();

authRouter.post('/signup', asyncHandler(signupHandler));
authRouter.post('/verify', asyncHandler(verifyHandler));
authRouter.post('/resend', asyncHandler(resendHandler));
authRouter.post('/login', asyncHandler(loginHandler));
authRouter.get('/me', requireAuth, asyncHandler(meHandler));
authRouter.post('/refresh', requireAuth, asyncHandler(refreshHandler));
authRouter.post('/heartbeat', requireAuth, asyncHandler(heartbeatHandler));
authRouter.patch('/me', requireAuth, asyncHandler(updateProfileHandler));
authRouter.post('/me/photo', requireAuth, asyncHandler(uploadPhotoHandler));
authRouter.post('/me/cover', requireAuth, asyncHandler(uploadCoverHandler));
authRouter.post('/me/photos', requireAuth, asyncHandler(addGalleryPhotoHandler));
authRouter.patch('/me/photos/order', requireAuth, asyncHandler(reorderPhotosHandler));
authRouter.delete('/me/photos', requireAuth, asyncHandler(removeGalleryPhotoHandler));
