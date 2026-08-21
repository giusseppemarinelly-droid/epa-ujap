import { create } from 'zustand';

import { apiRequest } from '@/src/lib/api';
import {
  mapConversationFromBackend,
  mapMessageFromBackend,
  messageKindToBackend,
  type BackendConversation,
  type BackendMessage,
} from '@/src/lib/enumMappers';
import type { Conversation, Message, MessageKind } from '@/src/types';

// El backend devuelve el tipo del último mensaje, pero `Conversation` no tiene
// dónde guardarlo. Va en un mapa aparte porque la lista de chats lo necesita
// para no mostrar una línea en blanco cuando lo último fue una foto.
type ConversationPayload = Omit<BackendConversation, 'lastMessage'> & {
  lastMessage: (NonNullable<BackendConversation['lastMessage']> & { kind?: string }) | null;
};

type SendMessageResponse = BackendMessage & { streakCount?: number };

const messageKindFromBackend = Object.fromEntries(
  Object.entries(messageKindToBackend).map(([front, back]) => [back, front as MessageKind])
) as Record<string, MessageKind | undefined>;

export type MediaMessageInput = {
  kind: Exclude<MessageKind, 'texto'>;
  mediaBase64: string;
  mimeType: string;
  text?: string;
};

type ConversationsState = {
  conversations: Conversation[];
  messagesByConversation: Record<string, Message[]>;
  lastMessageKindByConversation: Record<string, MessageKind>;
  loading: boolean;
  fetchConversations: (currentUserId: string) => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, text: string) => Promise<void>;
  sendMediaMessage: (conversationId: string, input: MediaMessageInput) => Promise<void>;
  startDirectConversation: (userId: string, currentUserId: string) => Promise<Conversation>;
  createGroupConversation: (
    participantIds: string[],
    title: string,
    currentUserId: string
  ) => Promise<Conversation>;
  markRead: (conversationId: string) => Promise<void>;
};

export const useConversationsStore = create<ConversationsState>((set) => ({
  conversations: [],
  messagesByConversation: {},
  lastMessageKindByConversation: {},
  loading: false,

  fetchConversations: async (currentUserId) => {
    set({ loading: true });
    try {
      const raw = await apiRequest<ConversationPayload[]>('/conversations');
      const lastMessageKinds: Record<string, MessageKind> = {};
      for (const conversation of raw) {
        const kind = conversation.lastMessage?.kind;
        if (kind) {
          lastMessageKinds[conversation.id] = messageKindFromBackend[kind] ?? 'texto';
        }
      }
      set({
        conversations: raw.map((conversation) => mapConversationFromBackend(conversation, currentUserId)),
        lastMessageKindByConversation: lastMessageKinds,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  fetchMessages: async (conversationId) => {
    const raw = await apiRequest<BackendMessage[]>(`/conversations/${conversationId}/messages`);
    set((state) => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: raw.map(mapMessageFromBackend),
      },
    }));
  },

  sendMessage: async (conversationId, text) => {
    const raw = await apiRequest<SendMessageResponse>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: { kind: messageKindToBackend.texto, text },
    });
    set((state) => appendSentMessage(state, conversationId, raw));
  },

  sendMediaMessage: async (conversationId, { kind, mediaBase64, mimeType, text }) => {
    const raw = await apiRequest<SendMessageResponse>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: {
        kind: messageKindToBackend[kind],
        mediaBase64,
        mimeType,
        // El pie de foto solo viaja si trae algo: el backend rechaza texto vacío.
        ...(text?.trim() ? { text: text.trim() } : {}),
      },
    });
    set((state) => appendSentMessage(state, conversationId, raw));
  },

  startDirectConversation: async (userId, currentUserId) => {
    const raw = await apiRequest<BackendConversation>('/conversations/direct', {
      method: 'POST',
      body: { userId },
    });
    const conversation = mapConversationFromBackend(raw, currentUserId);
    set((state) => ({
      conversations: state.conversations.some((existing) => existing.id === conversation.id)
        ? state.conversations
        : [conversation, ...state.conversations],
    }));
    return conversation;
  },

  createGroupConversation: async (participantIds, title, currentUserId) => {
    const raw = await apiRequest<BackendConversation>('/conversations/group', {
      method: 'POST',
      body: { participantIds, title },
    });
    const conversation = mapConversationFromBackend(raw, currentUserId);
    set((state) => ({ conversations: [conversation, ...state.conversations] }));
    return conversation;
  },

  markRead: async (conversationId) => {
    try {
      await apiRequest(`/conversations/${conversationId}/read`, { method: 'POST' });
      set((state) => ({
        conversations: state.conversations.map((conversation) =>
          conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation
        ),
      }));
    } catch {
      // No es crítico si falla marcar como leído.
    }
  },
}));

// Deja el mensaje recién enviado en la lista del chat y pone al día el resumen
// y la racha de esa conversación, sin esperar al siguiente refresco.
function appendSentMessage(
  state: ConversationsState,
  conversationId: string,
  raw: SendMessageResponse
): Partial<ConversationsState> {
  const message = mapMessageFromBackend(raw);

  return {
    messagesByConversation: {
      ...state.messagesByConversation,
      [conversationId]: [...(state.messagesByConversation[conversationId] ?? []), message],
    },
    lastMessageKindByConversation: {
      ...state.lastMessageKindByConversation,
      [conversationId]: message.kind,
    },
    conversations: state.conversations.map((conversation) =>
      conversation.id === conversationId
        ? {
            ...conversation,
            lastMessageText: message.text,
            lastMessageAt: message.sentAt,
            streakCount: raw.streakCount ?? conversation.streakCount,
          }
        : conversation
    ),
  };
}
