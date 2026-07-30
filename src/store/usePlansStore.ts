import { create } from 'zustand';

import { apiRequest } from '@/src/lib/api';
import { mapPlanFromBackend, type BackendPlan } from '@/src/lib/enumMappers';
import type { Plan } from '@/src/types';

type PlansState = {
  plans: Plan[];
  loading: boolean;
  error: string | null;
  fetchPlans: () => Promise<void>;
  joinPlan: (planId: string) => Promise<void>;
  leavePlan: (planId: string) => Promise<void>;
};

export const usePlansStore = create<PlansState>((set, get) => ({
  plans: [],
  loading: false,
  error: null,

  fetchPlans: async () => {
    set({ loading: true, error: null });
    try {
      const raw = await apiRequest<BackendPlan[]>('/plans');
      set({ plans: raw.map(mapPlanFromBackend), loading: false });
    } catch {
      set({ loading: false, error: 'No se pudieron cargar los planes' });
    }
  },

  joinPlan: async (planId) => {
    const raw = await apiRequest<BackendPlan>(`/plans/${planId}/join`, { method: 'POST' });
    const updated = mapPlanFromBackend(raw);
    set({ plans: get().plans.map((plan) => (plan.id === planId ? updated : plan)) });
  },

  leavePlan: async (planId) => {
    const raw = await apiRequest<BackendPlan>(`/plans/${planId}/leave`, { method: 'POST' });
    const updated = mapPlanFromBackend(raw);
    set({ plans: get().plans.map((plan) => (plan.id === planId ? updated : plan)) });
  },
}));
