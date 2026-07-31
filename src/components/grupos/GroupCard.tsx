import { Image, Pressable, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { Card } from '@/src/components/ui';
import { getCategoryAccents } from '@/src/theme/tokens';
import type { Group, GroupCategory } from '@/src/types';

const CATEGORY_ICON: Record<GroupCategory, keyof typeof MaterialIcons.glyphMap> = {
  Académico: 'school',
  Deportes: 'sports-soccer',
  Tecnología: 'smart-toy',
  Creatividad: 'palette',
  Arte: 'music-note',
};

type GroupCardProps = {
  group: Group;
  isMember: boolean;
  onPress: () => void;
  onToggleMembership: () => void;
};

export function GroupCard({ group, isMember, onPress, onToggleMembership }: GroupCardProps) {
  const accent = getCategoryAccents()[group.category];

  return (
    <Pressable onPress={onPress}>
      <Card className="flex-row items-center mb-3">
        {group.imageUrl ? (
          <Image source={{ uri: group.imageUrl }} style={{ width: 48, height: 48, borderRadius: 16 }} />
        ) : (
          <View
            className="items-center justify-center rounded-md"
            style={{ width: 48, height: 48, backgroundColor: accent.bg }}
          >
            <MaterialIcons name={CATEGORY_ICON[group.category]} size={22} color={accent.fg} />
          </View>
        )}
        <View className="flex-1 ml-3">
          <Text className="text-on-surface" style={{ fontFamily: 'Inter_700Bold', fontSize: 15 }}>
            {group.name}
          </Text>
          <Text className="text-on-surface-variant mt-1" style={{ fontSize: 12 }}>
            {group.category} · {group.memberIds.length} miembros
          </Text>
        </View>
        <Pressable
          onPress={onToggleMembership}
          className={`rounded-full px-4 py-2 ${isMember ? 'bg-surface-container' : 'bg-primary'}`}
        >
          <Text
            className={isMember ? 'text-on-surface-variant' : 'text-on-primary'}
            style={{ fontFamily: 'Inter_700Bold', fontSize: 12 }}
          >
            {isMember ? 'Dentro' : 'Me apunto'}
          </Text>
        </Pressable>
      </Card>
    </Pressable>
  );
}
