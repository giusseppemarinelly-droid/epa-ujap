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
  setSharing: (value: boolean, opts?: { rollbackOnFailure?: boolean }) => Promise<void>;
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
      // reintentar cada minuto contra un "no", se apaga el interruptor. Sin
      // rollbackOnFailure: false, un fallo de red en el PATCH de abajo volvía
      // a prender "sharing" aunque el permiso siguiera negado.
      await get().setSharing(false, { rollbackOnFailure: false });
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

  setSharing: async (value, opts = {}) => {
    const { rollbackOnFailure = true } = opts;

    if (value) {
      // El permiso se pide antes de encender nada: si el usuario lo niega, el
      // interruptor se queda apagado en vez de prometer algo que no ocurre.
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted) {
        set({ sharing: false });
        return;
      }
    }

    // Se refleja de inmediato: si esto viene de un permiso revocado, dejar
    // "sharing" en true mientras se espera la respuesta del servidor sería
    // mentir sobre el estado real.
    set({ sharing: value });

    try {
      await apiRequest('/location/sharing', { method: 'PATCH', body: { shareLocation: value } });
    } catch {
      if (rollbackOnFailure) {
        // Fallo de red en un toggle manual: se revierte para no prometer un
        // estado que el servidor nunca confirmó.
        set({ sharing: !value });
      }
      // Si no se debe revertir (permiso del SO revocado), el switch se queda
      // apagado localmente aunque el PATCH no haya confirmado nada.
      return;
    }

    if (value) await get().pushMyLocation();
  },
}));
