import crypto from 'node:crypto';

import { MessageKind } from '@prisma/client';

import { env } from '../../config/env';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../middleware/errorHandler';

// La racha exige que los dos hayan mandado foto o video en las últimas 24h.
// Pasadas 48h sin sumar un día nuevo se considera muerta: así una racha se
// puede mantener con un intercambio diario, pero perdonar un despiste corto.
const STREAK_ACTIVE_WINDOW_MS = 24 * 60 * 60 * 1000;
const STREAK_EXPIRY_MS = 48 * 60 * 60 * 1000;

// El body de la API tope en 25mb y base64 engorda el archivo un ~33%, así que
// el original no puede pasar de ~18mb: por encima de eso Express corta la
// petición antes de que lleguemos a validar nada y el error sale genérico.
const MAX_MEDIA_BYTES = 18 * 1024 * 1024;

const IMAGE_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const VIDEO_MIME_TYPES: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
};

// Mismo bucket que los avatares, separado por el prefijo `chat/`, igual que
// `covers/`. Evita tener que crear y configurar otro bucket público a mano.
const MEDIA_BUCKET = 'avatars';

export async function listConversations(userId: string) {
  const participations = await prisma.conversationParticipant.findMany({
    where: { userId },
    include: {
      conversation: {
        include: {
          participants: { include: { user: true } },
          messages: { orderBy: { sentAt: 'desc' }, take: 1 },
        },
      },
    },
  });

  const now = new Date();
  // Si la caducidad solo se revisara al escribir, una racha muerta se quedaría
  // mostrando su último número hasta que alguien mandara algo. Se limpia aquí.
  const expiredIds = participations
    .filter(({ conversation }) => conversation.streakCount > 0 && isStreakExpired(conversation.streakDate, now))
    .map(({ conversation }) => conversation.id);

  if (expiredIds.length > 0) {
    await prisma.conversation.updateMany({
      where: { id: { in: expiredIds } },
      data: { streakCount: 0, streakDate: null },
    });
  }

  return participations.map(({ conversation, unreadCount }) => ({
    ...conversation,
    unreadCount,
    streakCount: expiredIds.includes(conversation.id) ? 0 : conversation.streakCount,
    lastMessage: conversation.messages[0] ?? null,
  }));
}

async function assertParticipant(conversationId: string, userId: string) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!participant) {
    throw new HttpError(403, 'No perteneces a esta conversación');
  }
}

export async function getMessages(conversationId: string, userId: string) {
  await assertParticipant(conversationId, userId);
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { sentAt: 'asc' },
    include: { sender: true, views: { select: { userId: true } } },
  });

  // La URL de un Snap no viaja en la lista. Si viajara, esconder la foto sería
  // puro teatro: el cliente ya la tendría descargada y bastaría con mirar la
  // respuesta. Solo se entrega al abrirlo, y una sola vez.
  return messages.map(({ views, ...message }) => {
    const viewedByMe = views.some((view) => view.userId === userId);
    const openedByOthers = views.some((view) => view.userId !== message.senderId);
    if (!message.ephemeral) {
      return { ...message, viewedByMe: false, openedByOthers: false };
    }
    return { ...message, mediaUrl: null, viewedByMe, openedByOthers };
  });
}

/**
 * Abre un Snap: lo marca como visto por quien lo abre y devuelve la URL una
 * única vez. Cuando ya lo vieron todos los destinatarios, el archivo se borra
 * de Supabase Storage para que la URL deje de servir de verdad.
 */
export async function openSnap(conversationId: string, messageId: string, userId: string) {
  await assertParticipant(conversationId, userId);

  const message = await prisma.message.findFirst({
    where: { id: messageId, conversationId },
    include: { views: { select: { userId: true } } },
  });
  if (!message) throw new HttpError(404, 'Mensaje no encontrado');
  if (!message.ephemeral) throw new HttpError(400, 'Ese mensaje no es un Snap');
  if (!message.mediaUrl) throw new HttpError(410, 'Ese Snap ya no está disponible');
  if (message.senderId === userId) throw new HttpError(403, 'No puedes volver a ver lo que enviaste');
  if (message.views.some((view) => view.userId === userId)) {
    throw new HttpError(410, 'Ya viste ese Snap');
  }

  const mediaUrl = message.mediaUrl;
  await prisma.messageView.create({ data: { messageId, userId } });

  // ¿Ya lo vieron todos menos quien lo mandó? Entonces se destruye.
  const recipients = await prisma.conversationParticipant.count({
    where: { conversationId, userId: { not: message.senderId } },
  });
  const viewers = await prisma.messageView.count({ where: { messageId } });

  if (viewers >= recipients) {
    await deleteChatMediaFromStorage(mediaUrl);
    await prisma.message.update({ where: { id: messageId }, data: { mediaUrl: null } });
  }

  return { mediaUrl, kind: message.kind };
}

