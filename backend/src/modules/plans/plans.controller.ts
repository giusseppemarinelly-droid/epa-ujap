import type { Request, Response } from 'express';
import { z } from 'zod';

import { sanitizeUser } from '../../lib/sanitizeUser';
import * as plansService from './plans.service';

const categoryEnum = z.enum(['DEPORTES', 'ESTUDIO', 'COMIDA', 'PROYECTOS', 'CULTURA']);
const statusEnum = z.enum(['VA', 'QUIZAS', 'ASISTIO']);

function sanitizePlan(plan: Awaited<ReturnType<typeof plansService.getPlan>>) {
  return {
    ...plan,
    creator: sanitizeUser(plan.creator),
    attendees: plan.attendees.map((attendee) => ({ ...attendee, user: sanitizeUser(attendee.user) })),
  };
}

export async function listPlansHandler(req: Request, res: Response) {
  const { lat, lng, radiusKm } = req.query;
  const near =
    typeof lat === 'string' && typeof lng === 'string'
      ? { lat: Number(lat), lng: Number(lng), radiusKm: radiusKm ? Number(radiusKm) : 5 }
      : undefined;
  const plans = await plansService.listPlans(near);
  res.json(plans.map(sanitizePlan));
}

export async function getPlanHandler(req: Request, res: Response) {
  const plan = await plansService.getPlan(req.params.id);
  res.json(sanitizePlan(plan));
}

const createPlanSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(1),
  category: categoryEnum,
  latitude: z.number(),
  longitude: z.number(),
  address: z.string().min(1),
  dateTime: z.coerce.date(),
  capacity: z.number().int().min(1),
  isPublic: z.boolean().optional(),
});

export async function createPlanHandler(req: Request, res: Response) {
  const data = createPlanSchema.parse(req.body);
  const plan = await plansService.createPlan(req.userId!, data);
  res.status(201).json(sanitizePlan(plan));
}

const joinPlanSchema = z.object({ status: statusEnum.optional() });

export async function joinPlanHandler(req: Request, res: Response) {
  const { status } = joinPlanSchema.parse(req.body ?? {});
  const plan = await plansService.joinPlan(req.params.id, req.userId!, status);
  res.json(sanitizePlan(plan));
}

export async function leavePlanHandler(req: Request, res: Response) {
  const plan = await plansService.leavePlan(req.params.id, req.userId!);
  res.json(sanitizePlan(plan));
}
