import { Router } from 'express';

import { asyncHandler } from '../../lib/asyncHandler';
import { prisma } from '../../lib/prisma';

export const interestsRouter = Router();

interestsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const interests = await prisma.interest.findMany({ orderBy: { label: 'asc' } });
    res.json(interests);
  })
);
