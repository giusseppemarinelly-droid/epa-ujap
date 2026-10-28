import { Platform, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { colors } from '@/src/theme/tokens';

// La PWA instalada en el teléfono corre sin barra del navegador ni gesto de
// "jalar para recargar", así que no había forma de refrescar la app (ni de
// tomar un deploy nuevo). En nativo no aplica: ahí no hay página que recargar.
export const canReloadApp = Platform.OS === 'web';

export function reloadApp() {
  if (canReloadApp) window.location.reload();
}

export function ReloadButton({ className }: { className?: string }) {
  if (!canReloadApp) return null;
  return (
    <Pressable
      className={`bg-surface-container items-center justify-center rounded-full ${className ?? ''}`}
      style={{ width: 40, height: 40 }}
      onPress={reloadApp}
      accessibilityRole="button"
      accessibilityLabel="Recargar"
    >
      <MaterialIcons name="refresh" size={20} color={colors['on-surface']} />
    </Pressable>
  );
}
