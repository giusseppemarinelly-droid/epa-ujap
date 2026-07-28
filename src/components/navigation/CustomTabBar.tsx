import { MaterialIcons } from '@expo/vector-icons';

import { BottomNav, type BottomNavItem } from '@/src/components/ui';

const ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  mapa: 'map',
  descubrir: 'style',
  grupos: 'groups',
  mensajes: 'chat-bubble',
  perfil: 'person',
};

// Formas mínimas y estructurales de lo que expone el prop `tabBar` de
// expo-router Tabs, para no depender de los tipos internos de
// @react-navigation (no se exponen como paquete propio en esta versión).
type TabRoute = { key: string; name: string };
type TabState = { index: number; routes: TabRoute[] };
type TabNavigation = {
  // `emit` es genérico en la API real de React Navigation; se tipa como
  // `any` a propósito para aceptar el objeto de navegación concreto sin
  // pelear con su firma condicional.
  emit: (event: any) => any;
  navigate: (name: string) => void;
};

type CustomTabBarProps = {
  state: TabState;
  navigation: TabNavigation;
};

export function CustomTabBar({ state, navigation }: CustomTabBarProps) {
  const items: BottomNavItem[] = state.routes.map((route, index) => ({
    key: route.key,
    icon: ICONS[route.name] ?? 'circle',
    active: state.index === index,
    onPress: () => {
      const isFocused = state.index === index;
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    },
  }));

  return <BottomNav items={items} />;
}
