import { Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { Avatar, Card } from '@/src/components/ui';
import { colors } from '@/src/theme/tokens';
import type { User } from '@/src/types';

type DiscoverInfoPanelProps = {
  candidate: User;
  currentUser: User;
};

function sharedInterestsPercent(currentUser: User, candidate: User): number | null {
  if (currentUser.interestIds.length === 0) return null;
  const shared = candidate.interestIds.filter((id) => currentUser.interestIds.includes(id));
  return Math.round((shared.length / currentUser.interestIds.length) * 100);
}

// Versión propia de lo que en el mockup de referencia era "Pulse Match" +
// "Mutual Connections": mismo concepto (qué tanto en común tienes con esa
// persona), pero con nuestra copy de comunidad UJAP, no de match romántico,
// y con los componentes/tokens que ya usa el resto de la app.
export function DiscoverInfoPanel({ candidate, currentUser }: DiscoverInfoPanelProps) {
  const percent = sharedInterestsPercent(currentUser, candidate);
  const mutuals = candidate.mutualConnections;

  if (percent === null && mutuals.length === 0) return null;

  return (
    <View className="gap-2 mt-3">
      {percent !== null && (
        <Card className="flex-row items-center">
          <View className="flex-1 pr-3">
            <Text className="text-on-surface" style={{ fontFamily: 'Inter_700Bold', fontSize: 14 }}>
              En común
            </Text>
            <Text className="text-on-surface-variant mt-1" style={{ fontSize: 12 }}>
              Basado en los intereses que elegiste en tu perfil.
            </Text>
          </View>
          <View
            className="items-center justify-center rounded-full"
            style={{ width: 48, height: 48, borderWidth: 3, borderColor: colors.primary }}
          >
            <Text style={{ fontFamily: 'Inter_800ExtraBold', fontSize: 13, color: colors.primary }}>
              {percent}%
            </Text>
          </View>
        </Card>
      )}

      {mutuals.length > 0 && (
        <Card className="flex-row items-center">
          <MaterialIcons name="groups" size={18} color={colors.secondary} />
          <Text
            className="text-on-surface ml-2 flex-1"
            style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13 }}
          >
            {mutuals.length === 1 ? '1 conexión en común' : `${mutuals.length} conexiones en común`}
          </Text>
          <View className="flex-row">
            {mutuals.slice(0, 3).map((mutual, index) => (
              <View
                key={mutual.id}
                style={{
                  marginLeft: index === 0 ? 0 : -10,
                  borderWidth: 2,
                  borderColor: colors['surface-container-lowest'],
                  borderRadius: 999,
                }}
              >
                <Avatar uri={mutual.photoUrl} size={28} />
              </View>
            ))}
            {mutuals.length > 3 && (
              <View
                className="items-center justify-center bg-surface-container"
                style={{
                  width: 28,
                  height: 28,
                  marginLeft: -10,
                  borderWidth: 2,
                  borderColor: colors['surface-container-lowest'],
                  borderRadius: 999,
                }}
              >
                <Text
                  style={{ fontSize: 10, fontFamily: 'Inter_700Bold', color: colors['on-surface-variant'] }}
                >
                  +{mutuals.length - 3}
                </Text>
              </View>
            )}
          </View>
        </Card>
      )}
    </View>
  );
}
