import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Chip, Input } from '@/src/components/ui';
import { LookingForCard } from '@/src/components/onboarding/LookingForCard';
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

const lookingForOptions: { value: LookingFor; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { value: 'deportes', label: 'Deportes', icon: 'sports-soccer' },
  { value: 'estudio', label: 'Estudio', icon: 'school' },
  { value: 'proyectos', label: 'Proyectos', icon: 'rocket-launch' },
  { value: 'amistades', label: 'Amistades', icon: 'handshake' },
  { value: 'eventos', label: 'Eventos', icon: 'celebration' },
];

const EMAIL_DOMAIN = '@ujap.edu.ve';

export default function OnboardingScreen() {
  const router = useRouter();
  const draft = useAuthStore((state) => state.draft);
  const interests = useAuthStore((state) => state.interests);
  const setDraftField = useAuthStore((state) => state.setDraftField);
  const toggleInterest = useAuthStore((state) => state.toggleInterest);
  const toggleLookingFor = useAuthStore((state) => state.toggleLookingFor);
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);
  const loadInterests = useAuthStore((state) => state.loadInterests);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadInterests();
  }, [loadInterests]);

  const isEmailValid =
    draft.email.toLowerCase().trim().endsWith(EMAIL_DOMAIN) && draft.email.length > EMAIL_DOMAIN.length;

  const isFormComplete = useMemo(
    () =>
      draft.name.trim().length > 1 &&
      isEmailValid &&
      draft.password.length >= 8 &&
      !!draft.faculty &&
      !!draft.career &&
      draft.career.trim().length > 0 &&
      !!draft.semester &&
      draft.interestIds.length > 0 &&
      draft.lookingFor.length > 0,
    [isEmailValid, draft]
  );

  async function handleSubmit() {
    if (!isFormComplete || submitting) return;
    setSubmitting(true);
    try {
      await completeOnboarding();
      router.replace('/(tabs)/mapa');
    } catch (err) {
      Alert.alert('No se pudo completar el registro', err instanceof Error ? err.message : undefined);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 24 }}
      >
        <View className="items-center mb-8">
          <View
            className="bg-primary-container items-center justify-center rounded-full mb-4"
            style={{ width: 72, height: 72 }}
          >
            <MaterialIcons name="badge" size={36} color={colors['on-primary-container']} />
          </View>
          <Text className="text-on-surface" style={{ fontFamily: 'Inter_800ExtraBold', fontSize: 32 }}>
            Epa
          </Text>
          <Text className="text-on-surface-variant text-center mt-1">
            El punto de encuentro de la UJAP
          </Text>
        </View>

        <Card className="mb-8">
          <Text className="text-on-surface mb-3" style={{ fontFamily: 'Inter_700Bold', fontSize: 18 }}>
            Verifica tu correo institucional
          </Text>
          <Input
            label="Nombre completo"
            placeholder="Alejandro Martínez"
            value={draft.name}
            onChangeText={(name) => setDraftField('name', name)}
          />
          <Input
            label="Correo UJAP"
            placeholder="tu.nombre@ujap.edu.ve"
            autoCapitalize="none"
            keyboardType="email-address"
            value={draft.email}
            onChangeText={(email) => setDraftField('email', email)}
          />
          <Input
            label="Contraseña"
            placeholder="Mínimo 8 caracteres"
            secureTextEntry
            value={draft.password}
            onChangeText={(password) => setDraftField('password', password)}
          />
          <View className="flex-row items-center">
            <MaterialIcons
              name={isEmailValid ? 'check-circle' : 'mail-outline'}
              size={16}
              color={isEmailValid ? '#22C55E' : colors['on-surface-variant']}
            />
            <Text className="text-on-surface-variant ml-2" style={{ fontSize: 12 }}>
              Solo estudiantes y profesores activos con correo @ujap.edu.ve
            </Text>
          </View>
        </Card>

        <Text className="text-on-surface mb-3" style={{ fontFamily: 'Inter_700Bold', fontSize: 18 }}>
          Tu perfil académico
        </Text>

        <Text className="text-on-surface-variant mb-2" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>
          FACULTAD
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {faculties.map((faculty) => (
            <Chip
              key={faculty}
              label={faculty}
              selected={draft.faculty === faculty}
              onPress={() => setDraftField('faculty', faculty)}
            />
          ))}
        </View>

        <Input
          label="Carrera"
          placeholder="Ingeniería en Computación"
          value={draft.career ?? ''}
          onChangeText={(career) => setDraftField('career', career)}
        />

        <Text className="text-on-surface-variant mb-2" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>
          SEMESTRE
        </Text>
        <View className="flex-row gap-2 mb-8">
          {semesterOptions.map((semester) => (
            <Pressable
              key={semester}
              onPress={() => setDraftField('semester', semester)}
              className={`flex-1 items-center justify-center rounded-full py-3 ${
                draft.semester === semester ? 'bg-primary' : 'bg-surface-container'
              }`}
            >
              <Text
                className={draft.semester === semester ? 'text-on-primary' : 'text-on-surface-variant'}
                style={{ fontFamily: 'Inter_700Bold', fontSize: 14 }}
              >
                {semester === 5 ? '5+' : semester}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text className="text-on-surface mb-3" style={{ fontFamily: 'Inter_700Bold', fontSize: 18 }}>
          Cuéntanos sobre ti
        </Text>
        <Input
          label="Bio corta"
          placeholder="Armando planes de estudio y proyectos. Échame un epa."
          multiline
          numberOfLines={3}
          value={draft.bio}
          onChangeText={(bio) => setDraftField('bio', bio)}
          style={{ minHeight: 80, textAlignVertical: 'top' }}
        />

        <Text className="text-on-surface mb-3 mt-4" style={{ fontFamily: 'Inter_700Bold', fontSize: 18 }}>
          Tus intereses
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-8">
          {interests.map((interest) => (
            <Chip
              key={interest.id}
              label={interest.label}
              selected={draft.interestIds.includes(interest.id)}
              onPress={() => toggleInterest(interest.id)}
            />
          ))}
        </View>

        <Text className="text-on-surface mb-3" style={{ fontFamily: 'Inter_700Bold', fontSize: 18 }}>
          ¿Qué buscas en Epa?
        </Text>
        <View className="flex-row flex-wrap justify-between gap-y-3 mb-10">
          {lookingForOptions.map((option) => (
            <LookingForCard
              key={option.value}
              label={option.label}
              icon={option.icon}
              selected={draft.lookingFor.includes(option.value)}
              onPress={() => toggleLookingFor(option.value)}
            />
          ))}
        </View>

        <Button
          label={submitting ? 'Creando tu cuenta...' : 'Entrar a Epa'}
          onPress={handleSubmit}
          disabled={!isFormComplete || submitting}
          loading={submitting}
        />

        <Text
          className="text-primary text-center mt-6"
          style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14 }}
          onPress={() => router.push('/login')}
        >
          ¿Ya tienes cuenta? Inicia sesión
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
