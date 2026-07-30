import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

import { Chip } from '@/src/components/ui';
import { useAuthStore } from '@/src/store';
import { colors, epaGradient, radii } from '@/src/theme/tokens';
import type { User } from '@/src/types';

type DiscoverCardProps = {
  user: User;
};

export function DiscoverCard({ user }: DiscoverCardProps) {
  const allInterests = useAuthStore((state) => state.interests);
  const userInterests = allInterests.filter((interest) => user.interestIds.includes(interest.id));

  const [photoIndex, setPhotoIndex] = useState(0);
  const photos = user.photos;
  const hasPhotos = photos.length > 0;
  const currentPhoto = photos[photoIndex];

  function goToPhoto(delta: number) {
    if (!hasPhotos) return;
    setPhotoIndex((prev) => Math.min(Math.max(prev + delta, 0), photos.length - 1));
  }

  return (
    <View className="flex-1 rounded-lg overflow-hidden" style={{ borderRadius: radii.lg }}>
      {hasPhotos ? (
        <Image key={currentPhoto} source={{ uri: currentPhoto }} className="absolute inset-0 w-full h-full" resizeMode="cover" />
      ) : (
        <LinearGradient
          colors={epaGradient}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        >
          <View className="flex-1 items-center justify-center">
            <View
              className="items-center justify-center rounded-full"
              style={{ width: 96, height: 96, backgroundColor: 'rgba(255,255,255,0.25)' }}
            >
              <MaterialIcons name="person" size={56} color="#FFFFFF" />
            </View>
          </View>
        </LinearGradient>
      )}

      {/* Zonas invisibles para pasar de foto, como en Tinder/Instagram. */}
      {photos.length > 1 && (
        <View className="absolute top-0 left-0 right-0 bottom-0 flex-row">
          <Pressable className="flex-1" onPress={() => goToPhoto(-1)} />
          <Pressable className="flex-1" onPress={() => goToPhoto(1)} />
        </View>
      )}

      {photos.length > 1 && (
        <View className="absolute top-3 left-3 right-3 flex-row" style={{ gap: 4 }}>
          {photos.map((photo, index) => (
            <View
              key={photo}
              className="flex-1 rounded-full overflow-hidden"
              style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.35)' }}
            >
              {index <= photoIndex && <View className="bg-white" style={{ flex: 1 }} />}
            </View>
          ))}
        </View>
      )}

      <LinearGradient
        colors={['transparent', 'rgba(19,35,62,0.85)']}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%' }}
        pointerEvents="none"
      />
      <View className="absolute left-5 right-5 bottom-5" pointerEvents="none">
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
