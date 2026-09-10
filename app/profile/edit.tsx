import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { Button, Chip, ConfirmDialog, Input } from '@/src/components/ui';
import { useAuthStore } from '@/src/store';
import { colors, elevation, getEpaGradient, radii } from '@/src/theme/tokens';
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
  const reorderPhotos = useAuthStore((state) => state.reorderPhotos);

  const [photoBusy, setPhotoBusy] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [photoToRemove, setPhotoToRemove] = useState<string | null>(null);

  const [name, setName] = useState(currentUser?.name ?? '');
  const [bio, setBio] = useState(currentUser?.bio ?? '');
  const [career, setCareer] = useState(currentUser?.career ?? '');
  const [faculty, setFaculty] = useState<Faculty | undefined>(currentUser?.faculty);
  const [semester, setSemester] = useState(currentUser?.semester ?? 1);
  const [interestIds, setInterestIds] = useState<string[]>(currentUser?.interestIds ?? []);
  const [lookingFor, setLookingFor] = useState<LookingFor[]>(currentUser?.lookingFor ?? []);
  const [submitting, setSubmitting] = useState(false);

  const photos = currentUser?.photos ?? [];
  // El índice se acota en cada render: la galería cambia al agregar, quitar o
  // reordenar y el estado de la vista previa puede quedar apuntando afuera.
  const previewIndexInRange = photos.length > 0 ? Math.min(previewIndex, photos.length - 1) : 0;
  const previewPhoto = photos[previewIndexInRange];

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

  // Mover de a una posición con flechas en vez de arrastrar: en móvil el
  // arrastre dentro de un ScrollView pelea con el scroll y además pediría una
  // librería nueva.
  async function handleMovePhoto(index: number, delta: number) {
    const target = index + delta;
    if (photoBusy || target < 0 || target >= photos.length) return;

    const next = [...photos];
    const moved = next[index];
    if (!moved) return;
    next.splice(index, 1);
    next.splice(target, 0, moved);

    setPhotoBusy(true);
    try {
      await reorderPhotos(next);
      // La vista previa sigue a la foto movida para que se vea el cambio.
      setPreviewIndex(target);
    } catch (err) {
      Alert.alert('No se pudo reordenar', err instanceof Error ? err.message : undefined);
    } finally {
      setPhotoBusy(false);
    }
  }

  // Modal propio en vez de Alert.alert: en la versión web (esta app se sirve
  // como sitio estático) Alert.alert depende de window.confirm, que varios
  // navegadores in-app bloquean en silencio y el botón parece no hacer nada.
  function handleRemovePhoto(photoUrl: string) {
    setPhotoToRemove(photoUrl);
  }

  async function confirmRemovePhoto() {
    const photoUrl = photoToRemove;
    if (!photoUrl) return;
    setPhotoToRemove(null);
    setPhotoBusy(true);
    try {
      await removeGalleryPhoto(photoUrl);
    } catch (err) {
      Alert.alert('No se pudo quitar', err instanceof Error ? err.message : undefined);
    } finally {
      setPhotoBusy(false);
    }
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
          ASÍ TE VEN EN DESCUBRIR
        </Text>
        {/* Réplica del aspecto de DiscoverCard: mismo carrusel, mismas barritas
            y mismo degradado, para que lo que se ve aquí sea lo que ve el resto. */}
        <View
          className="overflow-hidden mb-3"
          style={{
            width: '100%',
            aspectRatio: 3 / 4,
            borderRadius: radii.lg,
            backgroundColor: colors['ujap-navy'],
            ...elevation.card,
          }}
        >
          {previewPhoto ? (
            <Image
              key={previewPhoto}
              source={{ uri: previewPhoto }}
              style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={getEpaGradient()}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                className="items-center justify-center rounded-full"
                style={{ width: 96, height: 96, backgroundColor: 'rgba(255,255,255,0.25)' }}
              >
                <MaterialIcons name="person" size={56} color="#FFFFFF" />
              </View>
              <Text className="text-white/90 mt-4 px-8 text-center" style={{ fontSize: 13 }}>
                Agrega una foto para que te reconozcan en Descubrir
              </Text>
            </LinearGradient>
          )}

          {/* Mismos toques laterales que en la tarjeta real. */}
          {photos.length > 1 && (
            <View className="absolute top-0 left-0 right-0 bottom-0 flex-row">
              <Pressable
                className="flex-1"
                accessibilityLabel="Foto anterior"
                onPress={() => setPreviewIndex(Math.max(previewIndexInRange - 1, 0))}
              />
              <Pressable
                className="flex-1"
                accessibilityLabel="Foto siguiente"
                onPress={() => setPreviewIndex(Math.min(previewIndexInRange + 1, photos.length - 1))}
              />
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
                  {index <= previewIndexInRange && <View className="bg-white" style={{ flex: 1 }} />}
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
                {name || 'Tu nombre'}
                {currentUser?.age ? `, ${currentUser.age}` : ''}
              </Text>
              {currentUser?.verified && (
                <MaterialIcons name="verified" size={20} color={colors['ujap-gold']} style={{ marginLeft: 6 }} />
              )}
            </View>
            <Text className="text-white/90 mt-1" style={{ fontSize: 14 }}>
              {career || 'Tu carrera'}
            </Text>
          </View>
        </View>

        <Text
          className="text-on-surface-variant mb-2"
          style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12 }}
        >
          TUS FOTOS ({photos.length}/{MAX_PHOTOS})
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-3">
          {photos.map((photo, index) => (
            <View key={photo} style={{ width: 84, height: 112 }}>
              <Image
                source={{ uri: photo }}
                style={{ width: '100%', height: '100%', borderRadius: radii.sm }}
              />
              {/* Va antes que los botones para que ellos queden encima y se
                  lleven el toque. */}
              <Pressable
                accessibilityLabel="Ver esta foto en la vista previa"
                onPress={() => setPreviewIndex(index)}
                style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
              />

              {index === 0 && (
                <View
                  className="absolute top-1 left-1 items-center justify-center rounded-full bg-primary"
                  style={{ width: 22, height: 22 }}
                >
                  <MaterialIcons name="star" size={13} color="#FFFFFF" />
                </View>
              )}

              <Pressable
                onPress={() => handleRemovePhoto(photo)}
                disabled={photoBusy}
                accessibilityLabel="Quitar foto"
                className="absolute top-1 right-1 items-center justify-center rounded-full bg-ujap-navy"
                style={{ width: 22, height: 22 }}
              >
                <MaterialIcons name="close" size={14} color="#FFFFFF" />
              </Pressable>

              <View className="absolute bottom-1 left-1 right-1 flex-row justify-between">
                <Pressable
                  onPress={() => handleMovePhoto(index, -1)}
                  disabled={photoBusy || index === 0}
                  accessibilityLabel="Mover foto a la izquierda"
                  className="items-center justify-center rounded-full"
                  style={{
                    width: 24,
                    height: 24,
                    backgroundColor: 'rgba(0,0,0,0.45)',
                    opacity: index === 0 ? 0.3 : 1,
                  }}
                >
                  <MaterialIcons name="chevron-left" size={18} color="#FFFFFF" />
                </Pressable>
                <Pressable
                  onPress={() => handleMovePhoto(index, 1)}
                  disabled={photoBusy || index === photos.length - 1}
                  accessibilityLabel="Mover foto a la derecha"
                  className="items-center justify-center rounded-full"
                  style={{
                    width: 24,
                    height: 24,
                    backgroundColor: 'rgba(0,0,0,0.45)',
                    opacity: index === photos.length - 1 ? 0.3 : 1,
                  }}
                >
                  <MaterialIcons name="chevron-right" size={18} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          ))}
          {photos.length < MAX_PHOTOS && (
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
          Estas fotos son las que ven los demás en Descubrir. La primera es tu foto principal: usa las
          flechas para cambiar el orden.
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

      <ConfirmDialog
        visible={photoToRemove !== null}
        title="Quitar foto"
        message="¿Quitar esta foto de tu perfil?"
        confirmLabel="Quitar"
        destructive
        onConfirm={confirmRemovePhoto}
        onCancel={() => setPhotoToRemove(null)}
      />
    </SafeAreaView>
  );
}
