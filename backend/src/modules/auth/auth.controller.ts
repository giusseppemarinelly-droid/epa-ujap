import type { Request, Response } from 'express';
import { z } from 'zod';

import { signToken } from '../../lib/jwt';
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

const resendSchema = z.object({ email: z.string().email() });

export async function resendHandler(req: Request, res: Response) {
  const { email } = resendSchema.parse(req.body);
  await authService.resendVerification(email);
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

// Renueva el token en cada arranque con sesión válida. Sin esto el mes de
// vigencia correría desde el login, y a quien usa la app todos los días lo
// sacaría igual al día 30. Con la renovación, el mes cuenta desde la última
// vez que se abrió la app.
export async function refreshHandler(req: Request, res: Response) {
  res.json({ token: signToken({ userId: req.userId! }) });
}

export async function heartbeatHandler(req: Request, res: Response) {
  await authService.heartbeat(req.userId!);
  res.json({ ok: true });
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
  name: z.string().min(2).max(80).optional(),
  faculty: facultyEnum.optional(),
  career: z.string().min(2).optional(),
  semester: z.number().int().min(1).max(12).optional(),
  bio: z.string().max(280).optional(),
  age: z.number().int().min(16).max(99).optional(),
  // photoUrl NO va aquí a propósito: solo se cambia vía /me/photo (o
  // /me/photos), que pasa por uploadImageToStorage y valida el archivo.
  // Aceptarlo por PATCH dejaría fijar cualquier URL externa sin validar.
  interestIds: z.array(z.string()).optional(),
  lookingFor: z.array(lookingForEnum).optional(),
});

export async function updateProfileHandler(req: Request, res: Response) {
  const data = updateProfileSchema.parse(req.body);
  const user = await authService.updateProfile(req.userId!, data);
  res.json(sanitizeUser(user));
}

const uploadPhotoSchema = z.object({
  imageBase64: z.string().min(1),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
});

export async function uploadPhotoHandler(req: Request, res: Response) {
  const { imageBase64, mimeType } = uploadPhotoSchema.parse(req.body);
  const user = await authService.uploadProfilePhoto(req.userId!, imageBase64, mimeType);
  res.json(sanitizeUser(user));
}

export async function uploadCoverHandler(req: Request, res: Response) {
  const { imageBase64, mimeType } = uploadPhotoSchema.parse(req.body);
  const user = await authService.uploadCoverPhoto(req.userId!, imageBase64, mimeType);
  res.json(sanitizeUser(user));
}

export async function addGalleryPhotoHandler(req: Request, res: Response) {
  const { imageBase64, mimeType } = uploadPhotoSchema.parse(req.body);
  const user = await authService.addGalleryPhoto(req.userId!, imageBase64, mimeType);
  res.status(201).json(sanitizeUser(user));
}

// El servicio es quien valida que sea el mismo conjunto de fotos; aquí solo
// se comprueba la forma.
const reorderPhotosSchema = z.object({ photos: z.array(z.string().url()).max(6) });

export async function reorderPhotosHandler(req: Request, res: Response) {
  const { photos } = reorderPhotosSchema.parse(req.body);
  const user = await authService.reorderPhotos(req.userId!, photos);
  res.json(sanitizeUser(user));
}

const removeGalleryPhotoSchema = z.object({ photoUrl: z.string().url() });

export async function removeGalleryPhotoHandler(req: Request, res: Response) {
  const { photoUrl } = removeGalleryPhotoSchema.parse(req.body);
  const user = await authService.removeGalleryPhoto(req.userId!, photoUrl);
  res.json(sanitizeUser(user));
}
