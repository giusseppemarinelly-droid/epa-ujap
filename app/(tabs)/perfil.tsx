import { useEffect } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { Avatar, Badge, Button, Card, Chip } from '@/src/components/ui';
import { useAuthStore, useGroupsStore } from '@/src/store';
import { colors } from '@/src/theme/tokens';

export default function PerfilScreen() {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.currentUser);
  const allInterests = useAuthStore((state) => state.interests);
  const logout = useAuthStore((state) => state.logout);
  const groups = useGroupsStore((state) => state.groups);
  const fetchGroups = useGroupsStore((state) => state.fetchGroups);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  if (!currentUser) {
    return null;
  }

  const myInterests = allInterests.filter((interest) => currentUser.interestIds.includes(interest.id));
  const myGroups = groups.filter((group) => group.memberIds.includes(currentUser.id));

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ height: 140 }} className="bg-ujap-navy">
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&q=80' }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          <View
            className="absolute top-3 right-4 items-center justify-center rounded-full"
            style={{ width: 36, height: 36, backgroundColor: 'rgba(0,0,0,0.3)' }}
          >
            <MaterialIcons name="notifications" size={18} color="#FFFFFF" />
          </View>
        </View>

        <View className="items-center" style={{ marginTop: -48 }}>
          <View className="rounded-full" style={{ borderWidth: 4, borderColor: colors.surface }}>
            <Avatar uri={currentUser.photoUrl} size={96} />
          </View>
          <Text className="text-on-surface mt-3" style={{ fontFamily: 'Inter_800ExtraBold', fontSize: 22 }}>
            {currentUser.name}
          </Text>
          <Text className="text-on-surface-variant mt-1">{currentUser.career}</Text>
          <Text className="text-on-surface-variant" style={{ fontSize: 12 }}>
            Facultad de {currentUser.faculty}
          </Text>

          <View className="flex-row gap-2 mt-3">
            {currentUser.verified && <Badge label="Verificado UJAP" icon="verified" tone="gold" />}
            {currentUser.isOrganizer && <Badge label="Organizador" icon="star" tone="primary" />}
          </View>
        </View>

        <View className="flex-row gap-3 px-margin-mobile mt-6">
          <Card className="flex-1 items-center">
            <Text className="text-primary" style={{ fontFamily: 'Inter_800ExtraBold', fontSize: 24 }}>
              {currentUser.stats.plansCreated}
            </Text>
            <Text
              className="text-on-surface-variant mt-1"
              style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0.6 }}
            >
              PLANES ARMADOS
            </Text>
          </Card>
          <Card className="flex-1 items-center">
            <Text className="text-primary" style={{ fontFamily: 'Inter_800ExtraBold', fontSize: 24 }}>
              {currentUser.stats.attendances}
            </Text>
            <Text
              className="text-on-surface-variant mt-1"
              style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0.6 }}
            >
              ASISTENCIAS
            </Text>
          </Card>
        </View>

        <View className="px-margin-mobile mt-6">
          <Text className="text-on-surface mb-3" style={{ fontFamily: 'Inter_700Bold', fontSize: 16 }}>
            Intereses
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {myInterests.map((interest) => (
              <Chip key={interest.id} label={interest.label} />
            ))}
          </View>
        </View>

        <View className="px-margin-mobile mt-6">
          <Text className="text-on-surface mb-3" style={{ fontFamily: 'Inter_700Bold', fontSize: 16 }}>
            Mis grupos
          </Text>
          {myGroups.length === 0 ? (
            <Text className="text-on-surface-variant">Todavía no te has unido a ningún grupo.</Text>
          ) : (
            myGroups.map((group) => (
              <Card key={group.id} className="flex-row items-center mb-3">
                <View
                  className="items-center justify-center rounded-md bg-secondary-container"
                  style={{ width: 40, height: 40 }}
                >
                  <MaterialIcons name="groups" size={18} color={colors['on-secondary-container']} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-on-surface" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>
                    {group.name}
                  </Text>
                  <Text className="text-on-surface-variant mt-1" style={{ fontSize: 12 }}>
                    {group.memberIds.length} miembros
                  </Text>
                </View>
              </Card>
            ))
          )}
        </View>

        <View className="px-margin-mobile mt-4 gap-3">
          <Button label="Editar perfil" onPress={() => router.push('/profile/edit')} />
          <Button label="Cerrar sesión" variant="ghost" onPress={logout} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
