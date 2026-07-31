import { create } from 'zustand';

export type PickedLocation = {
  lat: number;
  lng: number;
  address: string;
};

type LocationPickerState = {
  pending: PickedLocation | null;
  setPending: (location: PickedLocation) => void;
  clearPending: () => void;
};

// Puente simple entre app/plan/location.tsx y app/plan/new.tsx: expo-router
// no tiene forma nativa de devolver un valor al hacer router.back(), así
// que la pantalla del mapa deja aquí el resultado y el formulario lo lee.
export const useLocationPickerStore = create<LocationPickerState>((set) => ({
  pending: null,
  setPending: (location) => set({ pending: location }),
  clearPending: () => set({ pending: null }),
}));
