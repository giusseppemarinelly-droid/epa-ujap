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
  history: { userId: string; action: DiscoverAction }[];
  fetchCandidates: () => Promise<void>;
  descartar: (userId: string) => void;
  conectar: (userId: string) => void;
  deshacer: () => void;
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
  history: [],

  fetchCandidates: async () => {
    set({ loading: true });
    try {
      const raw = await apiRequest<BackendUser[]>('/users');
      const users = raw.map(mapUserFromBackend);
      set({
        usersById: Object.fromEntries(users.map((user) => [user.id, user])),
        queue: users.map((user) => user.id),
        loading: false,
      });
    } catch {
      set({ loading: false });
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
    apiRequest('/connections', { method: 'POST', body: { receiverId: userId } }).catch(() => {
      // El usuario ya salió de la pila localmente; si falla el request no
      // hay una acción visible que revertir.
    });
  },

  deshacer: () =>
    set((state) => {
      const last = state.history[state.history.length - 1];
      if (!last) return state;
      return {
        queue: [last.userId, ...state.queue],
        history: state.history.slice(0, -1),
      };
    }),
}));
