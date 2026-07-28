import { Image, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

import { Chip } from '@/src/components/ui';
import { interests as allInterests } from '@/src/mocks';
import { colors, elevation } from '@/src/theme/tokens';
import type { User } from '@/src/types';

type DiscoverCardProps = {
  user: User;
};

export function DiscoverCard({ user }: DiscoverCardProps) {
  const userInterests = allInterests.filter((interest) => user.interestIds.includes(interest.id));

  return (
    <View className="flex-1 rounded-md overflow-hidden bg-surface-container" style={elevation.card}>
      {user.photoUrl ? (
        <Image
          source={{ uri: user.photoUrl }}
          className="absolute inset-0 w-full h-full"
          resizeMode="cover"
        />
      ) : (
        <View className="absolute inset-0 items-center justify-center">
          <MaterialIcons name="person" size={96} color={colors['on-surface-variant']} />
        </View>
      )}
      <LinearGradient
        colors={['transparent', 'rgba(19,35,62,0.85)']}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%' }}
      />
      <View className="absolute left-5 right-5 bottom-5">
        <View className="flex-row items-center">
          <Text className="text-white" style={{ fontFamily: 'Inter_800ExtraBold', fontSize: 24 }}>
            {user.name}, {user.age}
          </Text>
          {user.verified && (
            <MaterialIcons
              name="verified"
              size={20}
              color={colors['ujap-gold']}
              style={{ marginLeft: 6 }}
            />
          )}
        </View>
        <Text className="text-white/90 mt-1" style={{ fontSize: 14 }}>
          {user.career}
        </Text>
        <View className="flex-row flex-wrap gap-2 mt-3">
          <Chip label={`${user.semester}${user.semester === 5 ? '+' : ''}º semestre`} />
          {userInterests.slice(0, 2).map((interest) => (
            <Chip key={interest.id} label={interest.label} />
          ))}
        </View>
      </View>
    </View>
  );
}
