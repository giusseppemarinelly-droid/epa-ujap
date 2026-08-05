import { useEffect, useMemo } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { ConversationRow } from '@/src/components/mensajes/ConversationRow';
import { Avatar, EmptyState } from '@/src/components/ui';
import { useAuthStore, useConnectionsStore, useConversationsStore } from '@/src/store';
import type { IncomingRequest } from '@/src/store';
import { colors } from '@/src/theme/tokens';
import { formatRelativeTime } from '@/src/utils/formatRelativeTime';
import type { Conversation } from '@/src/types';

type NotificationItem =
  | { kind: 'epa'; id: string; createdAt: string; request: IncomingRequest }
  | { kind: 'mensaje'; id: string; createdAt: string; conversation: Conversation };

// Bandeja única de "todo lo nuevo": solicitudes de Epas sin responder y
// chats (1 a 1, de grupo o de plan) con mensajes sin leer, ordenados por
// fecha. Es a donde apunta la campanita en las pantallas principales.
export default function NotificacionesScreen() {
  const router = useRouter();
  const currentUserId = useAuthStore((state) => state.currentUser?.id);

  const incoming = useConnectionsStore((state) => state.incoming);
  const connectionsLoading = useConnectionsStore((state) => state.loading);
  const responding = useConnectionsStore((state) => state.responding);
  const fetchConnections = useConnectionsStore((state) => state.fetchAll);
  const respond = useConnectionsStore((state) => state.respond);

  const conversations = useConversationsStore((state) => state.conversations);
  const conversationsLoading = useConversationsStore((state) => state.loading);
  const fetchConversations = useConversationsStore((state) => state.fetchConversations);

  useEffect(() => {
    fetchConnections();
    const interval = setInterval(fetchConnections, 8000);
    return () => clearInterval(interval);
  }, [fetchConnections]);

  useEffect(() => {
    if (!currentUserId) return;
    fetchConversations(currentUserId);
    const interval = setInterval(() => fetchConversations(currentUserId), 8000);
    return () => clearInterval(interval);
  }, [currentUserId, fetchConversations]);

  const unreadConversations = useMemo(
    () => conversations.filter((conversation) => conversation.unreadCount > 0),
    [conversations]
  );

  const items = useMemo<NotificationItem[]>(() => {
    const epas: NotificationItem[] = incoming.map((request) => ({
      kind: 'epa',
      id: `epa-${request.id}`,
      createdAt: request.createdAt,
      request,
    }));
    const mensajes: NotificationItem[] = unreadConversations.map((conversation) => ({
      kind: 'mensaje',
      id: `mensaje-${conversation.id}`,
      createdAt: conversation.lastMessageAt ?? '',
      conversation,
    }));
    return [...epas, ...mensajes].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [incoming, unreadConversations]);

  const loading = connectionsLoading || conversationsLoading;

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
          Notificaciones
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        renderItem={({ item }) =>
          item.kind === 'epa' ? (
            <View className="flex-row items-center bg-surface-container-lowest rounded-md p-3 mb-3">
              <Avatar uri={item.request.requester.photoUrl} size={48} online={item.request.requester.online} />
              <View className="ml-3 flex-1">
                <Text className="text-on-surface" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>
                  {item.request.requester.name} te mandó un epa
                </Text>
                <Text className="text-on-surface-variant" style={{ fontSize: 12 }} numberOfLines={1}>
                  {item.request.requester.career} · {formatRelativeTime(item.request.createdAt)}
                </Text>
              </View>
              <Pressable
                onPress={() => handleRespond(item.request, false)}
                disabled={responding[item.request.id]}
                className="items-center justify-center rounded-full mr-2"
                style={{ width: 36, height: 36, backgroundColor: colors['surface-container'] }}
              >
                <MaterialIcons name="close" size={18} color={colors['on-surface-variant']} />
              </Pressable>
              <Pressable
                onPress={() => handleRespond(item.request, true)}
                disabled={responding[item.request.id]}
                className="items-center justify-center rounded-full"
                style={{ width: 36, height: 36, backgroundColor: colors.primary }}
              >
                <MaterialIcons name="check" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          ) : (
            <ConversationRow
              conversation={item.conversation}
              lastMessage={item.conversation.lastMessageText}
              lastMessageAt={item.conversation.lastMessageAt}
              onPress={() => router.push(`/chat/${item.conversation.id}`)}
            />
          )
        }
        ListEmptyComponent={
          loading ? null : (
            <View className="mt-10">
              <EmptyState icon="notifications-none" title="No tienes notificaciones nuevas por ahora" />
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}
