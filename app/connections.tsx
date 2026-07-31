import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { Avatar, EmptyState } from '@/src/components/ui';
import { useConnectionsStore, type IncomingRequest, type SentRequest } from '@/src/store';
import { colors } from '@/src/theme/tokens';

type Tab = 'recibidos' | 'enviados';

const statusLabel: Record<SentRequest['status'], string> = {
  PENDIENTE: 'Pendiente',
  ACEPTADA: 'Te aceptó',
  RECHAZADA: 'No aceptó',
};

const statusColor: Record<SentRequest['status'], string> = {
  PENDIENTE: colors['on-surface-variant'],
  ACEPTADA: '#22C55E',
  RECHAZADA: colors['on-surface-variant'],
};

// "Epas nuevos": bandeja de solicitudes de Descubrir. Recibidos se pueden
// aceptar/rechazar; al aceptar se abre el chat con un saludo automático.
// Enviados muestra si la otra persona ya respondió o sigue pendiente.
export default function ConnectionsScreen() {
  const router = useRouter();
  const incoming = useConnectionsStore((state) => state.incoming);
  const sent = useConnectionsStore((state) => state.sent);
  const loading = useConnectionsStore((state) => state.loading);
  const responding = useConnectionsStore((state) => state.responding);
  const fetchAll = useConnectionsStore((state) => state.fetchAll);
  const respond = useConnectionsStore((state) => state.respond);

  const [tab, setTab] = useState<Tab>('recibidos');

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 8000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  async function handleRespond(request: IncomingRequest, accept: boolean) {
    try {
      const result = await respond(request.id, accept);
      if (accept && result.conversationId) {
        router.push(`/chat/${result.conversationId}`);
      }
    } catch (err) {
      Alert.alert('No se pudo responder', err instanceof Error ? err.message : undefined);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <View className="flex-row items-center px-margin-mobile py-3">
        <Pressable onPress={() => router.back()} className="mr-2 p-1">
          <MaterialIcons name="arrow-back" size={22} color={colors['on-surface']} />
        </Pressable>
        <Text className="text-on-surface flex-1" style={{ fontFamily: 'Inter_800ExtraBold', fontSize: 20 }}>
          Epas nuevos
        </Text>
      </View>

      <View className="flex-row px-margin-mobile mb-4 gap-6">
        {(
          [
            { value: 'recibidos' as Tab, label: `Recibidos${incoming.length > 0 ? ` (${incoming.length})` : ''}` },
            { value: 'enviados' as Tab, label: 'Enviados' },
          ] as const
        ).map(({ value, label }) => (
          <Pressable key={value} onPress={() => setTab(value)}>
            <Text
              className={tab === value ? 'text-primary' : 'text-on-surface-variant'}
              style={{ fontFamily: 'Inter_700Bold', fontSize: 15 }}
            >
              {label}
            </Text>
            {tab === value && <View className="bg-primary mt-1" style={{ height: 2, borderRadius: 1 }} />}
          </Pressable>
        ))}
      </View>

      {tab === 'recibidos' ? (
        <FlatList
          data={incoming}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
          renderItem={({ item }) => (
            <View className="flex-row items-center bg-surface-container-lowest rounded-md p-3 mb-2">
              <Avatar uri={item.requester.photoUrl} size={48} online={item.requester.online} />
              <View className="ml-3 flex-1">
                <Text className="text-on-surface" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>
                  {item.requester.name}
                </Text>
                <Text className="text-on-surface-variant" style={{ fontSize: 12 }} numberOfLines={1}>
                  {item.requester.career}
                </Text>
              </View>
              <Pressable
                onPress={() => handleRespond(item, false)}
                disabled={responding[item.id]}
                className="items-center justify-center rounded-full mr-2"
                style={{ width: 36, height: 36, backgroundColor: colors['surface-container'] }}
              >
                <MaterialIcons name="close" size={18} color={colors['on-surface-variant']} />
              </Pressable>
              <Pressable
                onPress={() => handleRespond(item, true)}
                disabled={responding[item.id]}
                className="items-center justify-center rounded-full"
                style={{ width: 36, height: 36, backgroundColor: colors.primary }}
              >
                <MaterialIcons name="check" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            loading ? null : (
              <View className="mt-10">
                <EmptyState icon="waving-hand" title="No tienes solicitudes nuevas por ahora" />
              </View>
            )
          }
        />
      ) : (
        <FlatList
          data={sent}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
          renderItem={({ item }) => (
            <View className="flex-row items-center bg-surface-container-lowest rounded-md p-3 mb-2">
              <Avatar uri={item.receiver.photoUrl} size={48} online={item.receiver.online} />
              <View className="ml-3 flex-1">
                <Text className="text-on-surface" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>
                  {item.receiver.name}
                </Text>
                <Text className="text-on-surface-variant" style={{ fontSize: 12 }} numberOfLines={1}>
                  {item.receiver.career}
                </Text>
              </View>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: statusColor[item.status] }}>
                {statusLabel[item.status]}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            loading ? null : (
              <View className="mt-10">
                <EmptyState icon="send" title="Todavía no le has mandado un epa a nadie" />
              </View>
            )
          }
        />
      )}
    </SafeAreaView>
  );
}
