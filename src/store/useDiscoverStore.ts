import { create } from 'zustand';

import { currentUserId, users } from '@/src/mocks';

type DiscoverAction = 'descartado' | 'destacado' | 'conectado';

type DiscoverState = {
  queue: string[];
  history: { userId: string; action: DiscoverAction }[];
  descartar: (userId: string) => void;
  destacar: (userId: string) => void;
  conectar: (userId: string) => void;
  deshacer: () => void;
};

const initialQueue = users.map((user) => user.id).filter((id) => id !== currentUserId);

function removeFromQueue(action: DiscoverAction) {
  return (userId: string) =>
    (state: DiscoverState): Partial<DiscoverState> => ({
      queue: state.queue.filter((id) => id !== userId),
      history: [...state.history, { userId, action }],
    });
}

export const useDiscoverStore = create<DiscoverState>((set) => ({
  queue: initialQueue,
  history: [],
  descartar: (userId) => set(removeFromQueue('descartado')(userId)),
  destacar: (userId) => set(removeFromQueue('destacado')(userId)),
  conectar: (userId) => set(removeFromQueue('conectado')(userId)),
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
