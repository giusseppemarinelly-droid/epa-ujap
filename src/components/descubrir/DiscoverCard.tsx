import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

import { Avatar, Chip } from '@/src/components/ui';
import { useAuthStore } from '@/src/store';
import { colors, getEpaGradient, radii } from '@/src/theme/tokens';
import type { User } from '@/src/types';

type DiscoverCardProps = {
  user: User;
  currentUser: User;
};

function sharedInterestsPercent(currentUser: User, candidate: User): number | null {
  if (currentUser.interestIds.length === 0) return null;
  const shared = candidate.interestIds.filter((id) => currentUser.interestIds.includes(id));
  return Math.round((shared.length / currentUser.interestIds.length) * 100);
}

export function DiscoverCard({ user, currentUser }: DiscoverCardProps) {
  const allInterests = useAuthStore((state) => state.interests);
  const userInterests = allInterests.filter((interest) => user.interestIds.includes(interest.id));

  const [photoIndex, setPhotoIndex] = useState(0);
  const photos = user.photos;
  const hasPhotos = photos.length > 0;
  const currentPhoto = photos[photoIndex];

  // A partir de la segunda foto se reemplazan los chips por lo que tienen
  // en común, en vez de un panel aparte debajo que empujaba la tarjeta y
  // recortaba la foto: al pasar de foto aparece más información.
  const showExtraInfo = photoIndex > 0;
  const percent = sharedInterestsPercent(currentUser, user);
  const mutuals = user.mutualConnections;

  function goToPhoto(delta: number) {
    if (!hasPhotos) return;
    setPhotoIndex((prev) => Math.min(Math.max(prev + delta, 0), photos.length - 1));
  }

  return (
    <View className="flex-1 rounded-lg overflow-hidden" style={{ borderRadius: radii.lg }}>
      {hasPhotos ? (
        <Image
          key={currentPhoto}
          source={{ uri: currentPhoto }}
          className="absolute inset-0 w-full h-full"
          resizeMode="cover"
        />
      ) : (
        <LinearGradient
          colors={getEpaGradient()}
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
            <MaterialIcons name="verified" size={20} color={colors['ujap-gold']} style={{ marginLeft: 6 }} />
          )}
          {user.online && (
            <View className="flex-row items-center ml-3">
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' }} />
              <Text className="text-white/90 ml-1" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>
                En línea
              </Text>
            </View>
          )}
        </View>
        <Text className="text-white/90 mt-1" style={{ fontSize: 14 }}>
          {user.career}
        </Text>

        {!showExtraInfo ? (
          <View className="flex-row flex-wrap gap-2 mt-3">
            <Chip label={`${user.semester}${user.semester === 5 ? '+' : ''}º semestre`} />
            {userInterests.slice(0, 2).map((interest) => (
              <Chip key={interest.id} label={interest.label} />
            ))}
          </View>
        ) : (
          <View className="mt-3">
            {percent !== null && (
              <View
                className="flex-row items-center self-start rounded-full px-3 py-1.5"
                style={{ backgroundColor: 'rgba(255,255,255,0.22)' }}
              >
                <MaterialIcons name="interests" size={14} color="#FFFFFF" />
                <Text className="text-white ml-1" style={{ fontFamily: 'Inter_700Bold', fontSize: 12 }}>
                  {percent}% en común
                </Text>
              </View>
            )}
            {mutuals.length > 0 && (
              <View className="flex-row items-center mt-2">
                <MaterialIcons name="groups" size={14} color="#FFFFFF" />
                <Text className="text-white/90 ml-1" style={{ fontSize: 12 }}>
                  {mutuals.length === 1 ? '1 conexión en común' : `${mutuals.length} conexiones en común`}
                </Text>
                <View className="flex-row ml-2">
                  {mutuals.slice(0, 3).map((mutual, index) => (
                    <View
                      key={mutual.id}
                      style={{ marginLeft: index === 0 ? 0 : -8, borderWidth: 1.5, borderColor: '#FFFFFF', borderRadius: 999 }}
                    >
                      <Avatar uri={mutual.photoUrl} size={22} />
                    </View>
                  ))}
                </View>
              </View>
            )}
            {percent === null && mutuals.length === 0 && (
              <Text className="text-white/80" style={{ fontSize: 12 }}>
                Todavía no tienen intereses ni conexiones en común.
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