function isStreakExpired(streakDate: Date | null, now: Date) {
  if (!streakDate) return false;
  return now.getTime() - streakDate.getTime() > STREAK_EXPIRY_MS;
}

// Comparación por día natural del servidor. La racha se cuenta en días, no en
// bloques de 24h, para que "hoy le mandé una foto" signifique lo que parece.
function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

type StreakState = { streakCount: number; streakDate: Date | null };

/**
 * Estado de la racha después de que alguien manda algo. `sentMedia` distingue
 * el mensaje de texto (que nunca suma, solo puede constatar la caducidad) del
 * de foto o video.
 */
function resolveStreak(
  current: StreakState,
  otherLastMediaAt: Date | null,
  sentMedia: boolean,
  now: Date
): StreakState {
  const base: StreakState = isStreakExpired(current.streakDate, now)
    ? { streakCount: 0, streakDate: null }
    : current;

  if (!sentMedia) return base;

  // Quien manda acaba de cumplir; falta que el otro lo haya hecho hace poco.
  const otherIsActive =
    otherLastMediaAt !== null && now.getTime() - otherLastMediaAt.getTime() <= STREAK_ACTIVE_WINDOW_MS;
  if (!otherIsActive) return base;

  // Un día suma una sola vez, por mucho que se manden fotos toda la tarde.
  if (base.streakDate !== null && isSameDay(base.streakDate, now)) return base;

  return { streakCount: base.streakCount + 1, streakDate: now };
}

/**
 * Copia deliberada de `uploadImageToStorage` de auth.service.ts: la subida a
 * Supabase por REST vive allá y no se puede importar sin tocar ese archivo.
 * Conviene extraerla a `lib/storage.ts` y que ambos módulos la compartan.
 */
async function uploadChatMediaToStorage(
  conversationId: string,
  mediaBase64: string,
  mimeType: string,
  kind: MessageKind
): Promise<string> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new HttpError(500, 'La subida de archivos no está configurada en el servidor');
  }

  const isVideo = kind === MessageKind.VIDEO;
  const extension = isVideo ? VIDEO_MIME_TYPES[mimeType] : IMAGE_MIME_TYPES[mimeType];
  if (!extension) {
    throw new HttpError(400, isVideo ? 'Formato de video no soportado' : 'Formato de imagen no soportado');
  }

  // Se mide sobre el base64 (descontando el relleno) para rechazar el archivo
  // pesado antes de reservar el buffer con los megas decodificados.
  const padding = mediaBase64.endsWith('==') ? 2 : mediaBase64.endsWith('=') ? 1 : 0;
  const sizeInBytes = Math.floor((mediaBase64.length * 3) / 4) - padding;
  if (sizeInBytes > MAX_MEDIA_BYTES) {
    throw new HttpError(
      413,
      isVideo ? 'El video es muy pesado, graba uno más corto' : 'La foto es muy pesada, prueba con otra'
    );
  }

  const path = `chat/${conversationId}/${crypto.randomUUID()}.${extension}`;
  const buffer = Buffer.from(mediaBase64, 'base64');

  const uploadResponse = await fetch(`${env.SUPABASE_URL}/storage/v1/object/${MEDIA_BUCKET}/${path}`, {
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
    throw new HttpError(502, `No se pudo subir el archivo: ${errorText}`);
  }

  return `${env.SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${path}`;
}

