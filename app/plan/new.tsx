import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { Button, Chip, Input } from '@/src/components/ui';
import { usePlansStore } from '@/src/store';
import { colors } from '@/src/theme/tokens';
import type { PlanCategory } from '@/src/types';

const categories: { value: PlanCategory; label: string }[] = [
  { value: 'deportes', label: 'Deportes' },
  { value: 'estudio', label: 'Estudio' },
  { value: 'comida', label: 'Comida' },
  { value: 'proyectos', label: 'Proyectos' },
  { value: 'cultura', label: 'Cultura' },
];

const capacityOptions = [4, 6, 8, 10, 15, 20];

const UJAP_CENTER = { lat: 10.2167, lng: -68.0092 };

function nextAt(hour: number, addDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + addDays);
  date.setHours(hour, 0, 0, 0);
  if (date.getTime() < Date.now()) date.setDate(date.getDate() + 1);
  return date;
}

function nextSaturday() {
  const date = new Date();
  const daysUntilSaturday = (6 - date.getDay() + 7) % 7 || 7;
  date.setDate(date.getDate() + daysUntilSaturday);
  date.setHours(15, 0, 0, 0);
  return date;
}

const timePresets = [
  { label: 'En 1 hora', getValue: () => new Date(Date.now() + 60 * 60 * 1000) },
  { label: 'Esta tarde (5pm)', getValue: () => nextAt(17) },
  { label: 'Mañana 10am', getValue: () => nextAt(10, 1) },
  { label: 'Este fin de semana', getValue: () => nextSaturday() },
];

export default function NewPlanScreen() {
  const router = useRouter();
  const createPlan = usePlansStore((state) => state.createPlan);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PlanCategory>('estudio');
  const [address, setAddress] = useState('');
  const [capacity, setCapacity] = useState(8);
  const [dateTime, setDateTime] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isValid = title.trim().length > 2 && address.trim().length > 0 && !!dateTime;

  async function handleSubmit() {
    if (!isValid || !dateTime || submitting) return;
    setSubmitting(true);
    try {
      const jitter = () => (Math.random() - 0.5) * 0.004;
      await createPlan({
        title: title.trim(),
        description: description.trim() || 'Sin descripción adicional.',
        category,
        latitude: UJAP_CENTER.lat + jitter(),
        longitude: UJAP_CENTER.lng + jitter(),
        address: address.trim(),
        dateTime: dateTime.toISOString(),
        capacity,
      });
      router.back();
    } catch (err) {
      Alert.alert('No se pudo armar el plan', err instanceof Error ? err.message : undefined);
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
            Armar plan
          </Text>
        </View>

        <Input label="Título" placeholder="Estudio de Cálculo II" value={title} onChangeText={setTitle} />

        <Text
          className="text-on-surface-variant mb-2"
          style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12 }}
        >
          CATEGORÍA
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {categories.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={category === option.value}
              onPress={() => setCategory(option.value)}
            />
          ))}
        </View>

        <Input
          label="Lugar"
          placeholder="Biblioteca, cafetería, cancha..."
          value={address}
          onChangeText={setAddress}
        />

        <Text
          className="text-on-surface-variant mb-2"
          style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12 }}
        >
          ¿CUÁNDO?
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {timePresets.map((preset) => {
            const value = preset.getValue();
            const selected = dateTime?.getTime() === value.getTime();
            return (
              <Chip
                key={preset.label}
                label={preset.label}
                selected={selected}
                onPress={() => setDateTime(value)}
              />
            );
          })}
        </View>

        <Text
          className="text-on-surface-variant mb-2"
          style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12 }}
        >
          CUPO
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {capacityOptions.map((value) => (
            <Chip
              key={value}
              label={`${value} personas`}
              selected={capacity === value}
              onPress={() => setCapacity(value)}
            />
          ))}
        </View>

        <Input
          label="Descripción (opcional)"
          placeholder="¿Qué se va a hacer en este plan?"
          multiline
          numberOfLines={3}
          value={description}
          onChangeText={setDescription}
          style={{ minHeight: 80, textAlignVertical: 'top' }}
        />

        <Button
          label={submitting ? 'Armando...' : 'Armar plan'}
          onPress={handleSubmit}
          disabled={!isValid || submitting}
          loading={submitting}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
