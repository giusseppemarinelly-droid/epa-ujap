import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Input } from '@/src/components/ui';
import { useAuthStore } from '@/src/store';
import { colors } from '@/src/theme/tokens';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!email || !password || submitting) return;
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace('/(tabs)/mapa');
    } catch (err) {
      Alert.alert('No se pudo iniciar sesión', err instanceof Error ? err.message : undefined);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 justify-center px-margin-mobile">
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

        <Input
          label="Correo UJAP"
          placeholder="tu.nombre@ujap.edu.ve"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Input label="Contraseña" placeholder="Tu contraseña" secureTextEntry value={password} onChangeText={setPassword} />

        <Button
          label={submitting ? 'Entrando...' : 'Iniciar sesión'}
          onPress={handleSubmit}
          disabled={!email || !password || submitting}
          loading={submitting}
        />

        <Text
          className="text-primary text-center mt-6"
          style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14 }}
          onPress={() => router.push('/onboarding')}
        >
          ¿No tienes cuenta? Regístrate
        </Text>
      </View>
    </SafeAreaView>
  );
}
