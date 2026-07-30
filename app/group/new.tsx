import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { Button, Chip, Input } from '@/src/components/ui';
import { useGroupsStore } from '@/src/store';
import { colors } from '@/src/theme/tokens';
import type { GroupCategory } from '@/src/types';

const categories: GroupCategory[] = ['Académico', 'Deportes', 'Tecnología', 'Creatividad', 'Arte'];

export default function NewGroupScreen() {
  const router = useRouter();
  const createGroup = useGroupsStore((state) => state.createGroup);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<GroupCategory>('Académico');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isValid = name.trim().length > 2 && description.trim().length > 0;

  async function handleSubmit() {
    if (!isValid || submitting) return;
    setSubmitting(true);
    try {
      await createGroup({ name: name.trim(), category, description: description.trim() });
      router.back();
    } catch (err) {
      Alert.alert('No se pudo crear el grupo', err instanceof Error ? err.message : undefined);
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
            Crear grupo
          </Text>
        </View>

        <Input label="Nombre del grupo" placeholder="Club de Ajedrez" value={name} onChangeText={setName} />

        <Text
          className="text-on-surface-variant mb-2"
          style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12 }}
        >
          CATEGORÍA
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {categories.map((option) => (
            <Chip key={option} label={option} selected={category === option} onPress={() => setCategory(option)} />
          ))}
        </View>

        <Input
          label="Descripción"
          placeholder="¿De qué se trata este grupo?"
          multiline
          numberOfLines={3}
          value={description}
          onChangeText={setDescription}
          style={{ minHeight: 80, textAlignVertical: 'top' }}
        />

        <Button
          label={submitting ? 'Creando...' : 'Crear grupo'}
          onPress={handleSubmit}
          disabled={!isValid || submitting}
          loading={submitting}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
