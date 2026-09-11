import type { GroupCategory } from '@prisma/client';

import { prisma } from '../../lib/prisma';
import { HttpError } from '../../middleware/errorHandler';

const groupWithRelations = {
  members: { include: { user: true } },
  conversation: { select: { id: true } },
} as const;

export async function listGroups(category?: GroupCategory) {
  return prisma.group.findMany({
    where: category ? { category } : undefined,
    include: groupWithRelations,
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    take: 200,
  });
}

export async function getGroup(groupId: string) {
  const group = await prisma.group.findUnique({ where: { id: groupId }, include: groupWithRelations });
  if (!group) {
    throw new HttpError(404, 'Grupo no encontrado');
  }
  return group;
}

type CreateGroupInput = {
  name: string;
  category: GroupCategory;
  description: string;
  imageUrl?: string;
};

export async function createGroup(creatorId: string, data: CreateGroupInput) {
  return prisma.group.create({
    data: {
      ...data,
      creatorId,
      members: { create: { userId: creatorId } },
      conversation: {
        create: {
          type: 'GRUPO',
          title: data.name,
          participants: { create: { userId: creatorId } },
        },
      },
    },
    include: groupWithRelations,
  });
}

async function syncConversationParticipant(groupId: string, userId: string, action: 'add' | 'remove') {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { conversation: { select: { id: true } } },
  });
  if (!group?.conversation) return;

  if (action === 'add') {
    await prisma.conversationParticipant.upsert({
      where: { conversationId_userId: { conversationId: group.conversation.id, userId } },
      update: {},
      create: { conversationId: group.conversation.id, userId },
    });
  } else {
    await prisma.conversationParticipant.deleteMany({
      where: { conversationId: group.conversation.id, userId },
    });
  }
}

export async function joinGroup(groupId: string, userId: string) {
  await prisma.groupMember.upsert({
    where: { groupId_userId: { groupId, userId } },
    update: {},
    create: { groupId, userId },
  });
  await syncConversationParticipant(groupId, userId, 'add');
  return getGroup(groupId);
}

export async function leaveGroup(groupId: string, userId: string) {
  await prisma.groupMember.deleteMany({ where: { groupId, userId } });
  await syncConversationParticipant(groupId, userId, 'remove');
  return getGroup(groupId);
}

type UpdateGroupInput = Partial<CreateGroupInput>;

async function assertGroupOwner(groupId: string, userId: string) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) {
    throw new HttpError(404, 'Grupo no encontrado');
  }
  if (group.creatorId !== userId) {
    throw new HttpError(403, 'Solo quien creó el grupo puede editarlo');
  }
}

export async function updateGroup(groupId: string, userId: string, data: UpdateGroupInput) {
  await assertGroupOwner(groupId, userId);
  await prisma.group.update({ where: { id: groupId }, data });
  return getGroup(groupId);
}

export async function deleteGroup(groupId: string, userId: string) {
  await assertGroupOwner(groupId, userId);
  await prisma.group.delete({ where: { id: groupId } });
}
