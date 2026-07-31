import { Appearance } from 'react-native';
import { create } from 'zustand';
import { colorScheme as nativewindColorScheme } from 'nativewind';

import colorsModule from '@/src/theme/colors';
import { getPreference, setPreference } from '@/src/lib/secureStorage';

export type ThemePreference = 'light' | 'dark' | 'system';
type ResolvedScheme = 'light' | 'dark';

const STORAGE_KEY = 'epa_theme_preference';

type ThemeState = {
  preference: ThemePreference;
  resolvedScheme: ResolvedScheme;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setThemePreference: (preference: ThemePreference) => Promise<void>;
};

function resolveScheme(preference: ThemePreference): ResolvedScheme {
  if (preference === 'system') {
    return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
  }
  return preference;
}

// `colors` (colors.js) es un objeto mutable con los hex reales, usado donde
// NativeWind no llega (color= de íconos, gradientes, mapas). NativeWind
// controla aparte las clases bg-*/text-* vía variables CSS. Ambos deben
// quedar sincronizados cada vez que cambia el tema.
function applyResolvedScheme(scheme: ResolvedScheme) {
  (colorsModule as unknown as { applyColorScheme: (s: ResolvedScheme) => void }).applyColorScheme(scheme);
  nativewindColorScheme.set(scheme);
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  preference: 'system',
  resolvedScheme: 'light',
  hydrated: false,

  hydrate: async () => {
    const stored = (await getPreference(STORAGE_KEY)) as ThemePreference | null;
    const preference = stored ?? 'system';
    const resolvedScheme = resolveScheme(preference);
    applyResolvedScheme(resolvedScheme);
    set({ preference, resolvedScheme, hydrated: true });

    Appearance.addChangeListener(({ colorScheme }) => {
      if (get().preference !== 'system') return;
      const nextScheme = colorScheme === 'dark' ? 'dark' : 'light';
      applyResolvedScheme(nextScheme);
      set({ resolvedScheme: nextScheme });
    });
  },

  setThemePreference: async (preference) => {
    const resolvedScheme = resolveScheme(preference);
    applyResolvedScheme(resolvedScheme);
    set({ preference, resolvedScheme });
    await setPreference(STORAGE_KEY, preference);
  },
}));
