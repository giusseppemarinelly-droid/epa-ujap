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

// Ids de todas las personas con las que ya existe una fila en Connection, en
// cualquier dirección y con cualquier estado. Descubrir solo tiene sentido
// para gente con la que todavía no hay nada: ACEPTADA ya son contactos,
// PENDIENTE ya hay una solicitud en camino (mía o suya) y RECHAZADA es
// alguien que ya dijo que no, así que insistir sobra.
async function findAlreadyRelatedUserIds(userId: string) {
  const connections = await prisma.connection.findMany({
    where: { OR: [{ requesterId: userId }, { receiverId: userId }] },
    select: { requesterId: true, receiverId: true },
  });

  // El propio usuario entra en el set para excluirlo con el mismo notIn.
  const relatedIds = new Set<string>([userId]);
  for (const connection of connections) {
    relatedIds.add(connection.requesterId);
    relatedIds.add(connection.receiverId);
  }
  return relatedIds;
}

export async function listDiscoverable(filters: DiscoverFilters) {
  // Una sola consulta previa en vez de comprobar la relación candidato a
  // candidato, que sería N+1 contra la tabla de conexiones.
  const relatedIds = await findAlreadyRelatedUserIds(filters.excludeUserId);

  const users = await prisma.user.findMany({
    where: {
      id: { notIn: [...relatedIds] },
      verified: true,
      ...(filters.faculty ? { faculty: filters.faculty } : {}),
      ...(filters.semester ? { semester: filters.semester } : {}),
      ...(filters.career ? { career: { contains: filters.career, mode: 'insensitive' } } : {}),
      ...(filters.interestId ? { interests: { some: { interestId: filters.interestId } } } : {}),
    },
    include: { interests: { include: { interest: true } } },
    orderBy: { createdAt: 'desc' },
  });

  // El grafo se arma con el propio usuario incluido a propósito: mis
  // contactos ya no aparecen en `users`, pero siguen haciendo falta como
  // aristas para saber cuáles de ellos comparto con cada candidato.
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
