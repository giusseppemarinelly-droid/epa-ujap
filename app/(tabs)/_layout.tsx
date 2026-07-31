import { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';

import { CustomTabBar } from '@/src/components/navigation/CustomTabBar';
import { useAuthStore } from '@/src/store';

export default function TabsLayout() {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);

  // Cerrar sesión (o que el token deje de ser válido) solo cambia el estado
  // global; sin esto, la pantalla en la que estabas se queda mostrando "sin
  // usuario" en vez de sacarte de las pestañas.
  useEffect(() => {
    if (status === 'signed-out') {
      router.replace('/login');
    }
  }, [status, router]);

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation }) => <CustomTabBar state={state} navigation={navigation} />}
    >
      <Tabs.Screen name="mapa" />
      <Tabs.Screen name="descubrir" />
      <Tabs.Screen name="grupos" />
      <Tabs.Screen name="mensajes" />
      <Tabs.Screen name="perfil" />
    </Tabs>
  );
}
