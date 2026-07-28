import { Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

import { colors, elevation, epaGradient, radii } from '@/src/theme/tokens';
import { useDiscoverStore } from '@/src/store';

type CircleButtonProps = {
  icon: keyof typeof MaterialIcons.glyphMap;
  size: number;
  backgroundColor: string;
  iconColor: string;
  onPress: () => void;
  disabled?: boolean;
};

function CircleButton({ icon, size, backgroundColor, iconColor, onPress, disabled }: CircleButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="items-center justify-center rounded-full"
      style={[{ width: size, height: size, backgroundColor, opacity: disabled ? 0.4 : 1 }, elevation.card]}
    >
      <MaterialIcons name={icon} size={size * 0.45} color={iconColor} />
    </Pressable>
  );
}

type ActionButtonsProps = {
  userId: string;
  canUndo: boolean;
};

// La acción "conectar" usa el gradiente de marca y el gesto de "échale un
// epa" en vez del corazón estilo swipe del diseño original de Stitch, para
// mantener el tono de comunidad universitaria y no el de una app de citas.
export function ActionButtons({ userId, canUndo }: ActionButtonsProps) {
  const descartar = useDiscoverStore((state) => state.descartar);
  const destacar = useDiscoverStore((state) => state.destacar);
  const conectar = useDiscoverStore((state) => state.conectar);
  const deshacer = useDiscoverStore((state) => state.deshacer);

  return (
    <View className="flex-row items-center justify-center gap-4">
      <CircleButton
        icon="close"
        size={52}
        backgroundColor="#FFFFFF"
        iconColor={colors['on-surface']}
        onPress={() => descartar(userId)}
      />
      <CircleButton
        icon="star"
        size={44}
        backgroundColor={colors['ujap-navy']}
        iconColor={colors['ujap-gold']}
        onPress={() => destacar(userId)}
      />
      <Pressable onPress={() => conectar(userId)}>
        <LinearGradient
          colors={epaGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            { width: 64, height: 64, borderRadius: radii.full, alignItems: 'center', justifyContent: 'center' },
            elevation.floating,
          ]}
        >
          <MaterialIcons name="waving-hand" size={28} color="#FFFFFF" />
        </LinearGradient>
      </Pressable>
      <CircleButton
        icon="undo"
        size={44}
        backgroundColor="#FFFFFF"
        iconColor={colors['on-surface-variant']}
        onPress={deshacer}
        disabled={!canUndo}
      />
    </View>
  );
}
