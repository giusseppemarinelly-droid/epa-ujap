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
  name?: string;
  faculty?: Faculty;
  career?: string;
  semester?: number;
  bio?: string;
  age?: number;
  photoUrl?: string;
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

const ALLOWED_IMAGE_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const MAX_GALLERY_PHOTOS = 6;

// `folder` separa las portadas de los avatares dentro del mismo bucket, para
// poder distinguirlas después (limpiezas, políticas de acceso) sin duplicar
// esta subida en otra función.
async function uploadImageToStorage(
  userId: string,
  imageBase64: string,
  mimeType: string,
  folder?: string
): Promise<string> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new HttpError(500, 'La subida de fotos no está configurada en el servidor');
  }

  const extension = ALLOWED_IMAGE_MIME_TYPES[mimeType];
  if (!extension) {
    throw new HttpError(400, 'Formato de imagen no soportado');
  }

  const prefix = folder ? `${folder}/` : '';
  const path = `${prefix}${userId}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}.${extension}`;
  const buffer = Buffer.from(imageBase64, 'base64');

  const uploadResponse = await fetch(`${env.SUPABASE_URL}/storage/v1/object/avatars/${path}`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': mimeType,
      'x-upsert': 'true',
    },
    body: buffer,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new HttpError(502, `No se pudo subir la imagen: ${errorText}`);
  }

  return `${env.SUPABASE_URL}/storage/v1/object/public/avatars/${path}`;
}

export async function uploadProfilePhoto(userId: string, imageBase64: string, mimeType: string) {
  const photoUrl = await uploadImageToStorage(userId, imageBase64, mimeType);

  return prisma.user.update({
    where: { id: userId },
    data: { photoUrl },
    include: { interests: { include: { interest: true } } },
  });
}

// Portada del perfil. Va al mismo bucket que los avatares pero bajo `covers/`
// porque su proporción y su uso son otros.
export async function uploadCoverPhoto(userId: string, imageBase64: string, mimeType: string) {
  const coverUrl = await uploadImageToStorage(userId, imageBase64, mimeType, 'covers');

  return prisma.user.update({
    where: { id: userId },
    data: { coverUrl },
    include: { interests: { include: { interest: true } } },
  });
}

// Galería de fotos que se muestra en el carrusel de la tarjeta de Descubrir
// (independiente del avatar único que se ve en encabezados y chats).
export async function addGalleryPhoto(userId: string, imageBase64: string, mimeType: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError(404, 'Usuario no encontrado');
  }
  if (user.photos.length >= MAX_GALLERY_PHOTOS) {
    throw new HttpError(400, `Puedes subir un máximo de ${MAX_GALLERY_PHOTOS} fotos`);
  }

  const url = await uploadImageToStorage(userId, imageBase64, mimeType);

  return prisma.user.update({
    where: { id: userId },
    data: {
      photos: [...user.photos, url],
      photoUrl: user.photoUrl ?? url,
    },
    include: { interests: { include: { interest: true } } },
  });
}

export async function removeGalleryPhoto(userId: string, photoUrl: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError(404, 'Usuario no encontrado');
  }

  const photos = user.photos.filter((url) => url !== photoUrl);
  const photoUrlUpdate = user.photoUrl === photoUrl ? (photos[0] ?? null) : user.photoUrl;

  return prisma.user.update({
    where: { id: userId },
    data: { photos, photoUrl: photoUrlUpdate },
    include: { interests: { include: { interest: true } } },
  });
}

// Solo reordena: el cuerpo tiene que ser exactamente el mismo conjunto de URLs
// que ya tiene el usuario. Así este endpoint no sirve para inyectar imágenes
// ajenas ni para borrar fotos por la puerta de atrás.
export async function reorderPhotos(userId: string, photos: string[]) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError(404, 'Usuario no encontrado');
  }

  const submitted = [...photos].sort();
  const stored = [...user.photos].sort();
  const sameSet = submitted.length === stored.length && submitted.every((url, index) => url === stored[index]);

  if (!sameSet) {
    throw new HttpError(400, 'El orden enviado no coincide con tus fotos');
  }

  return prisma.user.update({
    where: { id: userId },
    // La primera de la galería manda: es la que se ve como avatar en el resto
    // de la app, así que sigue al reordenamiento.
    data: { photos, photoUrl: photos[0] ?? user.photoUrl },
    include: { interests: { include: { interest: true } } },
  });
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

// El front llama esto cada pocos segundos mientras la app está abierta; de
// ahí se deriva el estado "en línea" (sin websockets) comparando esta marca
// de tiempo contra un umbral corto al serializar cualquier usuario.
export async function heartbeat(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { lastSeenAt: new Date() } });
}
