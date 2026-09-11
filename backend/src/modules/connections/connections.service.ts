import { prisma } from '../../lib/prisma';
import { HttpError } from '../../middleware/errorHandler';
import { getOrCreateDirectConversation, sendMessage } from '../conversations/conversations.service';

const GREETINGS = ['¡Epa! 👋 Ya podemos hablar.', 'Epa, ¿qué tal? 👋', '¡Qué bien, hablemos! 👋'];

export async function sendConnection(requesterId: string, receiverId: string) {
  if (requesterId === receiverId) {
    throw new HttpError(400, 'No puedes conectar contigo mismo');
  }

  // La restricción única es direccional ([requesterId, receiverId]), así que
  // si la otra persona ya te había mandado una solicitud pendiente, aceptarla
  // en vez de crear una segunda fila cruzada que se quedaría colgada.
  const reverse = await prisma.connection.findUnique({
    where: { requesterId_receiverId: { requesterId: receiverId, receiverId: requesterId } },
  });
  if (reverse) {
    if (reverse.status === 'PENDIENTE') {
      return respondToConnection(reverse.id, requesterId, true).then((result) => result.connection);
    }
    if (reverse.status === 'ACEPTADA') {
      return reverse;
    }
  }

  return prisma.connection.upsert({
    where: { requesterId_receiverId: { requesterId, receiverId } },
    update: {},
    create: { requesterId, receiverId },
  });
}

// Deshacer un "conectar" en Descubrir: solo tiene sentido mientras la
// solicitud sigue pendiente y es de quien la mandó.
export async function cancelConnection(connectionId: string, requesterId: string) {
  const connection = await prisma.connection.findUnique({ where: { id: connectionId } });
  if (!connection) return;
  if (connection.requesterId !== requesterId) {
    throw new HttpError(403, 'Esta solicitud no es tuya');
  }
  if (connection.status !== 'PENDIENTE') {
    throw new HttpError(400, 'Ya no se puede cancelar esta solicitud');
  }
  await prisma.connection.delete({ where: { id: connectionId } });
}

export async function listIncoming(receiverId: string) {
  return prisma.connection.findMany({
    where: { receiverId, status: 'PENDIENTE' },
    include: { requester: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function listSent(requesterId: string) {
  return prisma.connection.findMany({
    where: { requesterId },
    include: { receiver: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function respondToConnection(connectionId: string, receiverId: string, accept: boolean) {
  const connection = await prisma.connection.findUnique({ where: { id: connectionId } });
  if (!connection) {
    throw new HttpError(404, 'Solicitud no encontrada');
  }
  if (connection.receiverId !== receiverId) {
    throw new HttpError(403, 'Esta solicitud no es tuya');
  }
  if (connection.status !== 'PENDIENTE') {
    throw new HttpError(400, 'Ya respondiste esta solicitud');
  }

  const updated = await prisma.connection.update({
    where: { id: connectionId },
    data: { status: accept ? 'ACEPTADA' : 'RECHAZADA' },
  });

  if (!accept) {
    return { connection: updated, conversationId: null };
  }

  const conversation = await getOrCreateDirectConversation(receiverId, connection.requesterId);
  const greeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
  await sendMessage(conversation.id, receiverId, greeting);

  return { connection: updated, conversationId: conversation.id };
}
