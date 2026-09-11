import { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { Avatar, Button } from '@/src/components/ui';
import { apiRequest } from '@/src/lib/api';
import { mapUserFromBackend, type BackendUser } from '@/src/lib/enumMappers';
import { showAlert, useAuthStore, useConversationsStore } from '@/src/store';
import { colors } from '@/src/theme/tokens';
import type { User } from '@/src/types';

export default function NewChatScreen() {
  const router = useRouter();
  const currentUserId = useAuthStore((state) => state.currentUser?.id);
  const startDirectConversation = useConversationsStore((state) => state.startDirectConversation);
  const createGroupConversation = useConversationsStore((state) => state.createGroupConversation);

  const [people, setPeople] = useState<User[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [groupTitle, setGroupTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiRequest<BackendUser[]>('/users')
      .then((raw) => setPeople(raw.map(mapUserFromBackend)))
      .catch(() => {
        showAlert('No se pudo cargar la lista', 'Revisa tu conexión e intenta de nuevo.');
      })
      .finally(() => setLoading(false));
  }, []);

  function toggle(userId: string) {
    setSelected((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  }

  async function handleStart() {
    if (selected.length === 0 || submitting || !currentUserId) return;
    setSubmitting(true);
    try {
      if (selected.length === 1) {
        const conversation = await startDirectConversation(selected[0], currentUserId);
        router.replace(`/chat/${conversation.id}`);
      } else {
        const title = groupTitle.trim() || 'Grupo nuevo';
        const conversation = await createGroupConversation(selected, title, currentUserId);
        router.replace(`/chat/${conversation.id}`);
      }
    } catch (err) {
      showAlert('No se pudo iniciar el chat', err instanceof Error ? err.message : undefined);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <View className="flex-row items-center px-margin-mobile py-3">
        <Pressable onPress={() => router.back()} accessibilityLabel="Volver" className="mr-2 p-1">
          <MaterialIcons name="arrow-back" size={22} color={colors['on-surface']} />
        </Pressable>
        <Text className="text-on-surface flex-1" style={{ fontFamily: 'Inter_700Bold', fontSize: 18 }}>
          Nuevo chat
        </Text>
      </View>

      <Text className="text-on-surface-variant px-margin-mobile mb-2" style={{ fontSize: 12 }}>
        Elige una persona para un chat directo, o varias para armar un chat grupal.
      </Text>

      {selected.length > 1 && (
        <View className="px-margin-mobile mb-3">
          <TextInput
            value={groupTitle}
            onChangeText={setGroupTitle}
            placeholder="Nombre del chat grupal"
            placeholderTextColor={colors['on-surface-variant']}
            className="bg-surface-container rounded-md px-4 py-3 text-on-surface"
            style={{ fontFamily: 'Inter_400Regular', fontSize: 14 }}
          />
        </View>
      )}

      <FlatList
        data={people}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        renderItem={({ item }) => {
          const isSelected = selected.includes(item.id);
          return (
            <Pressable
              onPress={() => toggle(item.id)}
              className="flex-row items-center bg-surface-container-lowest rounded-md p-3 mb-2"
              style={{ borderWidth: 2, borderColor: isSelected ? colors.primary : 'transparent' }}
            >
              <Avatar uri={item.photoUrl} size={44} online={item.online} />
              <View className="ml-3 flex-1">
                <Text className="text-on-surface" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>
                  {item.name}
                </Text>
                <Text className="text-on-surface-variant" style={{ fontSize: 12 }}>
                  {item.career}
                </Text>
              </View>
              {isSelected && <MaterialIcons name="check-circle" size={20} color={colors.primary} />}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          loading ? null : (
            <Text className="text-on-surface-variant text-center mt-10">No hay más personas por ahora.</Text>
          )
        }
      />

      <View className="px-margin-mobile pb-6">
        <Button
          label={selected.length > 1 ? 'Crear chat grupal' : 'Iniciar chat'}
          onPress={handleStart}
          disabled={selected.length === 0 || submitting}
          loading={submitting}
        />
      </View>
    </SafeAreaView>
  );
}
