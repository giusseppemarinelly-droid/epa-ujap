import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { create } from 'zustand';

import { apiRequest } from '@/src/lib/api';
import { mapUserFromBackend, type BackendUser } from '@/src/lib/enumMappers';
import type { User } from '@/src/types';

type DiscoverAction = 'descartado' | 'conectado';

type DiscoverState = {
  usersById: Record<string, User>;
  queue: string[];
  loading: boolean;
  error: string | null;
  history: { userId: string; action: DiscoverAction }[];
  /** Id de la Connection creada por cada "conectar", para poder cancelarla al deshacer. */
  sentConnectionIdByUserId: Record<string, string>;
  fetchCandidates: () => Promise<void>;
  descartar: (userId: string) => void;
  conectar: (userId: string) => void;
  deshacer: () => void;
  reset: () => void;
};

function removeFromQueue(action: DiscoverAction) {
  return (userId: string) =>
    (state: DiscoverState): Partial<DiscoverState> => ({
      queue: state.queue.filter((id) => id !== userId),
      history: [...state.history, { userId, action }],
    });
}

export const useDiscoverStore = create<DiscoverState>((set) => ({
  usersById: {},
  queue: [],
  loading: false,
  error: null,
  history: [],
  sentConnectionIdByUserId: {},

  reset: () =>
    set({
      usersById: {},
      queue: [],
      loading: false,
      error: null,
      history: [],
      sentConnectionIdByUserId: {},
    }),

  fetchCandidates: async () => {
    set({ loading: true, error: null });
    try {
      const raw = await apiRequest<BackendUser[]>('/users');
      const users = raw.map(mapUserFromBackend);
      set((state) => {
        // Se mezcla en vez de reemplazar, y el `history` se conserva: el
        // backend ya no devuelve a quien acabas de conectar, así que si se
        // botaran sus datos, "deshacer" pondría en la cola un id sin usuario
        // que la pantalla descartaría en silencio. Pero solo se conserva a
        // quien todavía hace falta (cola nueva + historial): sin podar esto,
        // cada refetch de una sesión larga en Descubrir acumula candidatos
        // viejos en memoria para siempre.
        const keepIds = new Set([...users.map((user) => user.id), ...state.history.map((entry) => entry.userId)]);
        const merged = { ...state.usersById, ...Object.fromEntries(users.map((user) => [user.id, user])) };
        const usersById = Object.fromEntries(Object.entries(merged).filter(([id]) => keepIds.has(id)));

        return { usersById, queue: users.map((user) => user.id), loading: false };
      });
    } catch {
      set({ loading: false, error: 'No se pudieron cargar las personas' });
    }
  },

  descartar: (userId) => set(removeFromQueue('descartado')(userId)),

  conectar: (userId) => {
    set(removeFromQueue('conectado')(userId));
    // Pequeño golpe táctil al mandar la solicitud, tanto por botón como por
    // swipe. En nativo usa el motor de haptics del teléfono; en web (la PWA)
    // recurre a la Vibration API, que Android soporta pero iOS Safari no
    // implementa en absoluto (ni instalada como PWA) — eso es una
    // restricción de Apple, no hay forma de sortearla desde el navegador.
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(30);
      }
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    apiRequest<{ id: string }>('/connections', { method: 'POST', body: { receiverId: userId } })
      .then((connection) => {
        // Se guarda para que "deshacer" pueda cancelarla de verdad. Si el
        // usuario ya deshizo antes de que esto llegara, no pasa nada: el id
        // simplemente no se usa.
        set((state) => ({
          sentConnectionIdByUserId: { ...state.sentConnectionIdByUserId, [userId]: connection.id },
        }));
      })
      .catch(() => {
        // El usuario ya salió de la pila localmente; si falla el request no
        // hay una acción visible que revertir.
      });
  },

  deshacer: () =>
    set((state) => {
      const last = state.history[state.history.length - 1];
      if (!last) return state;

      if (last.action === 'conectado') {
        const connectionId = state.sentConnectionIdByUserId[last.userId];
        // Si el id todavía no había llegado (deshacer casi instantáneo), no
        // hay nada que cancelar del lado del servidor.
        if (connectionId) {
          apiRequest(`/connections/${connectionId}`, { method: 'DELETE' }).catch(() => {});
        }
      }

      const { [last.userId]: _removed, ...restConnectionIds } = state.sentConnectionIdByUserId;

      return {
        sentConnectionIdByUserId: restConnectionIds,
        // Los descartados no se persisten, así que un refetch pudo haberlo
        // devuelto a la cola; se limpia antes de ponerlo al frente para no
        // dejarlo duplicado.
        queue: [last.userId, ...state.queue.filter((id) => id !== last.userId)],
        history: state.history.slice(0, -1),
      };
    }),
}));
