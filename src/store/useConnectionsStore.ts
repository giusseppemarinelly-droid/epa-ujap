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
  error: string | null;
  responding: Record<string, boolean>;
  fetchAll: () => Promise<void>;
  respond: (connectionId: string, accept: boolean) => Promise<{ conversationId: string | null }>;
  reset: () => void;
};

export const useConnectionsStore = create<ConnectionsState>((set, get) => ({
  incoming: [],
  sent: [],
  loading: false,
  error: null,
  responding: {},

  reset: () => set({ incoming: [], sent: [], loading: false, error: null, responding: {} }),

  fetchAll: async () => {
    set({ loading: true, error: null });
    // allSettled en vez de Promise.all: si una de las dos peticiones falla,
    // la otra que sí trajo datos igual se muestra en vez de perderse las dos.
    const [incomingResult, sentResult] = await Promise.allSettled([
      apiRequest<BackendIncoming[]>('/connections/incoming'),
      apiRequest<BackendSent[]>('/connections/sent'),
    ]);

    set((state) => ({
      incoming:
        incomingResult.status === 'fulfilled'
          ? incomingResult.value.map((r) => ({
              id: r.id,
              createdAt: r.createdAt,
              requester: mapUserFromBackend(r.requester),
            }))
          : state.incoming,
      sent:
        sentResult.status === 'fulfilled'
          ? sentResult.value.map((r) => ({
              id: r.id,
              status: r.status,
              createdAt: r.createdAt,
              receiver: mapUserFromBackend(r.receiver),
            }))
          : state.sent,
      loading: false,
      error: incomingResult.status === 'rejected' || sentResult.status === 'rejected'
        ? 'No se pudieron cargar todas las conexiones'
        : null,
    }));
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
