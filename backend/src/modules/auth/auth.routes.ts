import { Router } from 'express';
import rateLimit from 'express-rate-limit';

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

// Protege signup/verify/resend contra abuso (spam de correos, tanteo de
// códigos) y login contra fuerza bruta. Los límites son generosos para no
// molestar a alguien que solo se equivocó un par de veces.
const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Espera unos minutos y vuelve a intentar.' },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Espera unos minutos y vuelve a intentar.' },
});

authRouter.post('/signup', signupLimiter, asyncHandler(signupHandler));
authRouter.post('/verify', signupLimiter, asyncHandler(verifyHandler));
authRouter.post('/resend', signupLimiter, asyncHandler(resendHandler));
authRouter.post('/login', loginLimiter, asyncHandler(loginHandler));
authRouter.get('/me', requireAuth, asyncHandler(meHandler));
authRouter.post('/refresh', requireAuth, asyncHandler(refreshHandler));
authRouter.post('/heartbeat', requireAuth, asyncHandler(heartbeatHandler));
authRouter.patch('/me', requireAuth, asyncHandler(updateProfileHandler));
authRouter.post('/me/photo', requireAuth, asyncHandler(uploadPhotoHandler));
authRouter.post('/me/cover', requireAuth, asyncHandler(uploadCoverHandler));
authRouter.post('/me/photos', requireAuth, asyncHandler(addGalleryPhotoHandler));
authRouter.patch('/me/photos/order', requireAuth, asyncHandler(reorderPhotosHandler));
authRouter.delete('/me/photos', requireAuth, asyncHandler(removeGalleryPhotoHandler));
