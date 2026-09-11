import { create } from 'zustand';

import { ApiError, apiRequest } from '@/src/lib/api';
import {
  mapConversationFromBackend,
  mapMessageFromBackend,
  messageKindToBackend,
  type BackendConversation,
  type BackendMessage,
} from '@/src/lib/enumMappers';
import type { Conversation, Message, MessageKind } from '@/src/types';

// El backend devuelve el último mensaje completo, pero `Conversation` no tiene
// dónde guardar su tipo ni si era un Snap. Va en un mapa aparte porque la lista
// de chats lo necesita para no mostrar una línea en blanco cuando lo último fue
// una foto, y para distinguir un Snap sin abrir de uno ya consumido.
type ConversationPayload = Omit<BackendConversation, 'lastMessage'> & {
  lastMessage:
    | (NonNullable<BackendConversation['lastMessage']> & {
        kind?: string;
        ephemeral?: boolean;
        mediaUrl?: string | null;
      })
    | null;
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
  /** Un Snap: el servidor lo entrega una sola vez y después borra el archivo. */
  ephemeral: boolean;
};

/** Lo que devuelve el servidor al abrir un Snap. Solo llega una vez. */
export type OpenedSnap = {
  mediaUrl: string;
  kind: MessageKind;
};

/** Resumen del último mensaje para pintar bien la fila de la bandeja. */
export type LastMessageSummary = {
  kind: MessageKind;
  ephemeral: boolean;
  /** Un Snap consumido: ya lo abrí yo o ya lo vieron todos y se destruyó. */
  opened: boolean;
  /** Lo mandé yo: no hay nada que abrir, así que no se resalta. */
  mine: boolean;
};

type ConversationsState = {
  conversations: Conversation[];
  messagesByConversation: Record<string, Message[]>;
  lastMessageByConversation: Record<string, LastMessageSummary>;
  /**
   * Snaps que ya abrí en esta sesión. El servidor tarda un refresco en
   * reflejarlo, y sin esta memoria el polling de cada 3s volvería a pintar la
   * burbuja como "sin abrir" durante un instante.
   */
  openedSnapIds: Record<string, true>;
  loading: boolean;
  fetchConversations: (currentUserId: string) => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, text: string) => Promise<void>;
  sendMediaMessage: (conversationId: string, input: MediaMessageInput) => Promise<void>;
  openSnap: (conversationId: string, messageId: string) => Promise<OpenedSnap>;
  startDirectConversation: (userId: string, currentUserId: string) => Promise<Conversation>;
  createGroupConversation: (
    participantIds: string[],
    title: string,
    currentUserId: string
  ) => Promise<Conversation>;
  markRead: (conversationId: string) => Promise<void>;
  reset: () => void;
};

export const useConversationsStore = create<ConversationsState>((set, get) => ({
  conversations: [],
  messagesByConversation: {},
  lastMessageByConversation: {},
  openedSnapIds: {},
  loading: false,

  reset: () =>
    set({
      conversations: [],
      messagesByConversation: {},
      lastMessageByConversation: {},
      openedSnapIds: {},
      loading: false,
    }),

  fetchConversations: async (currentUserId) => {
    set({ loading: true });
    try {
      const raw = await apiRequest<ConversationPayload[]>('/conversations');
      const { openedSnapIds } = get();
      const summaries: Record<string, LastMessageSummary> = {};

      for (const conversation of raw) {
        const lastMessage = conversation.lastMessage;
        if (!lastMessage?.kind) continue;
        const ephemeral = lastMessage.ephemeral === true;
        summaries[conversation.id] = {
          kind: messageKindFromBackend[lastMessage.kind] ?? 'texto',
          ephemeral,
          // El servidor pone `mediaUrl` en null en cuanto lo vieron todos los
          // destinatarios: es la única señal de "consumido" que llega aquí.
          opened: ephemeral && (lastMessage.mediaUrl == null || openedSnapIds[lastMessage.id] === true),
          mine: lastMessage.senderId === currentUserId,
        };
      }

      set({
        conversations: raw.map((conversation) => mapConversationFromBackend(conversation, currentUserId)),
        lastMessageByConversation: summaries,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  fetchMessages: async (conversationId) => {
    const raw = await apiRequest<BackendMessage[]>(`/conversations/${conversationId}/messages`);
    const { openedSnapIds } = get();
    const messages = raw.map((item) => {
      const message = mapMessageFromBackend(item);
      // Un Snap que acabo de abrir no puede volver a verse "nuevo" mientras el
      // servidor se pone al día.
      return message.ephemeral && openedSnapIds[message.id] === true
        ? { ...message, viewedByMe: true }
        : message;
    });

    set((state) => ({
      messagesByConversation: { ...state.messagesByConversation, [conversationId]: messages },
    }));
  },

  sendMessage: async (conversationId, text) => {
    const raw = await apiRequest<SendMessageResponse>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: { kind: messageKindToBackend.texto, text },
    });
    set((state) => appendSentMessage(state, conversationId, raw));
  },

  sendMediaMessage: async (conversationId, { kind, mediaBase64, mimeType, text, ephemeral }) => {
    const raw = await apiRequest<SendMessageResponse>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: {
        kind: messageKindToBackend[kind],
        mediaBase64,
        mimeType,
        ephemeral,
        // El pie de foto solo viaja si trae algo: el backend rechaza texto vacío.
        ...(text?.trim() ? { text: text.trim() } : {}),
      },
    });
    set((state) => appendSentMessage(state, conversationId, raw));
  },

  openSnap: async (conversationId, messageId) => {
    const markOpened = () => set((state) => markSnapConsumed(state, conversationId, messageId));

    try {
      const raw = await apiRequest<{ mediaUrl: string; kind?: string }>(
        `/conversations/${conversationId}/messages/${messageId}/open`,
        { method: 'POST' }
      );
      markOpened();
      return {
        mediaUrl: raw.mediaUrl,
        kind: raw.kind ? (messageKindFromBackend[raw.kind] ?? 'imagen') : 'imagen',
      };
    } catch (error) {
      // 410 (ya visto o destruido) y 403 (es mío) significan lo mismo para la
      // burbuja: no hay nada que abrir, hay que apagarla igual que si se
      // hubiera visto, o el usuario seguiría tocándola en balde.
      if (error instanceof ApiError && (error.status === 410 || error.status === 403)) {
        markOpened();
      }
      throw error;
    }
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
    lastMessageByConversation: {
      ...state.lastMessageByConversation,
      [conversationId]: {
        kind: message.kind,
        ephemeral: message.ephemeral,
        opened: false,
        mine: true,
      },
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

// Apaga un Snap en todos los sitios donde se ve, al instante. Se llama tanto al
// abrirlo bien como cuando el servidor avisa de que ya no está disponible.
function markSnapConsumed(
  state: ConversationsState,
  conversationId: string,
  messageId: string
): Partial<ConversationsState> {
  const messages = state.messagesByConversation[conversationId];
  const summary = state.lastMessageByConversation[conversationId];

  return {
    openedSnapIds: { ...state.openedSnapIds, [messageId]: true },
    messagesByConversation: messages
      ? {
          ...state.messagesByConversation,
          [conversationId]: messages.map((message) =>
            message.id === messageId ? { ...message, viewedByMe: true, mediaUrl: undefined } : message
          ),
        }
      : state.messagesByConversation,
    lastMessageByConversation:
      summary && summary.ephemeral && messages?.at(-1)?.id === messageId
        ? { ...state.lastMessageByConversation, [conversationId]: { ...summary, opened: true } }
        : state.lastMessageByConversation,
  };
}
