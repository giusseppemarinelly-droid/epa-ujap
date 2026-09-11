import type { Request, Response } from 'express';
import { z } from 'zod';

import { sanitizeUser } from '../../lib/sanitizeUser';
import * as connectionsService from './connections.service';

const sendConnectionSchema = z.object({ receiverId: z.string().min(1) });

export async function sendConnectionHandler(req: Request, res: Response) {
  const { receiverId } = sendConnectionSchema.parse(req.body);
  const connection = await connectionsService.sendConnection(req.userId!, receiverId);
  res.status(201).json(connection);
}

export async function cancelConnectionHandler(req: Request, res: Response) {
  await connectionsService.cancelConnection(req.params.id, req.userId!);
  res.json({ ok: true });
}

export async function listIncomingHandler(req: Request, res: Response) {
  const requests = await connectionsService.listIncoming(req.userId!);
  res.json(
    requests.map((request) => ({ ...request, requester: sanitizeUser(request.requester) }))
  );
}

export async function listSentHandler(req: Request, res: Response) {
  const requests = await connectionsService.listSent(req.userId!);
  res.json(requests.map((request) => ({ ...request, receiver: sanitizeUser(request.receiver) })));
}

const respondSchema = z.object({ accept: z.boolean() });

export async function respondToConnectionHandler(req: Request, res: Response) {
  const { accept } = respondSchema.parse(req.body);
  const result = await connectionsService.respondToConnection(req.params.id, req.userId!, accept);
  res.json(result);
}
