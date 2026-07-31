import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { Avatar, Badge, Button, Card, Chip } from '@/src/components/ui';
import { useAuthStore, useGroupsStore, useThemeStore } from '@/src/store';
import { colors } from '@/src/theme/tokens';

function ThemeToggle() {
  const resolvedScheme = useThemeStore((state) => state.resolvedScheme);
  const setThemePreference = useThemeStore((state) => state.setThemePreference);
  const isDark = resolvedScheme === 'dark';

  return (
    <Pressable
      onPress={() => setThemePreference(isDark ? 'light' : 'dark')}
      className="flex-row bg-surface-container rounded-full p-1 self-start"
      style={{ width: 72 }}
    >
      <View
        className="flex-1 items-center justify-center rounded-full"
        style={{ height: 36, backgroundColor: !isDark ? colors.primary : 'transparent' }}
      >
        <MaterialIcons name="light-mode" size={16} color={!isDark ? '#FFFFFF' : colors['on-surface-variant']} />
      </View>
      <View
        className="flex-1 items-center justify-center rounded-full"
        style={{ height: 36, backgroundColor: isDark ? colors.primary : 'transparent' }}
      >
        <MaterialIcons name="dark-mode" size={16} color={isDark ? '#FFFFFF' : colors['on-surface-variant']} />
      </View>
    </Pressable>
  );
}

export default function PerfilScreen() {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.currentUser);
  const allInterests = useAuthStore((state) => state.interests);
  const logout = useAuthStore((state) => state.logout);
  const uploadPhoto = useAuthStore((state) => state.uploadPhoto);
  const groups = useGroupsStore((state) => state.groups);
  const fetchGroups = useGroupsStore((state) => state.fetchGroups);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  async function handleChangePhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso necesario', 'Epa necesita acceso a tus fotos para cambiar tu foto de perfil.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.4,
      base64: true,
    });

    if (result.canceled || !result.assets[0]?.base64) return;

    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? 'image/jpeg';

    setUploadingPhoto(true);
    try {
      await uploadPhoto(asset.base64!, mimeType);
    } catch (err) {
      Alert.alert('No se pudo subir la foto', err instanceof Error ? err.message : undefined);
    } finally {
      setUploadingPhoto(false);
    }
  }

  if (!currentUser) {
    return null;
  }

  const myInterests = allInterests.filter((interest) => currentUser.interestIds.includes(interest.id));
  const myGroups = groups.filter((group) => group.memberIds.includes(currentUser.id));

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ height: 200 }} className="bg-ujap-navy">
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
          <Pressable onPress={handleChangePhoto} disabled={uploadingPhoto}>
            <View className="rounded-full" style={{ borderWidth: 4, borderColor: colors.surface }}>
              <Avatar uri={currentUser.photoUrl} size={96} />
            </View>
            <View
              className="absolute bottom-0 right-0 items-center justify-center rounded-full bg-primary"
              style={{ width: 32, height: 32, borderWidth: 2, borderColor: colors.surface }}
            >
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <MaterialIcons name="photo-camera" size={16} color="#FFFFFF" />
              )}
            </View>
          </Pressable>
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
            <View
              className="items-center justify-center rounded-full mb-2"
              style={{ width: 40, height: 40, backgroundColor: colors['primary-container'] }}
            >
              <MaterialIcons name="event" size={18} color={colors.primary} />
            </View>
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
            <View
              className="items-center justify-center rounded-full mb-2"
              style={{ width: 40, height: 40, backgroundColor: colors['secondary-container'] }}
            >
              <MaterialIcons name="how-to-reg" size={18} color={colors.secondary} />
            </View>
            <Text className="text-secondary" style={{ fontFamily: 'Inter_800ExtraBold', fontSize: 24 }}>
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

        <View className="px-margin-mobile mt-6">
          <Text className="text-on-surface mb-3" style={{ fontFamily: 'Inter_700Bold', fontSize: 16 }}>
            Apariencia
          </Text>
          <ThemeToggle />
        </View>

        <View className="px-margin-mobile mt-4 gap-3">
          <Button label="Editar perfil" onPress={() => router.push('/profile/edit')} />
          <Button label="Cerrar sesión" variant="ghost" onPress={logout} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
