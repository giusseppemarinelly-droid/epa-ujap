import { Modal, Pressable, Text, View } from 'react-native';
import type { GestureResponderEvent } from 'react-native';

import { colors, elevation, radii } from '@/src/theme/tokens';

// Reemplaza Alert.alert para confirmaciones destructivas: en web esa API
// depende de window.confirm, que varios navegadores (sobre todo in-app
// browsers) bloquean o ignoran en silencio, dejando el botón como si no
// hiciera nada. Este modal se comporta igual en web y nativo.
type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancelar',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  function stopPropagation(event: GestureResponderEvent) {
    event.stopPropagation();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        onPress={onCancel}
        className="flex-1 items-center justify-center px-8"
        style={{ backgroundColor: 'rgba(19,35,62,0.45)' }}
      >
        <Pressable
          onPress={stopPropagation}
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
          <View className="flex-row justify-end" style={{ gap: 12, marginTop: 24 }}>
            <Pressable
              onPress={onCancel}
              className="items-center justify-center rounded-full px-5"
              style={{ height: 44 }}
            >
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors['on-surface-variant'] }}>
                {cancelLabel}
              </Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              className="items-center justify-center rounded-full px-5"
              style={{ height: 44, backgroundColor: destructive ? colors.error : colors.primary }}
            >
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: '#FFFFFF' }}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
