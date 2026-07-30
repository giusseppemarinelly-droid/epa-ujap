import type { Request, Response } from 'express';
import { z } from 'zod';

import { sanitizeUser } from '../../lib/sanitizeUser';
import * as usersService from './users.service';

const facultyEnum = z.enum([
  'INGENIERIA',
  'CIENCIAS_JURIDICAS_POLITICAS',
  'CIENCIAS_ECONOMICAS_SOCIALES',
  'CIENCIAS_DE_LA_SALUD',
]);

const discoverQuerySchema = z.object({
  faculty: facultyEnum.optional(),
  semester: z.coerce.number().int().optional(),
  career: z.string().optional(),
  interestId: z.string().optional(),
});

export async function listDiscoverableHandler(req: Request, res: Response) {
  const filters = discoverQuerySchema.parse(req.query);
  const users = await usersService.listDiscoverable({ excludeUserId: req.userId!, ...filters });
  res.json(users.map(sanitizeUser));
}
