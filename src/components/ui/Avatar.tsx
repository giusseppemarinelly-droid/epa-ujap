import { Image, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { colors } from '@/src/theme/tokens';

type AvatarProps = {
  uri?: string;
  size?: number;
  online?: boolean;
};

export function Avatar({ uri, size = 48, online = false }: AvatarProps) {
  return (
    <View style={{ width: size, height: size }}>
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <View
          className="bg-surface-container items-center justify-center"
          style={{ width: size, height: size, borderRadius: size / 2 }}
        >
          <MaterialIcons name="person" size={size * 0.6} color={colors['on-surface-variant']} />
        </View>
      )}
      {online && (
        <View
          className="absolute bottom-0 right-0 rounded-full border-2 border-surface-container-lowest"
          style={{ width: size * 0.28, height: size * 0.28, backgroundColor: '#22C55E' }}
        />
      )}
    </View>
  );
}
