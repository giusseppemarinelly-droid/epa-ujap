import { Modal, Pressable, Text, View } from 'react-native';

import { useAlertStore } from '@/src/store/useAlertStore';
import { colors, elevation, radii } from '@/src/theme/tokens';

/**
 * Un solo modal, montado una vez en la raíz de la app, que reemplaza todos
 * los Alert.alert(title, message) informativos (errores, permisos, avisos).
 * Ver useAlertStore para el porqué.
 */
export function GlobalAlert() {
  const visible = useAlertStore((state) => state.visible);
  const title = useAlertStore((state) => state.title);
  const message = useAlertStore((state) => state.message);
  const dismiss = useAlertStore((state) => state.dismiss);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={dismiss}>
      <Pressable
        onPress={dismiss}
        className="flex-1 items-center justify-center px-8"
        style={{ backgroundColor: 'rgba(19,35,62,0.45)' }}
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          className="w-full"
          style={{
            backgroundColor: colors['surface-container-lowest'],
            borderRadius: radii.lg,
            padding: 24,
            ...elevation.floating,
          }}
        >
          <Text style={{ fontFamily: 'Inter_800ExtraBold', fontSize: 18, color: colors['on-surface'] }}>
            {title}
          </Text>
          {message ? (
            <Text
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 14,
                color: colors['on-surface-variant'],
                marginTop: 8,
              }}
            >
              {message}
            </Text>
          ) : null}
          <View className="flex-row justify-end" style={{ marginTop: 24 }}>
            <Pressable
              onPress={dismiss}
              className="items-center justify-center rounded-full px-5"
              style={{ height: 44, backgroundColor: colors.primary }}
            >
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: '#FFFFFF' }}>Entendido</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
