import { prisma } from '../../lib/prisma';
import { HttpError } from '../../middleware/errorHandler';

export async function sendConnection(requesterId: string, receiverId: string) {
  if (requesterId === receiverId) {
    throw new HttpError(400, 'No puedes conectar contigo mismo');
  }

  return prisma.connection.upsert({
    where: { requesterId_receiverId: { requesterId, receiverId } },
    update: {},
    create: { requesterId, receiverId },
  });
}
