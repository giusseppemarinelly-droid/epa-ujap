import type { Faculty } from '@prisma/client';

import { prisma } from '../../lib/prisma';

type DiscoverFilters = {
  excludeUserId: string;
  faculty?: Faculty;
  semester?: number;
  career?: string;
  interestId?: string;
};

// Para "conexiones en común" en Descubrir: junta, en memoria, quién está
// conectado (aceptado) con quién. A esta escala (una universidad) es más
// simple y barato que resolverlo con SQL recursivo, y evita N+1 queries.
async function buildAcceptedConnectionGraph(userIds: string[]) {
  const connections = await prisma.connection.findMany({
    where: {
      status: 'ACEPTADA',
      OR: [{ requesterId: { in: userIds } }, { receiverId: { in: userIds } }],
    },
    select: { requesterId: true, receiverId: true },
  });

  const partnersOf = new Map<string, Set<string>>();
  function addEdge(a: string, b: string) {
    if (!partnersOf.has(a)) partnersOf.set(a, new Set());
    partnersOf.get(a)!.add(b);
  }
  for (const connection of connections) {
    addEdge(connection.requesterId, connection.receiverId);
    addEdge(connection.receiverId, connection.requesterId);
  }
  return partnersOf;
}

export async function listDiscoverable(filters: DiscoverFilters) {
  const users = await prisma.user.findMany({
    where: {
      id: { not: filters.excludeUserId },
      verified: true,
      ...(filters.faculty ? { faculty: filters.faculty } : {}),
      ...(filters.semester ? { semester: filters.semester } : {}),
      ...(filters.career ? { career: { contains: filters.career, mode: 'insensitive' } } : {}),
      ...(filters.interestId ? { interests: { some: { interestId: filters.interestId } } } : {}),
    },
    include: { interests: { include: { interest: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const partnersOf = await buildAcceptedConnectionGraph([filters.excludeUserId, ...users.map((u) => u.id)]);
  const myPartners = partnersOf.get(filters.excludeUserId) ?? new Set<string>();

  const mutualIdsByUser = new Map<string, string[]>();
  const allMutualIds = new Set<string>();
  for (const user of users) {
    const theirPartners = partnersOf.get(user.id) ?? new Set<string>();
    const mutual = [...theirPartners].filter((id) => myPartners.has(id));
    mutualIdsByUser.set(user.id, mutual);
    mutual.forEach((id) => allMutualIds.add(id));
  }

  const mutualUsers =
    allMutualIds.size > 0
      ? await prisma.user.findMany({
          where: { id: { in: [...allMutualIds] } },
          select: { id: true, name: true, photoUrl: true },
        })
      : [];
  const mutualUserById = new Map(mutualUsers.map((u) => [u.id, u]));

  return users.map((user) => ({
    ...user,
    mutualConnections: (mutualIdsByUser.get(user.id) ?? [])
      .map((id) => mutualUserById.get(id))
      .filter((u): u is NonNullable<typeof u> => !!u),
  }));
}
