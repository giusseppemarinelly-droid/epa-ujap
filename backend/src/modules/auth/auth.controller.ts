import type { Request, Response } from 'express';
import { z } from 'zod';

import { sanitizeUser } from '../../lib/sanitizeUser';
import * as authService from './auth.service';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  name: z.string().min(2),
});

export async function signupHandler(req: Request, res: Response) {
  const { email, password, name } = signupSchema.parse(req.body);
  const result = await authService.signup(email, password, name);
  res.status(201).json(result);
}

const verifySchema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
});

export async function verifyHandler(req: Request, res: Response) {
  const { email, token } = verifySchema.parse(req.body);
  await authService.verifyEmail(email, token);
  res.json({ ok: true });
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginHandler(req: Request, res: Response) {
  const { email, password } = loginSchema.parse(req.body);
  const { token, user } = await authService.login(email, password);
  res.json({ token, user: sanitizeUser(user) });
}

export async function meHandler(req: Request, res: Response) {
  const user = await authService.getMe(req.userId!);
  const { _count, ...rest } = user;
  res.json({
    ...sanitizeUser(rest),
    stats: { plansCreated: _count.createdPlans, attendances: _count.planAttendances },
  });
}

const facultyEnum = z.enum([
  'INGENIERIA',
  'CIENCIAS_JURIDICAS_POLITICAS',
  'CIENCIAS_ECONOMICAS_SOCIALES',
  'CIENCIAS_DE_LA_SALUD',
]);

const lookingForEnum = z.enum(['DEPORTES', 'ESTUDIO', 'PROYECTOS', 'AMISTADES', 'EVENTOS']);

const updateProfileSchema = z.object({
  faculty: facultyEnum.optional(),
  career: z.string().min(2).optional(),
  semester: z.number().int().min(1).max(12).optional(),
  bio: z.string().max(280).optional(),
  age: z.number().int().min(16).max(99).optional(),
  interestIds: z.array(z.string()).optional(),
  lookingFor: z.array(lookingForEnum).optional(),
});

export async function updateProfileHandler(req: Request, res: Response) {
  const data = updateProfileSchema.parse(req.body);
  const user = await authService.updateProfile(req.userId!, data);
  res.json(sanitizeUser(user));
}
