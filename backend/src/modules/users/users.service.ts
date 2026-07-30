import type { Faculty } from '@prisma/client';

import { prisma } from '../../lib/prisma';

type DiscoverFilters = {
  excludeUserId: string;
  faculty?: Faculty;
  semester?: number;
  career?: string;
  interestId?: string;
};

export async function listDiscoverable(filters: DiscoverFilters) {
  return prisma.user.findMany({
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
}
