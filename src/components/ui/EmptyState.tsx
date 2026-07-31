import { Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { colors } from '@/src/theme/tokens';

type EmptyStateProps = {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description?: string;
};

// Reemplaza los íconos sueltos flotando en blanco que se repetían en cada
// pantalla vacía (Mensajes, Grupos, Descubrir...) por un círculo con un
// dejo de color de marca, para que el estado vacío no se sienta apagado.
export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <View className="items-center px-8">
      <View
        className="items-center justify-center rounded-full mb-4"
        style={{ width: 72, height: 72, backgroundColor: colors['primary-container'] }}
      >
        <MaterialIcons name={icon} size={32} color={colors.primary} />
      </View>
      <Text
        className="text-on-surface text-center"
        style={{ fontFamily: 'Inter_700Bold', fontSize: 15 }}
      >
        {title}
      </Text>
      {description && (
        <Text className="text-on-surface-variant text-center mt-1" style={{ fontSize: 13 }}>
          {description}
        </Text>
      )}
    </View>
  );
}
