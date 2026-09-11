import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Avatar, Badge, Button, Card, ConfirmDialog } from '@/src/components/ui';
import { apiRequest } from '@/src/lib/api';
import { mapGroupFromBackend, type BackendGroup } from '@/src/lib/enumMappers';
import { useAuthStore, useGroupsStore } from '@/src/store';
import { colors, getEpaGradient, radii } from '@/src/theme/tokens';
import type { Group, GroupCategory } from '@/src/types';

const CATEGORY_ICON: Record<GroupCategory, keyof typeof MaterialIcons.glyphMap> = {
  Académico: 'school',
  Deportes: 'sports-soccer',
  Tecnología: 'smart-toy',
  Creatividad: 'palette',
  Arte: 'music-note',
};

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const currentUserId = useAuthStore((state) => state.currentUser?.id);
  const joinGroup = useGroupsStore((state) => state.joinGroup);
  const leaveGroup = useGroupsStore((state) => state.leaveGroup);

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmingLeave, setConfirmingLeave] = useState(false);

  useEffect(() => {
    if (!id) return;
    apiRequest<BackendGroup>(`/groups/${id}`)
      .then((raw) => setGroup(mapGroupFromBackend(raw)))
      .finally(() => setLoading(false));
  }, [id]);

  const isMember = !!currentUserId && !!group?.memberIds.includes(currentUserId);

  // Unirse es inmediato; salir es destructivo, así que primero pide
  // confirmación en vez de ejecutarse en el mismo toque que "Ya estás dentro".
  function handleToggleMembership() {
    if (!group || busy) return;
    if (isMember) {
      setConfirmingLeave(true);
      return;
    }
    void runToggle();
  }

  async function runToggle() {
    if (!group || busy) return;
    setBusy(true);
    try {
      if (isMember) {
        await leaveGroup(group.id);
      } else {
        await joinGroup(group.id);
      }
      const raw = await apiRequest<BackendGroup>(`/groups/${group.id}`);
      setGroup(mapGroupFromBackend(raw));
    } catch (err) {
      Alert.alert('No se pudo actualizar', err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  function confirmLeave() {
    setConfirmingLeave(false);
    void runToggle();
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center">
        <Text className="text-on-surface-variant">Cargando...</Text>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center">
        <Text className="text-on-surface-variant">No se encontró el grupo.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ height: 180 }}>
          {group.imageUrl ? (
            <Image source={{ uri: group.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <LinearGradient colors={getEpaGradient()} style={{ width: '100%', height: '100%' }}>
              <View className="flex-1 items-center justify-center">
                <MaterialIcons name={CATEGORY_ICON[group.category]} size={56} color="#FFFFFF" />
              </View>
            </LinearGradient>
          )}
          <Pressable
            onPress={() => router.back()}
            className="absolute top-3 left-4 items-center justify-center rounded-full"
            style={{ width: 36, height: 36, backgroundColor: 'rgba(0,0,0,0.3)' }}
          >
            <MaterialIcons name="arrow-back" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        <View className="px-margin-mobile mt-4">
          <Badge label={group.category} icon={CATEGORY_ICON[group.category]} tone="primary" />
          <Text className="text-on-surface mt-2" style={{ fontFamily: 'Inter_800ExtraBold', fontSize: 24 }}>
            {group.name}
          </Text>
          <Text className="text-on-surface-variant mt-1">{group.memberIds.length} miembros</Text>

          <Text className="text-on-surface mt-4" style={{ fontSize: 15, lineHeight: 22 }}>
            {group.description}
          </Text>

          <View className="mt-5 flex-row gap-3">
            <View className="flex-1">
              <Button
                label={isMember ? 'Ya estás dentro' : 'Me apunto'}
                onPress={handleToggleMembership}
                disabled={busy}
                loading={busy}
                variant={isMember ? 'ghost' : 'primary'}
              />
            </View>
          </View>

          {isMember && group.conversationId && (
            <Pressable
              onPress={() => router.push(`/chat/${group.conversationId}`)}
              className="flex-row items-center justify-center bg-surface-container rounded-full py-3 mt-3"
            >
              <MaterialIcons name="chat-bubble" size={18} color={colors.primary} />
              <Text className="text-primary ml-2" style={{ fontFamily: 'Inter_700Bold', fontSize: 14 }}>
                Ir al chat del grupo
              </Text>
            </Pressable>
          )}

          <Text className="text-on-surface mt-6 mb-3" style={{ fontFamily: 'Inter_700Bold', fontSize: 16 }}>
            Miembros
          </Text>
          {(group.members ?? []).map((member) => (
            <Card key={member.id} className="flex-row items-center mb-2" padded={false}>
              <View className="flex-row items-center p-3">
                <Avatar uri={member.photoUrl} size={40} online={member.online} />
                <Text className="text-on-surface ml-3" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>
                  {member.name}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={confirmingLeave}
        title="Salir del grupo"
        message={`¿Seguro que quieres salir de ${group.name}?`}
        confirmLabel="Salir"
        destructive
        onConfirm={confirmLeave}
        onCancel={() => setConfirmingLeave(false)}
      />
    </SafeAreaView>
  );
}
