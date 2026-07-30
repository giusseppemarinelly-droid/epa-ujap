import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { Button, Chip, Input } from '@/src/components/ui';
import { useAuthStore } from '@/src/store';
import { colors } from '@/src/theme/tokens';
import type { Faculty, LookingFor } from '@/src/types';

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
