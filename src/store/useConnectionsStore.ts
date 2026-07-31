import { create } from 'zustand';

import { apiRequest } from '@/src/lib/api';
import { mapUserFromBackend, type BackendUser } from '@/src/lib/enumMappers';
import type { User } from '@/src/types';

export type ConnectionStatus = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';

export type IncomingRequest = {
  id: string;
  createdAt: string;
  requester: User;
};

export type SentRequest = {
  id: string;
  status: ConnectionStatus;
  createdAt: string;
  receiver: User;
};

type BackendIncoming = { id: string; createdAt: string; requester: BackendUser };
type BackendSent = { id: string; status: ConnectionStatus; createdAt: string; receiver: BackendUser };

type ConnectionsState = {
  incoming: IncomingRequest[];
  sent: SentRequest[];
  loading: boolean;
  responding: Record<string, boolean>;
  fetchAll: () => Promise<void>;
  respond: (connectionId: string, accept: boolean) => Promise<{ conversationId: string | null }>;
};

export const useConnectionsStore = create<ConnectionsState>((set, get) => ({
  incoming: [],
  sent: [],
  loading: false,
  responding: {},

  fetchAll: async () => {
    set({ loading: true });
    try {
      const [incomingRaw, sentRaw] = await Promise.all([
        apiRequest<BackendIncoming[]>('/connections/incoming'),
        apiRequest<BackendSent[]>('/connections/sent'),
      ]);
      set({
        incoming: incomingRaw.map((r) => ({ id: r.id, createdAt: r.createdAt, requester: mapUserFromBackend(r.requester) })),
        sent: sentRaw.map((r) => ({ id: r.id, status: r.status, createdAt: r.createdAt, receiver: mapUserFromBackend(r.receiver) })),
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  respond: async (connectionId, accept) => {
    set((state) => ({ responding: { ...state.responding, [connectionId]: true } }));
    try {
      const result = await apiRequest<{ conversationId: string | null }>(
        `/connections/${connectionId}/respond`,
        { method: 'POST', body: { accept } }
      );
      set((state) => ({
        incoming: state.incoming.filter((r) => r.id !== connectionId),
        responding: { ...state.responding, [connectionId]: false },
      }));
      return result;
    } catch (err) {
      set((state) => ({ responding: { ...state.responding, [connectionId]: false } }));
      throw err;
    }
  },
}));
