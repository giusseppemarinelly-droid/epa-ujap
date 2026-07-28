import { Pressable, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { colors } from '@/src/theme/tokens';

type LookingForCardProps = {
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  selected: boolean;
  onPress: () => void;
};

export function LookingForCard({ label, icon, selected, onPress }: LookingForCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="w-[48%] items-center rounded-md bg-surface-container-lowest py-5"
      style={{
        borderWidth: 2,
        borderColor: selected ? colors.primary : 'transparent',
      }}
    >
      <MaterialIcons name={icon} size={26} color={selected ? colors.primary : colors['on-surface-variant']} />
      <Text
        className={selected ? 'text-primary mt-2' : 'text-on-surface-variant mt-2'}
        style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14 }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
