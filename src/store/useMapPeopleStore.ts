import * as Location from 'expo-location';
import { create } from 'zustand';

import { apiRequest } from '@/src/lib/api';
import { mapMapPersonFromBackend, type BackendMapPerson } from '@/src/lib/enumMappers';
import type { MapPerson } from '@/src/types';

type MapPeopleState = {
  people: MapPerson[];
  loading: boolean;
  sharing: boolean;
  /** Refleja en el store lo que el backend ya sabe del usuario, sin pedir permisos ni red. */
  hydrateSharing: (value: boolean) => void;
  fetchPeople: () => Promise<void>;
  pushMyLocation: () => Promise<void>;
  setSharing: (value: boolean) => Promise<void>;
  reset: () => void;
};

export const useMapPeopleStore = create<MapPeopleState>((set, get) => ({
  people: [],
  loading: false,
  sharing: false,

  reset: () => set({ people: [], loading: false, sharing: false }),

  hydrateSharing: (value) => set({ sharing: value }),

  fetchPeople: async () => {
    set({ loading: true });
    try {
      const raw = await apiRequest<BackendMapPerson[]>('/location/people');
      set({ people: raw.map(mapMapPersonFromBackend), loading: false });
    } catch {
      // El mapa se refresca cada minuto; un fallo puntual de red no debe
      // vaciar los pines que ya se están viendo.
      set({ loading: false });
    }
  },

  pushMyLocation: async () => {
    if (!get().sharing) return;

    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (!granted) {
      // El permiso pudo revocarse desde ajustes del sistema. En vez de
      // reintentar cada minuto contra un "no", se apaga el interruptor.
      await get().setSharing(false);
      return;
    }

    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      await apiRequest('/location', {
        method: 'POST',
        body: { lat: position.coords.latitude, lng: position.coords.longitude },
      });
    } catch {
      // Sin señal de GPS o sin red se deja la última posición conocida, que
      // el backend caduca sola a la media hora.
    }
  },

  setSharing: async (value) => {
    if (value) {
      // El permiso se pide antes de encender nada: si el usuario lo niega, el
      // interruptor se queda apagado en vez de prometer algo que no ocurre.
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted) {
        set({ sharing: false });
        return;
      }
    }

    try {
      await apiRequest('/location/sharing', { method: 'PATCH', body: { shareLocation: value } });
    } catch {
      set({ sharing: !value });
      return;
    }

    set({ sharing: value });
    if (value) await get().pushMyLocation();
  },
}));
