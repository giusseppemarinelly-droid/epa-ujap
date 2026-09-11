import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Chip, Input } from '@/src/components/ui';
import { LookingForCard } from '@/src/components/onboarding/LookingForCard';
import { CAREERS_BY_FACULTY, FACULTIES, SEMESTER_OPTIONS } from '@/src/constants/academics';
import { showAlert, useAuthStore } from '@/src/store';
import { colors } from '@/src/theme/tokens';
import type { LookingFor } from '@/src/types';

const lookingForOptions: { value: LookingFor; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { value: 'deportes', label: 'Deportes', icon: 'sports-soccer' },
  { value: 'estudio', label: 'Estudio', icon: 'school' },
  { value: 'proyectos', label: 'Proyectos', icon: 'rocket-launch' },
  { value: 'amistades', label: 'Amistades', icon: 'handshake' },
  { value: 'eventos', label: 'Eventos', icon: 'celebration' },
];

// Temporal: hasta tener envío de correo institucional, la verificación pasa
// por Gmail. Debe coincidir con ALLOWED_EMAIL_DOMAIN en el backend.
const EMAIL_DOMAIN = '@gmail.com';
const CODE_LENGTH = 6;

export default function OnboardingScreen() {
  const router = useRouter();
  const draft = useAuthStore((state) => state.draft);
  const interests = useAuthStore((state) => state.interests);
  const awaitingVerification = useAuthStore((state) => state.awaitingVerification);
  const setDraftField = useAuthStore((state) => state.setDraftField);
  const toggleInterest = useAuthStore((state) => state.toggleInterest);
  const toggleLookingFor = useAuthStore((state) => state.toggleLookingFor);
  const startSignup = useAuthStore((state) => state.startSignup);
  const resendVerification = useAuthStore((state) => state.resendVerification);
  const confirmSignup = useAuthStore((state) => state.confirmSignup);
  const cancelSignup = useAuthStore((state) => state.cancelSignup);
  const loadInterests = useAuthStore((state) => state.loadInterests);

  const [submitting, setSubmitting] = useState(false);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  // Cambiar de facultad limpia la carrera: la que estaba elegida puede no
  // pertenecer a la nueva facultad.
  function handleSelectFaculty(faculty: (typeof FACULTIES)[number]) {
    setDraftField('faculty', faculty);
    setDraftField('career', '');
  }

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
      await startSignup();
    } catch (err) {
      showAlert('No se pudo crear la cuenta', err instanceof Error ? err.message : undefined);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmCode() {
    if (code.trim().length === 0 || verifying) return;
    setVerifying(true);
    try {
      await confirmSignup(code.trim());
      router.replace('/(tabs)/mapa');
    } catch (err) {
      showAlert('No se pudo verificar el código', err instanceof Error ? err.message : undefined);
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    if (resending) return;
    setResending(true);
    try {
      await resendVerification();
      showAlert('Código reenviado', `Revisa ${draft.email}.`);
    } catch (err) {
      showAlert('No se pudo reenviar', err instanceof Error ? err.message : undefined);
    } finally {
      setResending(false);
    }
  }

  if (awaitingVerification) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <View className="flex-1 justify-center px-margin-mobile">
          <View className="items-center mb-8">
            <View
              className="bg-primary-container items-center justify-center rounded-full mb-4"
              style={{ width: 72, height: 72 }}
            >
              <MaterialIcons name="mail-outline" size={36} color={colors['on-primary-container']} />
            </View>
            <Text className="text-on-surface text-center" style={{ fontFamily: 'Inter_700Bold', fontSize: 20 }}>
              Revisa tu correo
            </Text>
            <Text className="text-on-surface-variant text-center mt-2">
              Te mandamos un código de {CODE_LENGTH} dígitos a {draft.email}
            </Text>
          </View>

          <Input
            label="Código de verificación"
            placeholder="123456"
            keyboardType="number-pad"
            maxLength={CODE_LENGTH}
            value={code}
            onChangeText={setCode}
          />

          <Button
            label={verifying ? 'Verificando...' : 'Confirmar código'}
            onPress={handleConfirmCode}
            disabled={code.trim().length === 0 || verifying}
            loading={verifying}
          />

          <Text
            className="text-primary text-center mt-6"
            style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14 }}
            onPress={handleResend}
          >
            {resending ? 'Reenviando...' : 'Reenviar código'}
          </Text>
          <Text
            className="text-on-surface-variant text-center mt-3"
            style={{ fontSize: 13 }}
            onPress={cancelSignup}
          >
            Usar otro correo
          </Text>
        </View>
      </SafeAreaView>
    );
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
            Verifica tu correo
          </Text>
          <Input
            label="Nombre completo"
            placeholder="Alejandro Martínez"
            value={draft.name}
            onChangeText={(name) => setDraftField('name', name)}
          />
          <Input
            label="Correo"
            placeholder="tu.nombre@gmail.com"
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
              Por ahora, verificamos con tu correo de Gmail
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
          {FACULTIES.map((faculty) => (
            <Chip
              key={faculty}
              label={faculty}
              selected={draft.faculty === faculty}
              onPress={() => handleSelectFaculty(faculty)}
            />
          ))}
        </View>

        <Text className="text-on-surface-variant mb-2" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>
          CARRERA
        </Text>
        {draft.faculty ? (
          <View className="flex-row flex-wrap gap-2 mb-4">
            {CAREERS_BY_FACULTY[draft.faculty].map((career) => (
              <Chip
                key={career}
                label={career}
                selected={draft.career === career}
                onPress={() => setDraftField('career', career)}
              />
            ))}
          </View>
        ) : (
          <Text className="text-on-surface-variant mb-4" style={{ fontSize: 13 }}>
            Elige primero tu facultad.
          </Text>
        )}

        <Text className="text-on-surface-variant mb-2" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>
          SEMESTRE
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-8">
          {SEMESTER_OPTIONS.map((semester) => (
            <Chip
              key={semester}
              label={String(semester)}
              selected={draft.semester === semester}
              onPress={() => setDraftField('semester', semester)}
            />
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
          label={submitting ? 'Enviando código...' : 'Mandar código de verificación'}
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
