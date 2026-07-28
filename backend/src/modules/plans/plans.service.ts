import type { AttendeeStatus, PlanCategory } from '@prisma/client';

import { prisma } from '../../lib/prisma';
import { HttpError } from '../../middleware/errorHandler';

// Distancia en línea recta entre dos coordenadas. Suficiente para el volumen
// de planes esperado; si el volumen crece, migrar a PostGIS + ST_DWithin.
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const planWithRelations = {
  creator: true,
  attendees: { include: { user: true } },
} as const;

export async function listPlans(near?: { lat: number; lng: number; radiusKm: number }) {
  const plans = await prisma.plan.findMany({
    where: { isPublic: true },
    include: planWithRelations,
    orderBy: { dateTime: 'asc' },
  });

  if (!near) return plans;

  return plans
    .map((plan) => ({ plan, distanceKm: haversineKm(near.lat, near.lng, plan.latitude, plan.longitude) }))
    .filter(({ distanceKm }) => distanceKm <= near.radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .map(({ plan }) => plan);
}

export async function getPlan(planId: string) {
  const plan = await prisma.plan.findUnique({ where: { id: planId }, include: planWithRelations });
  if (!plan) {
    throw new HttpError(404, 'Plan no encontrado');
  }
  return plan;
}

type CreatePlanInput = {
  title: string;
  description: string;
  category: PlanCategory;
  latitude: number;
  longitude: number;
  address: string;
  dateTime: Date;
  capacity: number;
  isPublic?: boolean;
};

export async function createPlan(creatorId: string, data: CreatePlanInput) {
  return prisma.plan.create({
    data: {
      ...data,
      creatorId,
      attendees: { create: { userId: creatorId, status: 'VA' } },
    },
    include: planWithRelations,
  });
}

export async function joinPlan(planId: string, userId: string, status: AttendeeStatus = 'VA') {
  await prisma.planAttendee.upsert({
    where: { planId_userId: { planId, userId } },
    update: { status },
    create: { planId, userId, status },
  });
  return getPlan(planId);
}

export async function leavePlan(planId: string, userId: string) {
  await prisma.planAttendee.deleteMany({ where: { planId, userId } });
  return getPlan(planId);
}