/** Borra el archivo de Supabase Storage a partir de su URL pública. */
async function deleteChatMediaFromStorage(publicUrl: string) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return;
  const marker = `/storage/v1/object/public/${MEDIA_BUCKET}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return;
  const path = publicUrl.slice(index + marker.length);

  try {
    await fetch(`${env.SUPABASE_URL}/storage/v1/object/${MEDIA_BUCKET}/${path}`, {
      method: 'DELETE',
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
  } catch {
    // Si el borrado falla el Snap ya quedó inaccesible desde la app igual,
    // porque mediaUrl se pone en null. No vale la pena tumbar la petición.
  }
}

export type SendMessageInput = {
  kind: MessageKind;
  text?: string;
  mediaBase64?: string;
  mimeType?: string;
  /** Un Snap de cámara: se ve una vez y se destruye. Galería manda false. */
  ephemeral?: boolean;
};

// Acepta un string suelto por compatibilidad: connections.service manda el
// saludo automático de una conexión aceptada como texto plano.
export async function sendMessage(
  conversationId: string,
  userId: string,
  input: string | SendMessageInput
) {
  await assertParticipant(conversationId, userId);

  const payload: SendMessageInput = typeof input === 'string' ? { kind: MessageKind.TEXTO, text: input } : input;
  const isMedia = payload.kind !== MessageKind.TEXTO;

  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation) {
    throw new HttpError(404, 'Conversación no encontrada');
  }

  let mediaUrl: string | null = null;
  if (isMedia) {
    const { mediaBase64, mimeType } = payload;
    if (!mediaBase64 || !mimeType) {
      throw new HttpError(400, 'Falta el archivo por enviar');
    }
    // Fuera de la transacción a propósito: subir a Supabase es una llamada de
    // red lenta y mantendría la transacción abierta contra Postgres.
    mediaUrl = await uploadChatMediaToStorage(conversationId, mediaBase64, mimeType, payload.kind);
  }

  // La racha se toca dentro de la misma transacción que crea el mensaje para
  // que no quede una foto guardada con la racha sin actualizar, ni al revés.
  return prisma.$transaction(async (tx) => {
    const message = await tx.message.create({
      data: {
        conversationId,
        senderId: userId,
        text: payload.text?.trim() ?? '',
        kind: payload.kind,
        mediaUrl,
        // Solo la media puede ser efímera; un texto siempre se queda.
        ephemeral: isMedia && payload.ephemeral === true,
      },
      include: { sender: true },
    });

    await tx.conversationParticipant.updateMany({
      where: { conversationId, userId: { not: userId } },
      data: { unreadCount: { increment: 1 } },
    });

    // Los chats de plan y de grupo no llevan racha: ahí no hay "los dos".
    if (conversation.type !== 'DIRECTA') {
      return { message, streakCount: 0 };
    }

    const now = message.sentAt;

    if (isMedia) {
      await tx.conversationParticipant.update({
        where: { conversationId_userId: { conversationId, userId } },
        data: { lastMediaAt: now },
      });
    }

    const other = await tx.conversationParticipant.findFirst({
      where: { conversationId, userId: { not: userId } },
    });

    const streak = resolveStreak(
      { streakCount: conversation.streakCount, streakDate: conversation.streakDate },
      other?.lastMediaAt ?? null,
      isMedia,
      now
    );

    if (
      streak.streakCount !== conversation.streakCount ||
      streak.streakDate?.getTime() !== conversation.streakDate?.getTime()
    ) {
      await tx.conversation.update({ where: { id: conversationId }, data: streak });
    }

    return { message, streakCount: streak.streakCount };
  });
}

export async function markRead(conversationId: string, userId: string) {
  await assertParticipant(conversationId, userId);
  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { unreadCount: 0 },
  });
}

export async function getOrCreateDirectConversation(userId: string, otherUserId: string) {
  if (userId === otherUserId) {
    throw new HttpError(400, 'No puedes iniciar una conversación contigo mismo');
  }

  const existing = await prisma.conversation.findFirst({
    where: {
      type: 'DIRECTA',
      AND: [{ participants: { some: { userId } } }, { participants: { some: { userId: otherUserId } } }],
    },
    include: { participants: { include: { user: true } } },
  });

  if (existing) {
    return existing;
  }

  return prisma.conversation.create({
    data: {
      type: 'DIRECTA',
      participants: { create: [{ userId }, { userId: otherUserId }] },
    },
    include: { participants: { include: { user: true } } },
  });
}

export async function createGroupConversation(creatorId: string, participantIds: string[], title: string) {
  const uniqueParticipantIds = Array.from(new Set([creatorId, ...participantIds]));

  return prisma.conversation.create({
    data: {
      type: 'GRUPO',
      title,
      participants: { create: uniqueParticipantIds.map((userId) => ({ userId })) },
    },
    include: { participants: { include: { user: true } } },
  });
}
