import type { Request, Response } from 'express';
import { z } from 'zod';

import * as connectionsService from './connections.service';

const sendConnectionSchema = z.object({ receiverId: z.string().min(1) });

export async function sendConnectionHandler(req: Request, res: Response) {
  const { receiverId } = sendConnectionSchema.parse(req.body);
  const connection = await connectionsService.sendConnection(req.userId!, receiverId);
  res.status(201).json(connection);
}
