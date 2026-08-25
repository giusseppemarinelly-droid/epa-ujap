import { Pressable, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { Avatar } from '@/src/components/ui';
import type { LastMessageSummary } from '@/src/store/useConversationsStore';
import { colors } from '@/src/theme/tokens';
import { formatRelativeTime } from '@/src/utils/formatRelativeTime';
import type { Conversation, MessageKind } from '@/src/types';

type MediaIcon = 'photo' | 'videocam' | 'photo-camera' | 'visibility-off';

type ConversationRowProps = {
  conversation: Conversation;
  lastMessage?: string;
  lastMessageAt?: string;
  lastMessageSummary?: LastMessageSummary;
  onPress: () => void;
};

// Una foto sin pie de foto llega con el texto vacío: sin esto el resumen del
// chat saldría en blanco y parecería que no pasó nada.
const MEDIA_SUMMARY: Record<Exclude<MessageKind, 'texto'>, { icon: MediaIcon; label: string }> = {
  imagen: { icon: 'photo', label: 'Foto' },
  video: { icon: 'videocam', label: 'Video' },
};

// Un Snap no dice si era foto o video: lo interesante es si queda algo por ver.
function describeSummary(summary: LastMessageSummary): { icon: MediaIcon; label: string; pending: boolean } | undefined {
  if (summary.ephemeral) {
    const pending = !summary.opened && !summary.mine;
    return {
      icon: pending ? 'photo-camera' : 'visibility-off',
      label: summary.opened ? 'Snap abierto' : 'Snap',
      pending,
    };
  }
  if (summary.kind === 'texto') return undefined;
  return { ...MEDIA_SUMMARY[summary.kind], pending: false };
}

export function ConversationRow({
  conversation,
  lastMessage,
  lastMessageAt,
  lastMessageSummary,
  onPress,
}: ConversationRowProps) {
  const isGroupLike = conversation.type !== 'directa';
  const media = lastMessageSummary ? describeSummary(lastMessageSummary) : undefined;

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
          <View className="flex-row items-center flex-1 mr-2">
            <Text
              className="text-on-surface shrink"
              style={{ fontFamily: 'Inter_700Bold', fontSize: 15 }}
              numberOfLines={1}
            >
              {conversation.title}
            </Text>
            {conversation.streakCount > 0 && (
              <View className="flex-row items-center ml-2">
                <MaterialIcons name="local-fire-department" size={14} color={colors.primary} />
                <Text
                  className="text-primary"
                  style={{ fontFamily: 'Inter_700Bold', fontSize: 12, marginLeft: 2 }}
                >
                  {conversation.streakCount}
                </Text>
              </View>
            )}
          </View>
          {lastMessageAt && (
            <Text className="text-on-surface-variant" style={{ fontSize: 12 }}>
              {formatRelativeTime(lastMessageAt)}
            </Text>
          )}
        </View>
        <View className="flex-row items-center mt-1">
          {media && (
            <MaterialIcons
              name={media.icon}
              size={14}
              color={media.pending ? colors.primary : colors['on-surface-variant']}
              style={{ marginRight: 4 }}
            />
          )}
          <Text
            className={media?.pending ? 'text-primary flex-1' : 'text-on-surface-variant flex-1'}
            style={{ fontSize: 13, fontFamily: media?.pending ? 'Inter_700Bold' : undefined }}
            numberOfLines={1}
          >
            {media
              ? lastMessage?.trim()
                ? `${media.label} · ${lastMessage.trim()}`
                : media.label
              : (lastMessage ?? (isGroupLike ? 'Sin mensajes todavía' : 'Échale un epa para empezar'))}
          </Text>
        </View>
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
