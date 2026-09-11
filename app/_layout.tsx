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

import { GlobalAlert } from '@/src/components/ui';
import { useAuthStore, useConnectionsStore, useConversationsStore, useThemeStore } from '@/src/store';
import { colors } from '@/src/theme/tokens';

SplashScreen.preventAutoHideAsync();

// Antes cada pantalla (Mapa, Mensajes, Grupos, Notificaciones) montaba su
// propio setInterval para esto — y con la navegación por tabs manteniendo
// pantallas visitadas en memoria, varias terminaban pidiendo lo mismo en
// paralelo. Un solo poll aquí basta: el estado de los stores es compartido,
// así que cualquier pantalla que lo lea ya lo ve actualizado.
const CONNECTIONS_AND_CHATS_POLL_MS = 8000;

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });
  const authStatus = useAuthStore((state) => state.status);
  const currentUserId = useAuthStore((state) => state.currentUser?.id);
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const loadInterests = useAuthStore((state) => state.loadInterests);
  const sendHeartbeat = useAuthStore((state) => state.sendHeartbeat);
  const fetchConnections = useConnectionsStore((state) => state.fetchAll);
  const fetchConversations = useConversationsStore((state) => state.fetchConversations);
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

  useEffect(() => {
    if (authStatus !== 'signed-in' || !currentUserId) return;
    fetchConnections();
    fetchConversations(currentUserId);
    const interval = setInterval(() => {
      fetchConnections();
      fetchConversations(currentUserId);
    }, CONNECTIONS_AND_CHATS_POLL_MS);
    return () => clearInterval(interval);
  }, [authStatus, currentUserId, fetchConnections, fetchConversations]);

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
      <GlobalAlert />
    </GestureHandlerRootView>
  );
}
