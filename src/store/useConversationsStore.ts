import { create } from 'zustand';

import { apiRequest } from '@/src/lib/api';
import {
  mapConversationFromBackend,
  mapMessageFromBackend,
  type BackendConversation,
  type BackendMessage,
} from '@/src/lib/enumMappers';
import type { Conversation, Message } from '@/src/types';

type ConversationsState = {
  conversations: Conversation[];
  messagesByConversation: Record<string, Message[]>;
  loading: boolean;
  fetchConversations: (currentUserId: string) => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, text: string) => Promise<void>;
  startDirectConversation: (userId: string, currentUserId: string) => Promise<Conversation>;
  createGroupConversation: (
    participantIds: string[],
    title: string,
    currentUserId: string
  ) => Promise<Conversation>;
  markRead: (conversationId: string) => Promise<void>;
};

export const useConversationsStore = create<ConversationsState>((set, get) => ({
  conversations: [],
  messagesByConversation: {},
  loading: false,

  fetchConversations: async (currentUserId) => {
    set({ loading: true });
    try {
      const raw = await apiRequest<BackendConversation[]>('/conversations');
      set({
        conversations: raw.map((conversation) => mapConversationFromBackend(conversation, currentUserId)),
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
    const raw = await apiRequest<BackendMessage>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: { text },
    });
    const message = mapMessageFromBackend(raw);
    set((state) => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: [...(state.messagesByConversation[conversationId] ?? []), message],
      },
      conversations: state.conversations.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, lastMessageText: message.text, lastMessageAt: message.sentAt }
          : conversation
      ),
    }));
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
