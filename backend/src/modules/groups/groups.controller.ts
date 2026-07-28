import type { Request, Response } from 'express';
import { z } from 'zod';

import { sanitizeUser } from '../../lib/sanitizeUser';
import * as groupsService from './groups.service';

const categoryEnum = z.enum(['ACADEMICO', 'DEPORTES', 'TECNOLOGIA', 'CREATIVIDAD', 'ARTE']);

function sanitizeGroup(group: Awaited<ReturnType<typeof groupsService.getGroup>>) {
  return {
    ...group,
    members: group.members.map((member) => ({ ...member, user: sanitizeUser(member.user) })),
  };
}

export async function listGroupsHandler(req: Request, res: Response) {
  const { category } = req.query;
  const parsedCategory = typeof category === 'string' ? categoryEnum.parse(category) : undefined;
  const groups = await groupsService.listGroups(parsedCategory);
  res.json(groups.map(sanitizeGroup));
}

export async function getGroupHandler(req: Request, res: Response) {
  const group = await groupsService.getGroup(req.params.id);
  res.json(sanitizeGroup(group));
}

const createGroupSchema = z.object({
  name: z.string().min(3),
  category: categoryEnum,
  description: z.string().min(1),
  imageUrl: z.string().url().optional(),
});

export async function createGroupHandler(req: Request, res: Response) {
  const data = createGroupSchema.parse(req.body);
  const group = await groupsService.createGroup(req.userId!, data);
  res.status(201).json(sanitizeGroup(group));
}

export async function joinGroupHandler(req: Request, res: Response) {
  const group = await groupsService.joinGroup(req.params.id, req.userId!);
  res.json(sanitizeGroup(group));
}

export async function leaveGroupHandler(req: Request, res: Response) {
  const group = await groupsService.leaveGroup(req.params.id, req.userId!);
  res.json(sanitizeGroup(group));
}
