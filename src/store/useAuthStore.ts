import { create } from 'zustand';

import { currentUserId, users } from '@/src/mocks';
import type { Faculty, LookingFor, User } from '@/src/types';

type OnboardingDraft = {
  email: string;
  faculty?: Faculty;
  career?: string;
  semester?: number;
  bio: string;
  interestIds: string[];
  lookingFor: LookingFor[];
};

type AuthState = {
  isVerified: boolean;
  currentUser: User;
  draft: OnboardingDraft;
  setEmail: (email: string) => void;
  setAcademicProfile: (faculty: Faculty, career: string, semester: number) => void;
  setBio: (bio: string) => void;
  toggleInterest: (interestId: string) => void;
  toggleLookingFor: (value: LookingFor) => void;
  completeOnboarding: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  isVerified: false,
  currentUser: users.find((user) => user.id === currentUserId)!,
  draft: { email: '', bio: '', interestIds: [], lookingFor: [] },
  setEmail: (email) => set((state) => ({ draft: { ...state.draft, email } })),
  setAcademicProfile: (faculty, career, semester) =>
    set((state) => ({ draft: { ...state.draft, faculty, career, semester } })),
  setBio: (bio) => set((state) => ({ draft: { ...state.draft, bio } })),
  toggleInterest: (interestId) =>
    set((state) => {
      const isSelected = state.draft.interestIds.includes(interestId);
      return {
        draft: {
          ...state.draft,
          interestIds: isSelected
            ? state.draft.interestIds.filter((id) => id !== interestId)
            : [...state.draft.interestIds, interestId],
        },
      };
    }),
  toggleLookingFor: (value) =>
    set((state) => {
      const isSelected = state.draft.lookingFor.includes(value);
      return {
        draft: {
          ...state.draft,
          lookingFor: isSelected
            ? state.draft.lookingFor.filter((item) => item !== value)
            : [...state.draft.lookingFor, value],
        },
      };
    }),
  completeOnboarding: () => set({ isVerified: true }),
}));
