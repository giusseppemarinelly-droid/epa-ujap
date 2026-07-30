import crypto from 'node:crypto';

import bcrypt from 'bcryptjs';
import type { Faculty, LookingFor } from '@prisma/client';

import { env } from '../../config/env';
import { signToken } from '../../lib/jwt';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../middleware/errorHandler';

export function assertInstitutionalEmail(email: string) {
  const domain = email.split('@')[1]?.toLowerCase();
  if (domain !== env.ALLOWED_EMAIL_DOMAIN.toLowerCase()) {
    throw new HttpError(400, `El correo debe pertenecer al dominio @${env.ALLOWED_EMAIL_DOMAIN}`);
  }
}

export async function signup(email: string, password: string, name: string) {
  assertInstitutionalEmail(email);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new HttpError(409, 'Ya existe una cuenta con ese correo');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const verificationToken = crypto.randomBytes(3).toString('hex').toUpperCase();

  const user = await prisma.user.create({
    data: { email, passwordHash, name, verificationToken },
  });

  return { userId: user.id, verificationToken };
}

export async function verifyEmail(email: string, token: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.verificationToken !== token) {
    throw new HttpError(400, 'Código de verificación inválido');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { verified: true, verificationToken: null },
  });
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new HttpError(401, 'Correo o contraseña incorrectos');
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new HttpError(401, 'Correo o contraseña incorrectos');
  }

  if (!user.verified) {
    throw new HttpError(403, 'Verifica tu correo antes de iniciar sesión');
  }

  const token = signToken({ userId: user.id });
  return { token, user };
}

type ProfileUpdateInput = {
  faculty?: Faculty;
  career?: string;
  semester?: number;
  bio?: string;
  age?: number;
  interestIds?: string[];
  lookingFor?: LookingFor[];
};

export async function updateProfile(userId: string, data: ProfileUpdateInput) {
  const { interestIds, ...rest } = data;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...rest,
      ...(interestIds
        ? {
            interests: {
              deleteMany: {},
              create: interestIds.map((interestId) => ({ interestId })),
            },
          }
        : {}),
    },
    include: { interests: { include: { interest: true } } },
  });

  return user;
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      interests: { include: { interest: true } },
      _count: { select: { createdPlans: true, planAttendances: true } },
    },
  });
  if (!user) {
    throw new HttpError(404, 'Usuario no encontrado');
  }
  return user;
}
