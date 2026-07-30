import { create } from 'zustand';

import { apiRequest } from '@/src/lib/api';
import { groupCategoryToBackend, mapGroupFromBackend, type BackendGroup } from '@/src/lib/enumMappers';
import type { Group, GroupCategory } from '@/src/types';

type CreateGroupInput = {
  name: string;
  category: GroupCategory;
  description: string;
};

type GroupsState = {
  groups: Group[];
  loading: boolean;
  error: string | null;
  fetchGroups: () => Promise<void>;
  joinGroup: (groupId: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  createGroup: (data: CreateGroupInput) => Promise<Group>;
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

  createGroup: async (data) => {
    const raw = await apiRequest<BackendGroup>('/groups', {
      method: 'POST',
      body: {
        name: data.name,
        category: groupCategoryToBackend[data.category],
        description: data.description,
      },
    });
    const group = mapGroupFromBackend(raw);
    set({ groups: [group, ...get().groups] });
    return group;
  },
}));
