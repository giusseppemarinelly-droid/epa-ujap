import { prisma } from '../../lib/prisma';
import { HttpError } from '../../middleware/errorHandler';

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

  return participations.map(({ conversation, unreadCount }) => ({
    ...conversation,
    unreadCount,
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
  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { sentAt: 'asc' },
    include: { sender: true },
  });
}

export async function sendMessage(conversationId: string, userId: string, text: string) {
  await assertParticipant(conversationId, userId);

  const message = await prisma.message.create({
    data: { conversationId, senderId: userId, text },
    include: { sender: true },
  });

  await prisma.conversationParticipant.updateMany({
    where: { conversationId, userId: { not: userId } },
    data: { unreadCount: { increment: 1 } },
  });

  return message;
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
