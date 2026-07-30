import { create } from 'zustand';

import { apiRequest, ApiError } from '@/src/lib/api';
import {
  facultyToBackend,
  lookingForToBackend,
  mapUserFromBackend,
  type BackendUser,
} from '@/src/lib/enumMappers';
import { clearToken, getToken, setToken } from '@/src/lib/secureStorage';
import type { Faculty, Interest, LookingFor, User } from '@/src/types';

type OnboardingDraft = {
  name: string;
  email: string;
  password: string;
  faculty?: Faculty;
  career?: string;
  semester?: number;
  bio: string;
  interestIds: string[];
  lookingFor: LookingFor[];
};

type AuthStatus = 'checking' | 'signed-out' | 'signed-in';

type AuthState = {
  status: AuthStatus;
  currentUser: User | null;
  draft: OnboardingDraft;
  interests: Interest[];
  error: string | null;

  restoreSession: () => Promise<void>;
  loadInterests: () => Promise<void>;
  setDraftField: <K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]) => void;
  toggleInterest: (interestId: string) => void;
  toggleLookingFor: (value: LookingFor) => void;
  completeOnboarding: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: {
    name?: string;
    bio?: string;
    career?: string;
    faculty?: Faculty;
    semester?: number;
    age?: number;
    photoUrl?: string;
    interestIds?: string[];
    lookingFor?: LookingFor[];
  }) => Promise<void>;
};

const emptyDraft: OnboardingDraft = {
  name: '',
  email: '',
  password: '',
  bio: '',
  interestIds: [],
  lookingFor: [],
};

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : fallback;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'checking',
  currentUser: null,
  draft: emptyDraft,
  interests: [],
  error: null,

  restoreSession: async () => {
    const token = await getToken();
    if (!token) {
      set({ status: 'signed-out' });
      return;
    }
    try {
      const raw = await apiRequest<BackendUser>('/auth/me');
      set({ currentUser: mapUserFromBackend(raw), status: 'signed-in' });
    } catch {
      await clearToken();
      set({ status: 'signed-out' });
    }
  },

  loadInterests: async () => {
    const interests = await apiRequest<Interest[]>('/interests', { auth: false });
    set({ interests });
  },

  setDraftField: (key, value) => set((state) => ({ draft: { ...state.draft, [key]: value } })),

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

  // Encadena signup -> verify (con el token que devuelve la API, ya que no
  // se envía correo real) -> login -> perfil académico, todo en un solo
  // paso desde el formulario único de onboarding.
  completeOnboarding: async () => {
    const draft = get().draft;
    set({ error: null });

    try {
      const { verificationToken } = await apiRequest<{ userId: string; verificationToken: string }>(
        '/auth/signup',
        { method: 'POST', auth: false, body: { email: draft.email, password: draft.password, name: draft.name } }
      );

      await apiRequest('/auth/verify', {
        method: 'POST',
        auth: false,
        body: { email: draft.email, token: verificationToken },
      });

      const loginResult = await apiRequest<{ token: string; user: BackendUser }>('/auth/login', {
        method: 'POST',
        auth: false,
        body: { email: draft.email, password: draft.password },
      });
      await setToken(loginResult.token);

      const updated = await apiRequest<BackendUser>('/auth/me', {
        method: 'PATCH',
        body: {
          faculty: draft.faculty ? facultyToBackend[draft.faculty] : undefined,
          career: draft.career,
          semester: draft.semester,
          bio: draft.bio,
          interestIds: draft.interestIds,
          lookingFor: draft.lookingFor.map((value) => lookingForToBackend[value]),
        },
      });

      set({ currentUser: mapUserFromBackend(updated), status: 'signed-in', draft: emptyDraft });
    } catch (err) {
      set({ error: errorMessage(err, 'No se pudo completar el registro') });
      throw err;
    }
  },

  login: async (email, password) => {
    set({ error: null });
    try {
      const result = await apiRequest<{ token: string; user: BackendUser }>('/auth/login', {
        method: 'POST',
        auth: false,
        body: { email, password },
      });
      await setToken(result.token);
      set({ currentUser: mapUserFromBackend(result.user), status: 'signed-in' });
    } catch (err) {
      set({ error: errorMessage(err, 'No se pudo iniciar sesión') });
      throw err;
    }
  },

  logout: async () => {
    await clearToken();
    set({ currentUser: null, status: 'signed-out', draft: emptyDraft });
  },

  updateProfile: async (data) => {
    const updated = await apiRequest<BackendUser>('/auth/me', {
      method: 'PATCH',
      body: {
        ...data,
        faculty: data.faculty ? facultyToBackend[data.faculty] : undefined,
        lookingFor: data.lookingFor?.map((value) => lookingForToBackend[value]),
      },
    });
    set({ currentUser: mapUserFromBackend(updated) });
  },
}));
