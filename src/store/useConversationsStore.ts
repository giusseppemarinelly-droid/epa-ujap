import { create } from 'zustand';

import { apiRequest } from '@/src/lib/api';
import { mapConversationFromBackend, type BackendConversation } from '@/src/lib/enumMappers';
import type { Conversation } from '@/src/types';

type ConversationsState = {
  conversations: Conversation[];
  loading: boolean;
  fetchConversations: (currentUserId: string) => Promise<void>;
};

export const useConversationsStore = create<ConversationsState>((set) => ({
  conversations: [],
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
}));
