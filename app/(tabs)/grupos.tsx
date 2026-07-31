import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { FeaturedGroupBanner } from '@/src/components/grupos/FeaturedGroupBanner';
import { GroupCard } from '@/src/components/grupos/GroupCard';
import { Button, Card, Chip } from '@/src/components/ui';
import { useAuthStore, useGroupsStore } from '@/src/store';
import { colors } from '@/src/theme/tokens';
import type { GroupCategory } from '@/src/types';

const categories: GroupCategory[] = ['Académico', 'Deportes', 'Tecnología', 'Creatividad', 'Arte'];

export default function GruposScreen() {
  const router = useRouter();
  const groups = useGroupsStore((state) => state.groups);
  const fetchGroups = useGroupsStore((state) => state.fetchGroups);
  const joinGroup = useGroupsStore((state) => state.joinGroup);
  const leaveGroup = useGroupsStore((state) => state.leaveGroup);
  const currentUserId = useAuthStore((state) => state.currentUser?.id);

  const [activeCategory, setActiveCategory] = useState<GroupCategory | 'Todos'>('Todos');

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const featuredGroup = groups.find((group) => group.featured);
  const otherGroups = useMemo(
    () =>
      groups
        .filter((group) => !group.featured)
        .filter((group) => (activeCategory === 'Todos' ? true : group.category === activeCategory)),
    [groups, activeCategory]
  );

  function isMember(group: { memberIds: string[] }) {
    return !!currentUserId && group.memberIds.includes(currentUserId);
  }

  function toggleMembership(groupId: string, memberAlready: boolean) {
    if (memberAlready) {
      leaveGroup(groupId);
    } else {
      joinGroup(groupId);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}>
        <View className="flex-row items-center py-3">
          <Text className="text-on-surface flex-1" style={{ fontFamily: 'Inter_800ExtraBold', fontSize: 20 }}>
            Epa
          </Text>
          <MaterialIcons name="notifications" size={20} color={colors['on-surface']} />
        </View>

        <Text className="text-on-surface mt-2" style={{ fontFamily: 'Inter_800ExtraBold', fontSize: 24 }}>
          Grupos y actividades
        </Text>
        <Text className="text-on-surface-variant mt-1 mb-5">
          Únete a comunidades con tus mismos intereses.
        </Text>

        {featuredGroup && (
          <FeaturedGroupBanner
            group={featuredGroup}
            isMember={isMember(featuredGroup)}
            onPress={() => router.push(`/group/${featuredGroup.id}`)}
            onToggleMembership={() => toggleMembership(featuredGroup.id, isMember(featuredGroup))}
          />
        )}

        <View className="flex-row flex-wrap gap-2 mb-5">
          <Chip label="Todos" selected={activeCategory === 'Todos'} onPress={() => setActiveCategory('Todos')} />
          {categories.map((category) => (
            <Chip
              key={category}
              label={category}
              selected={activeCategory === category}
              onPress={() => setActiveCategory(category)}
            />
          ))}
        </View>

        {otherGroups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            isMember={isMember(group)}
            onPress={() => router.push(`/group/${group.id}`)}
            onToggleMembership={() => toggleMembership(group.id, isMember(group))}
          />
        ))}

        <Card className="items-center mt-4">
          <View
            className="items-center justify-center rounded-full mb-1"
            style={{ width: 56, height: 56, backgroundColor: colors['primary-container'] }}
          >
            <MaterialIcons name="groups" size={26} color={colors.primary} />
          </View>
          <Text className="text-on-surface text-center mt-2" style={{ fontFamily: 'Inter_700Bold', fontSize: 16 }}>
            ¿No encuentras tu grupo?
          </Text>
          <Text className="text-on-surface-variant text-center mt-1 mb-4">
            Crea tu propio grupo de interés e invita a más gente de la UJAP.
          </Text>
          <Button label="Crear grupo" variant="ghost" onPress={() => router.push('/group/new')} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
