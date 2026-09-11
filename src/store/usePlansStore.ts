import { create } from 'zustand';

import { apiRequest } from '@/src/lib/api';
import { mapPlanFromBackend, planCategoryToBackend, type BackendPlan } from '@/src/lib/enumMappers';
import type { Plan, PlanCategory } from '@/src/types';

type CreatePlanInput = {
  title: string;
  description: string;
  category: PlanCategory;
  latitude: number;
  longitude: number;
  address: string;
  dateTime: string;
  capacity: number;
};

type PlansState = {
  plans: Plan[];
  loading: boolean;
  error: string | null;
  fetchPlans: () => Promise<void>;
  joinPlan: (planId: string) => Promise<void>;
  leavePlan: (planId: string) => Promise<void>;
  createPlan: (data: CreatePlanInput) => Promise<Plan>;
  reset: () => void;
};

export const usePlansStore = create<PlansState>((set, get) => ({
  plans: [],
  loading: false,
  error: null,

  reset: () => set({ plans: [], loading: false, error: null }),

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

  createPlan: async (data) => {
    const raw = await apiRequest<BackendPlan>('/plans', {
      method: 'POST',
      body: {
        title: data.title,
        description: data.description,
        category: planCategoryToBackend[data.category],
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        dateTime: data.dateTime,
        capacity: data.capacity,
      },
    });
    const plan = mapPlanFromBackend(raw);
    set({ plans: [plan, ...get().plans] });
    return plan;
  },
}));
