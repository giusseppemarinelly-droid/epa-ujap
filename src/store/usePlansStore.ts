import { create } from 'zustand';

import { currentUserId, plans as initialPlans } from '@/src/mocks';
import type { Plan } from '@/src/types';

type PlansState = {
  plans: Plan[];
  joinPlan: (planId: string) => void;
  leavePlan: (planId: string) => void;
};

export const usePlansStore = create<PlansState>((set) => ({
  plans: initialPlans,
  joinPlan: (planId) =>
    set((state) => ({
      plans: state.plans.map((plan) =>
        plan.id === planId && !plan.attendeeIds.includes(currentUserId)
          ? { ...plan, attendeeIds: [...plan.attendeeIds, currentUserId] }
          : plan
      ),
    })),
  leavePlan: (planId) =>
    set((state) => ({
      plans: state.plans.map((plan) =>
        plan.id === planId
          ? { ...plan, attendeeIds: plan.attendeeIds.filter((id) => id !== currentUserId) }
          : plan
      ),
    })),
}));
