import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { ConversationRow } from '@/src/components/mensajes/ConversationRow';
import { EmptyState } from '@/src/components/ui';
import { useAuthStore, useConnectionsStore, useConversationsStore } from '@/src/store';
import { colors } from '@/src/theme/tokens';

type Tab = 'individual' | 'grupal';

const TABS: { value: Tab; label: string }[] = [
  { value: 'individual', label: 'Individual' },
  { value: 'grupal', label: 'Grupal' },
];

export default function MensajesScreen() {
  const router = useRouter();
  const currentUserId = useAuthStore((state) => state.currentUser?.id);
  const conversations = useConversationsStore((state) => state.conversations);
  const fetchConversations = useConversationsStore((state) => state.fetchConversations);
  const incomingCount = useConnectionsStore((state) => state.incoming.length);
  const fetchConnections = useConnectionsStore((state) => state.fetchAll);

  const [tab, setTab] = useState<Tab>('individual');
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!currentUserId) return;
    fetchConversations(currentUserId);
    const interval = setInterval(() => fetchConversations(currentUserId), 6000);
    return () => clearInterval(interval);
  }, [currentUserId, fetchConversations]);

  useEffect(() => {
    fetchConnections();
    const interval = setInterval(fetchConnections, 6000);
    return () => clearInterval(interval);
  }, [fetchConnections]);

  const filtered = useMemo(() => {
    const byTab = conversations.filter((conversation) =>
      tab === 'individual' ? conversation.type === 'directa' : conversation.type !== 'directa'
    );
    const q = query.trim().toLowerCase();
    return q ? byTab.filter((conversation) => conversation.title.toLowerCase().includes(q)) : byTab;
  }, [tab, query, conversations]);

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <View className="flex-row items-center px-margin-mobile py-3">
        <Text className="text-on-surface flex-1" style={{ fontFamily: 'Inter_800ExtraBold', fontSize: 20 }}>
          Epa
        </Text>
        <Pressable
          className="items-center justify-center rounded-full mr-2"
          style={{ width: 40, height: 40, backgroundColor: colors['surface-container'] }}
          onPress={() => router.push('/connections')}
        >
          <MaterialIcons name="waving-hand" size={18} color={colors['on-surface']} />
          {incomingCount > 0 && (
            <View
              className="absolute rounded-full items-center justify-center"
              style={{ top: -2, right: -2, minWidth: 16, height: 16, backgroundColor: colors.primary, paddingHorizontal: 3 }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 10, fontFamily: 'Inter_700Bold' }}>{incomingCount}</Text>
            </View>
          )}
        </Pressable>
        <Pressable
          className="items-center justify-center rounded-full"
          style={{ width: 40, height: 40, backgroundColor: colors['ujap-navy'] }}
          onPress={() => router.push('/chat/new')}
        >
          <MaterialIcons name="edit" size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      <View className="px-margin-mobile mb-4">
        <View className="flex-row items-center bg-surface-container rounded-full px-4 py-3">
          <MaterialIcons name="search" size={18} color={colors['on-surface-variant']} />
          <TextInput
            placeholder="Buscar chats o planes..."
            placeholderTextColor={colors['on-surface-variant']}
            value={query}
            onChangeText={setQuery}
            className="flex-1 ml-2 text-on-surface"
            style={{ fontFamily: 'Inter_400Regular', fontSize: 14 }}
          />
        </View>
      </View>

      <View className="flex-row px-margin-mobile mb-4 gap-6">
        {TABS.map(({ value, label }) => (
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

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        renderItem={({ item }) => (
          <ConversationRow
            conversation={item}
            lastMessage={item.lastMessageText}
            lastMessageAt={item.lastMessageAt}
            onPress={() => router.push(`/chat/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <View className="mt-10">
            <EmptyState
              icon="forum"
              title="Todavía no tienes chats aquí"
              description="Échale un epa a alguien desde Descubrir."
            />
          </View>
        }
      />
    </SafeAreaView>
  );
}
