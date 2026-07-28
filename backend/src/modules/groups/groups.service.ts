import type { GroupCategory } from '@prisma/client';

import { prisma } from '../../lib/prisma';
import { HttpError } from '../../middleware/errorHandler';

const groupWithRelations = {
  members: { include: { user: true } },
} as const;

export async function listGroups(category?: GroupCategory) {
  return prisma.group.findMany({
    where: category ? { category } : undefined,
    include: groupWithRelations,
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
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
    data: { ...data, creatorId, members: { create: { userId: creatorId } } },
    include: groupWithRelations,
  });
}

export async function joinGroup(groupId: string, userId: string) {
  await prisma.groupMember.upsert({
    where: { groupId_userId: { groupId, userId } },
    update: {},
    create: { groupId, userId },
  });
  return getGroup(groupId);
}

export async function leaveGroup(groupId: string, userId: string) {
  await prisma.groupMember.deleteMany({ where: { groupId, userId } });
  return getGroup(groupId);
}
