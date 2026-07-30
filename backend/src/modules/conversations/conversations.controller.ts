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

const sendMessageSchema = z.object({ text: z.string().min(1).max(2000) });

export async function sendMessageHandler(req: Request, res: Response) {
  const { text } = sendMessageSchema.parse(req.body);
  const message = await conversationsService.sendMessage(req.params.id, req.userId!, text);
  res.status(201).json(sanitizeMessage(message));
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
