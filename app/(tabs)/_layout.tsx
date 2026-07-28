import { Tabs } from 'expo-router';

import { CustomTabBar } from '@/src/components/navigation/CustomTabBar';

export default function TabsLayout() {
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
