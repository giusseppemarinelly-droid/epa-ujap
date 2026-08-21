import { Router } from 'express';

import { asyncHandler } from '../../lib/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import { listPeopleHandler, updateLocationHandler, updateSharingHandler } from './location.controller';

export const locationRouter = Router();

// Todo el módulo va detrás de requireAuth: la ubicación de la gente no se
// muestra a nadie de fuera de la comunidad.
locationRouter.post('/', requireAuth, asyncHandler(updateLocationHandler));
locationRouter.patch('/sharing', requireAuth, asyncHandler(updateSharingHandler));
locationRouter.get('/people', requireAuth, asyncHandler(listPeopleHandler));
