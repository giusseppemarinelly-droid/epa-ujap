import { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { Avatar } from '@/src/components/ui';
import { useAuthStore, useConversationsStore } from '@/src/store';
import { colors } from '@/src/theme/tokens';
import type { Message } from '@/src/types';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const currentUserId = useAuthStore((state) => state.currentUser?.id);
  const conversations = useConversationsStore((state) => state.conversations);
  const messagesByConversation = useConversationsStore((state) => state.messagesByConversation);
  const fetchMessages = useConversationsStore((state) => state.fetchMessages);
  const fetchConversations = useConversationsStore((state) => state.fetchConversations);
  const sendMessage = useConversationsStore((state) => state.sendMessage);
  const markRead = useConversationsStore((state) => state.markRead);

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  const conversation = conversations.find((item) => item.id === id);
  const messages = messagesByConversation[id ?? ''] ?? [];

  useEffect(() => {
    if (!id || !currentUserId) return;
    fetchMessages(id);
    markRead(id);
    // Sin websockets todavía: mientras el chat está abierto, refrescamos
    // cada pocos segundos para que los mensajes nuevos y el estado "en
    // línea" de la otra persona aparezcan solos, sin recargar la página.
    const interval = setInterval(() => {
      fetchMessages(id);
      markRead(id);
      fetchConversations(currentUserId);
    }, 3000);
    return () => clearInterval(interval);
  }, [id, currentUserId, fetchMessages, markRead, fetchConversations]);

  async function handleSend() {
    if (!text.trim() || sending || !id) return;
    setSending(true);
    try {
      await sendMessage(id, text.trim());
      setText('');
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <View className="flex-row items-center px-margin-mobile py-3">
        <Pressable onPress={() => router.back()} className="mr-2 p-1">
          <MaterialIcons name="arrow-back" size={22} color={colors['on-surface']} />
        </Pressable>
        <Avatar uri={conversation?.avatarUrl} size={36} online={conversation?.online} />
        <View className="ml-2 flex-1">
          <Text
            className="text-on-surface"
            style={{ fontFamily: 'Inter_700Bold', fontSize: 16 }}
            numberOfLines={1}
          >
            {conversation?.title ?? 'Chat'}
          </Text>
          {conversation?.type === 'directa' && (
            <Text
              style={{
                fontSize: 12,
                color: conversation.online ? '#22C55E' : colors['on-surface-variant'],
              }}
            >
              {conversation.online ? 'En línea' : 'Desconectado'}
            </Text>
          )}
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => {
          const isMine = item.senderId === currentUserId;
          return (
            <View
              className={`rounded-md px-4 py-3 mb-2 ${isMine ? 'self-end bg-primary' : 'self-start bg-surface-container'}`}
              style={{ maxWidth: '80%' }}
            >
              <Text className={isMine ? 'text-on-primary' : 'text-on-surface'}>{item.text}</Text>
            </View>
          );
        }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <Text className="text-on-surface-variant text-center mt-10">
            Échale un epa — todavía no hay mensajes aquí.
          </Text>
        }
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="flex-row items-center px-margin-mobile py-3 gap-2">
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Escribe un mensaje..."
            placeholderTextColor={colors['on-surface-variant']}
            className="flex-1 bg-surface-container rounded-full px-4 py-3 text-on-surface"
            style={{ fontFamily: 'Inter_400Regular', fontSize: 14 }}
            multiline
          />
          <Pressable
            onPress={handleSend}
            disabled={!text.trim() || sending}
            className="bg-primary items-center justify-center rounded-full"
            style={{ width: 44, height: 44, opacity: !text.trim() || sending ? 0.5 : 1 }}
          >
            <MaterialIcons name="send" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
