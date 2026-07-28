import { Pressable, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { colors, elevation } from '@/src/theme/tokens';

export type BottomNavItem = {
  key: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  active: boolean;
  onPress: () => void;
};

type BottomNavProps = {
  items: BottomNavItem[];
};

export function BottomNav({ items }: BottomNavProps) {
  return (
    <View
      className="absolute bottom-6 left-5 right-5 flex-row items-center justify-between rounded-xl bg-surface-container-lowest px-2 py-3"
      style={elevation.floating}
    >
      {items.map((item) => (
        <Pressable
          key={item.key}
          onPress={item.onPress}
          className="flex-1 items-center justify-center py-1"
        >
          <MaterialIcons
            name={item.icon}
            size={24}
            color={item.active ? colors.primary : colors['on-surface-variant']}
          />
        </Pressable>
      ))}
    </View>
  );
}
