import { create } from 'zustand';

import { apiRequest } from '@/src/lib/api';
import { mapGroupFromBackend, type BackendGroup } from '@/src/lib/enumMappers';
import type { Group } from '@/src/types';

type GroupsState = {
  groups: Group[];
  loading: boolean;
  error: string | null;
  fetchGroups: () => Promise<void>;
  joinGroup: (groupId: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
};

export const useGroupsStore = create<GroupsState>((set, get) => ({
  groups: [],
  loading: false,
  error: null,

  fetchGroups: async () => {
    set({ loading: true, error: null });
    try {
      const raw = await apiRequest<BackendGroup[]>('/groups');
      set({ groups: raw.map(mapGroupFromBackend), loading: false });
    } catch {
      set({ loading: false, error: 'No se pudieron cargar los grupos' });
    }
  },

  joinGroup: async (groupId) => {
    const raw = await apiRequest<BackendGroup>(`/groups/${groupId}/join`, { method: 'POST' });
    const updated = mapGroupFromBackend(raw);
    set({ groups: get().groups.map((group) => (group.id === groupId ? updated : group)) });
  },

  leaveGroup: async (groupId) => {
    const raw = await apiRequest<BackendGroup>(`/groups/${groupId}/leave`, { method: 'POST' });
    const updated = mapGroupFromBackend(raw);
    set({ groups: get().groups.map((group) => (group.id === groupId ? updated : group)) });
  },
}));
