import { create } from 'zustand';

type AlertState = {
  visible: boolean;
  title: string;
  message?: string;
  show: (title: string, message?: string) => void;
  dismiss: () => void;
};

// Sustituye Alert.alert de un solo botón (avisos de error, permisos, etc.):
// en la versión web (esta app se sirve como sitio estático) react-native-web
// implementa Alert.alert como un no-op — no muestra nada, ni siquiera un
// window.alert — así que cualquier mensaje de error quedaba invisible ahí.
export const useAlertStore = create<AlertState>((set) => ({
  visible: false,
  title: '',
  message: undefined,
  show: (title, message) => set({ visible: true, title, message }),
  dismiss: () => set({ visible: false }),
}));

/** Para usar fuera de un componente (stores, funciones sueltas). */
export function showAlert(title: string, message?: string) {
  useAlertStore.getState().show(title, message);
}
