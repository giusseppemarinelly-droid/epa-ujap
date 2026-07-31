import { Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { colors } from '@/src/theme/tokens';

type BadgeProps = {
  label: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  tone?: 'gold' | 'primary';
};

export function Badge({ label, icon = 'verified', tone = 'gold' }: BadgeProps) {
  const iconColor = tone === 'gold' ? colors['on-ujap-gold-container'] : colors['on-primary-container'];
  const backgroundColor = tone === 'gold' ? colors['ujap-gold-container'] : colors['primary-container'];

  return (
    <View
      className="flex-row items-center self-start rounded-full px-3 py-1"
      style={{ backgroundColor }}
    >
      <MaterialIcons name={icon} size={14} color={tone === 'gold' ? colors['ujap-gold'] : colors.primary} />
      <Text className="ml-1" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: iconColor }}>
        {label}
      </Text>
    </View>
  );
}
