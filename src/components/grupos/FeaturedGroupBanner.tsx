import { ImageBackground, Pressable, Text, View } from 'react-native';

import { Button } from '@/src/components/ui';
import { elevation, radii } from '@/src/theme/tokens';
import type { Group } from '@/src/types';

type FeaturedGroupBannerProps = {
  group: Group;
  isMember: boolean;
  onPress: () => void;
  onToggleMembership: () => void;
};

export function FeaturedGroupBanner({ group, isMember, onPress, onToggleMembership }: FeaturedGroupBannerProps) {
  return (
    <Pressable onPress={onPress} className="rounded-lg overflow-hidden mb-6" style={elevation.card}>
      <ImageBackground
        source={group.imageUrl ? { uri: group.imageUrl } : undefined}
        style={{ padding: 20, minHeight: 160, justifyContent: 'flex-end' }}
        imageStyle={{ borderRadius: radii.lg }}
      >
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: 'rgba(19,35,62,0.45)',
            borderRadius: radii.lg,
          }}
        />
        <Text className="text-white" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 0.6 }}>
          GRUPO DESTACADO
        </Text>
        <Text className="text-white mt-1" style={{ fontFamily: 'Inter_800ExtraBold', fontSize: 22 }}>
          {group.name}
        </Text>
        <Text className="text-white/90 mt-1 mb-4" style={{ fontSize: 13 }}>
          {group.memberIds.length} miembros
        </Text>
        <Button
          label={isMember ? 'Ya estás dentro' : 'Me apunto'}
          onPress={onToggleMembership}
          disabled={isMember}
        />
      </ImageBackground>
    </Pressable>
  );
}
