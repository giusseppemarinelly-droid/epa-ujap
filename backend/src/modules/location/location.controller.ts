import type { Request, Response } from 'express';
import { z } from 'zod';

import { sanitizeUser } from '../../lib/sanitizeUser';
import * as locationService from './location.service';

const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export async function updateLocationHandler(req: Request, res: Response) {
  const { lat, lng } = coordinatesSchema.parse(req.body);
  const stored = await locationService.updateMyLocation(req.userId!, lat, lng);
  // Con el interruptor apagado se responde ok igual: el cliente no necesita
  // tratarlo como error, simplemente no se guardó nada.
  res.json({ ok: true, stored });
}

const sharingSchema = z.object({ shareLocation: z.boolean() });

export async function updateSharingHandler(req: Request, res: Response) {
  const { shareLocation } = sharingSchema.parse(req.body);
  const user = await locationService.setSharing(req.userId!, shareLocation);
  res.json(sanitizeUser(user));
}

export async function listPeopleHandler(req: Request, res: Response) {
  const people = await locationService.listVisiblePeople(req.userId!);
  res.json(people);
}
