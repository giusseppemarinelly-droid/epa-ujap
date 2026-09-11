import type { Request, Response } from 'express';
import { z } from 'zod';

import { sanitizeUser } from '../../lib/sanitizeUser';
import * as plansService from './plans.service';

const categoryEnum = z.enum(['DEPORTES', 'ESTUDIO', 'COMIDA', 'PROYECTOS', 'CULTURA']);
const statusEnum = z.enum(['VA', 'QUIZAS', 'ASISTIO']);

// El modelo no guarda una hora de fin, así que "en curso"/"finalizado" se
// derivan de dateTime + una duración asumida, en cada lectura — ningún otro
// sitio transiciona PlanStatus, así que sin esto un plan se quedaba en
// PROGRAMADO para siempre.
const PLAN_DURATION_HOURS = 3;

function derivePlanStatus(dateTime: Date, storedStatus: string): string {
  if (storedStatus === 'FINALIZADO') return storedStatus;
  const start = dateTime.getTime();
  const end = start + PLAN_DURATION_HOURS * 60 * 60 * 1000;
  const now = Date.now();
  if (now < start) return 'PROGRAMADO';
  if (now < end) return 'EN_CURSO';
  return 'FINALIZADO';
}

function sanitizePlan(plan: Awaited<ReturnType<typeof plansService.getPlan>>) {
  return {
    ...plan,
    status: derivePlanStatus(plan.dateTime, plan.status),
    creator: sanitizeUser(plan.creator),
    attendees: plan.attendees.map((attendee) => ({ ...attendee, user: sanitizeUser(attendee.user) })),
  };
}

const listPlansQuerySchema = z.object({
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radiusKm: z.coerce.number().positive().optional(),
});

export async function listPlansHandler(req: Request, res: Response) {
  const { lat, lng, radiusKm } = listPlansQuerySchema.parse(req.query);
  const near = lat !== undefined && lng !== undefined ? { lat, lng, radiusKm: radiusKm ?? 5 } : undefined;
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

const updatePlanSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(1).optional(),
  category: categoryEnum.optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  address: z.string().min(1).optional(),
  dateTime: z.coerce.date().optional(),
  capacity: z.number().int().min(1).optional(),
  isPublic: z.boolean().optional(),
});

export async function updatePlanHandler(req: Request, res: Response) {
  const data = updatePlanSchema.parse(req.body);
  const plan = await plansService.updatePlan(req.params.id, req.userId!, data);
  res.json(sanitizePlan(plan));
}

export async function cancelPlanHandler(req: Request, res: Response) {
  await plansService.cancelPlan(req.params.id, req.userId!);
  res.json({ ok: true });
}
