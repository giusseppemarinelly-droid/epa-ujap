import { Pressable, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { Avatar } from '@/src/components/ui';
import { colors } from '@/src/theme/tokens';
import { formatRelativeTime } from '@/src/utils/formatRelativeTime';
import type { Conversation } from '@/src/types';

type ConversationRowProps = {
  conversation: Conversation;
  lastMessage?: string;
  lastMessageAt?: string;
  onPress: () => void;
};

export function ConversationRow({ conversation, lastMessage, lastMessageAt, onPress }: ConversationRowProps) {
  const isGroupLike = conversation.type !== 'directa';

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center bg-surface-container-lowest rounded-md p-3 mb-3"
    >
      {conversation.avatarUrl ? (
        <Avatar uri={conversation.avatarUrl} size={48} online={isGroupLike ? false : conversation.online} />
      ) : (
        <View
          className="items-center justify-center rounded-full bg-secondary-container"
          style={{ width: 48, height: 48 }}
        >
          <MaterialIcons
            name={conversation.type === 'plan' ? 'event' : 'groups'}
            size={22}
            color={colors['on-secondary-container']}
          />
        </View>
      )}
      <View className="flex-1 ml-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-on-surface" style={{ fontFamily: 'Inter_700Bold', fontSize: 15 }}>
            {conversation.title}
          </Text>
          {lastMessageAt && (
            <Text className="text-on-surface-variant" style={{ fontSize: 12 }}>
              {formatRelativeTime(lastMessageAt)}
            </Text>
          )}
        </View>
        <Text className="text-on-surface-variant mt-1" style={{ fontSize: 13 }} numberOfLines={1}>
          {lastMessage ?? (isGroupLike ? 'Sin mensajes todavía' : 'Échale un epa para empezar')}
        </Text>
      </View>
      {conversation.unreadCount > 0 && (
        <View
          className="items-center justify-center rounded-full bg-primary ml-2"
          style={{ minWidth: 22, height: 22, paddingHorizontal: 6 }}
        >
          <Text className="text-on-primary" style={{ fontFamily: 'Inter_700Bold', fontSize: 11 }}>
            {conversation.unreadCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
