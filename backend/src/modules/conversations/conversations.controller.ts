import type { Request, Response } from 'express';
import { z } from 'zod';

import { sanitizeUser } from '../../lib/sanitizeUser';
import * as conversationsService from './conversations.service';

function sanitizeParticipants<T extends { participants: { user: Parameters<typeof sanitizeUser>[0] }[] }>(
  conversation: T
) {
  return {
    ...conversation,
    participants: conversation.participants.map((participant) => ({
      ...participant,
      user: sanitizeUser(participant.user),
    })),
  };
}

function sanitizeMessage<T extends { sender: Parameters<typeof sanitizeUser>[0] }>(message: T) {
  return { ...message, sender: sanitizeUser(message.sender) };
}

export async function listConversationsHandler(req: Request, res: Response) {
  const conversations = await conversationsService.listConversations(req.userId!);
  res.json(conversations.map(sanitizeParticipants));
}

export async function getMessagesHandler(req: Request, res: Response) {
  const messages = await conversationsService.getMessages(req.params.id, req.userId!);
  res.json(messages.map(sanitizeMessage));
}

// El texto sigue siendo el caso normal, así que `kind` es opcional y cae en
// TEXTO: los clientes viejos siguen mandando solo `text` y funcionan igual.
const sendMessageSchema = z
  .object({
    kind: z.enum(['TEXTO', 'IMAGEN', 'VIDEO']).default('TEXTO'),
    text: z.string().max(2000).optional(),
    mediaBase64: z.string().min(1).optional(),
    mimeType: z.string().min(1).optional(),
    // Solo la cámara manda true. La galería se queda en el chat.
    ephemeral: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.kind === 'TEXTO') {
      if (!value.text?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['text'], message: 'El mensaje no puede ir vacío' });
      }
      if (value.mediaBase64 || value.mimeType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['mediaBase64'],
          message: 'Un mensaje de texto no lleva archivo',
        });
      }
      return;
    }

    // En foto y video el texto es opcional: va como pie de foto.
    if (!value.mediaBase64) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['mediaBase64'], message: 'Falta el archivo' });
    }
    if (!value.mimeType) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['mimeType'], message: 'Falta el tipo de archivo' });
    }
  });

export async function sendMessageHandler(req: Request, res: Response) {
  const input = sendMessageSchema.parse(req.body);
  const { message, streakCount } = await conversationsService.sendMessage(req.params.id, req.userId!, input);
  // La racha viaja pegada al mensaje para que el chat la refresque al instante
  // en vez de esperar al siguiente refresco de la lista de conversaciones.
  res.status(201).json({ ...sanitizeMessage(message), streakCount });
}

export async function openSnapHandler(req: Request, res: Response) {
  const result = await conversationsService.openSnap(req.params.id, req.params.messageId, req.userId!);
  res.json(result);
}

export async function markReadHandler(req: Request, res: Response) {
  await conversationsService.markRead(req.params.id, req.userId!);
  res.json({ ok: true });
}

const startDirectSchema = z.object({ userId: z.string().min(1) });

export async function startDirectConversationHandler(req: Request, res: Response) {
  const { userId: otherUserId } = startDirectSchema.parse(req.body);
  const conversation = await conversationsService.getOrCreateDirectConversation(req.userId!, otherUserId);
  res.status(201).json(sanitizeParticipants(conversation));
}

const createGroupConversationSchema = z.object({
  participantIds: z.array(z.string()).min(1),
  title: z.string().min(1).max(120),
});

export async function createGroupConversationHandler(req: Request, res: Response) {
  const { participantIds, title } = createGroupConversationSchema.parse(req.body);
  const conversation = await conversationsService.createGroupConversation(req.userId!, participantIds, title);
  res.status(201).json(sanitizeParticipants(conversation));
}
