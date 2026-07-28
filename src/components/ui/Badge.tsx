import { Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { colors } from '@/src/theme/tokens';

type BadgeProps = {
  label: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  tone?: 'gold' | 'primary';
};

export function Badge({ label, icon = 'verified', tone = 'gold' }: BadgeProps) {
  const iconColor = tone === 'gold' ? colors['ujap-gold'] : colors.primary;

  return (
    <View className="flex-row items-center self-start rounded-full bg-surface-container px-3 py-1">
      <MaterialIcons name={icon} size={14} color={iconColor} />
      <Text
        className="text-on-surface ml-1"
        style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12 }}
      >
        {label}
      </Text>
    </View>
  );
}
