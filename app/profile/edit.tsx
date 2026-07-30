import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { Button, Chip, Input } from '@/src/components/ui';
import { useAuthStore } from '@/src/store';
import { colors } from '@/src/theme/tokens';
import type { Faculty, LookingFor } from '@/src/types';

const MAX_PHOTOS = 6;

const faculties: Faculty[] = [
  'Ingeniería',
  'Ciencias Jurídicas y Políticas',
  'Ciencias Económicas y Sociales',
  'Ciencias de la Salud',
];

const semesterOptions = [1, 2, 3, 4, 5];

const lookingForOptions: { value: LookingFor; label: string }[] = [
  { value: 'deportes', label: 'Deportes' },
  { value: 'estudio', label: 'Estudio' },
  { value: 'proyectos', label: 'Proyectos' },
  { value: 'amistades', label: 'Amistades' },
  { value: 'eventos', label: 'Eventos' },
];

export default function EditProfileScreen() {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.currentUser);
  const interests = useAuthStore((state) => state.interests);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const addGalleryPhoto = useAuthStore((state) => state.addGalleryPhoto);
  const removeGalleryPhoto = useAuthStore((state) => state.removeGalleryPhoto);

  const [photoBusy, setPhotoBusy] = useState(false);

  const [name, setName] = useState(currentUser?.name ?? '');
  const [bio, setBio] = useState(currentUser?.bio ?? '');
  const [career, setCareer] = useState(currentUser?.career ?? '');
  const [faculty, setFaculty] = useState<Faculty | undefined>(currentUser?.faculty);
  const [semester, setSemester] = useState(currentUser?.semester ?? 1);
  const [interestIds, setInterestIds] = useState<string[]>(currentUser?.interestIds ?? []);
  const [lookingFor, setLookingFor] = useState<LookingFor[]>(currentUser?.lookingFor ?? []);
  const [submitting, setSubmitting] = useState(false);

  function toggleInterest(id: string) {
    setInterestIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  function toggleLookingFor(value: LookingFor) {
    setLookingFor((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  }

  async function handleAddPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso necesario', 'Epa necesita acceso a tus fotos para agregarlas a tu perfil.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.4,
      base64: true,
    });

    if (result.canceled || !result.assets[0]?.base64) return;

    const asset = result.assets[0];
    setPhotoBusy(true);
    try {
      await addGalleryPhoto(asset.base64!, asset.mimeType ?? 'image/jpeg');
    } catch (err) {
      Alert.alert('No se pudo subir la foto', err instanceof Error ? err.message : undefined);
    } finally {
      setPhotoBusy(false);
    }
  }

  function handleRemovePhoto(photoUrl: string) {
    Alert.alert('Quitar foto', '¿Quitar esta foto de tu perfil?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: async () => {
          setPhotoBusy(true);
          try {
            await removeGalleryPhoto(photoUrl);
          } catch (err) {
            Alert.alert('No se pudo quitar', err instanceof Error ? err.message : undefined);
          } finally {
            setPhotoBusy(false);
          }
        },
      },
    ]);
  }

  async function handleSubmit() {
    if (submitting || !name.trim()) return;
    setSubmitting(true);
    try {
      await updateProfile({ name: name.trim(), bio, career, faculty, semester, interestIds, lookingFor });
      router.back();
    } catch (err) {
      Alert.alert('No se pudo guardar', err instanceof Error ? err.message : undefined);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View className="flex-row items-center mb-6">
          <Pressable onPress={() => router.back()} className="mr-2">
            <MaterialIcons name="arrow-back" size={22} color={colors['on-surface']} />
          </Pressable>
          <Text className="text-on-surface flex-1" style={{ fontFamily: 'Inter_800ExtraBold', fontSize: 20 }}>
            Editar perfil
          </Text>
        </View>

        <Text
          className="text-on-surface-variant mb-2"
          style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12 }}
        >
          TUS FOTOS ({(currentUser?.photos.length ?? 0)}/{MAX_PHOTOS})
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {(currentUser?.photos ?? []).map((photo) => (
            <Pressable
              key={photo}
              onPress={() => handleRemovePhoto(photo)}
              disabled={photoBusy}
              style={{ width: 84, height: 112 }}
            >
              <Image source={{ uri: photo }} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
              <View
                className="absolute top-1 right-1 items-center justify-center rounded-full bg-ujap-navy"
                style={{ width: 22, height: 22 }}
              >
                <MaterialIcons name="close" size={14} color="#FFFFFF" />
              </View>
            </Pressable>
          ))}
          {(currentUser?.photos.length ?? 0) < MAX_PHOTOS && (
            <Pressable
              onPress={handleAddPhoto}
              disabled={photoBusy}
              className="items-center justify-center rounded-md bg-surface-container"
              style={{ width: 84, height: 112 }}
            >
              {photoBusy ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <MaterialIcons name="add-a-photo" size={26} color={colors['on-surface-variant']} />
              )}
            </Pressable>
          )}
        </View>
        <Text className="text-on-surface-variant mb-6" style={{ fontSize: 12 }}>
          Estas fotos son las que ven los demás en Descubrir. La primera es tu foto principal.
        </Text>

        <Input label="Nombre" value={name} onChangeText={setName} />
        <Input
          label="Bio corta"
          multiline
          numberOfLines={3}
          value={bio}
          onChangeText={setBio}
          style={{ minHeight: 80, textAlignVertical: 'top' }}
        />
        <Input label="Carrera" value={career} onChangeText={setCareer} />

        <Text
          className="text-on-surface-variant mb-2"
          style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12 }}
        >
          FACULTAD
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {faculties.map((option) => (
            <Chip key={option} label={option} selected={faculty === option} onPress={() => setFaculty(option)} />
          ))}
        </View>

        <Text
          className="text-on-surface-variant mb-2"
          style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12 }}
        >
          SEMESTRE
        </Text>
        <View className="flex-row gap-2 mb-4">
          {semesterOptions.map((option) => (
            <Pressable
              key={option}
              onPress={() => setSemester(option)}
              className={`flex-1 items-center justify-center rounded-full py-3 ${
                semester === option ? 'bg-primary' : 'bg-surface-container'
              }`}
            >
              <Text
                className={semester === option ? 'text-on-primary' : 'text-on-surface-variant'}
                style={{ fontFamily: 'Inter_700Bold', fontSize: 14 }}
              >
                {option === 5 ? '5+' : option}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text
          className="text-on-surface-variant mb-2"
          style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12 }}
        >
          INTERESES
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {interests.map((interest) => (
            <Chip
              key={interest.id}
              label={interest.label}
              selected={interestIds.includes(interest.id)}
              onPress={() => toggleInterest(interest.id)}
            />
          ))}
        </View>

        <Text
          className="text-on-surface-variant mb-2"
          style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12 }}
        >
          ¿QUÉ BUSCAS EN EPA?
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-8">
          {lookingForOptions.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={lookingFor.includes(option.value)}
              onPress={() => toggleLookingFor(option.value)}
            />
          ))}
        </View>

        <Button
          label={submitting ? 'Guardando...' : 'Guardar cambios'}
          onPress={handleSubmit}
          disabled={submitting || !name.trim()}
          loading={submitting}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
