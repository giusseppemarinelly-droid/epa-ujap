import '../global.css';

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';

import { useAuthStore, useThemeStore } from '@/src/store';
import { colors } from '@/src/theme/tokens';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });
  const authStatus = useAuthStore((state) => state.status);
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const loadInterests = useAuthStore((state) => state.loadInterests);
  const sendHeartbeat = useAuthStore((state) => state.sendHeartbeat);
  const themeHydrated = useThemeStore((state) => state.hydrated);
  const resolvedScheme = useThemeStore((state) => state.resolvedScheme);
  const hydrateTheme = useThemeStore((state) => state.hydrate);

  useEffect(() => {
    restoreSession();
    loadInterests();
    hydrateTheme();
  }, [restoreSession, loadInterests, hydrateTheme]);

  useEffect(() => {
    if (authStatus !== 'signed-in') return;
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 20000);
    return () => clearInterval(interval);
  }, [authStatus, sendHeartbeat]);

  const ready = fontsLoaded && authStatus !== 'checking' && themeHydrated;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={resolvedScheme === 'dark' ? 'light' : 'dark'} />
      {/* El key fuerza un remount completo al cambiar de tema: colors.js
          (tokens.ts) es un objeto mutable leído directamente en muchas
          pantallas (íconos, gradientes), no un valor reactivo — sin esto
          esas lecturas se quedarían con el color anterior hasta navegar. */}
      <Stack
        key={resolvedScheme}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.surface },
        }}
      />
    </GestureHandlerRootView>
  );
}
