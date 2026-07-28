import { create } from 'zustand';

import { currentUserId, groups as initialGroups } from '@/src/mocks';
import type { Group } from '@/src/types';

type GroupsState = {
  groups: Group[];
  joinGroup: (groupId: string) => void;
  leaveGroup: (groupId: string) => void;
};

export const useGroupsStore = create<GroupsState>((set) => ({
  groups: initialGroups,
  joinGroup: (groupId) =>
    set((state) => ({
      groups: state.groups.map((group) =>
        group.id === groupId && !group.memberIds.includes(currentUserId)
          ? { ...group, memberIds: [...group.memberIds, currentUserId] }
          : group
      ),
    })),
  leaveGroup: (groupId) =>
    set((state) => ({
      groups: state.groups.map((group) =>
        group.id === groupId
          ? { ...group, memberIds: group.memberIds.filter((id) => id !== currentUserId) }
          : group
      ),
    })),
}));
