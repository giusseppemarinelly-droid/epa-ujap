import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { FeaturedGroupBanner } from '@/src/components/grupos/FeaturedGroupBanner';
import { GroupCard } from '@/src/components/grupos/GroupCard';
import { Chip } from '@/src/components/ui';
import { useAuthStore, useGroupsStore } from '@/src/store';
import { colors, elevation, getEpaGradient, radii } from '@/src/theme/tokens';
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

        <LinearGradient
          colors={getEpaGradient()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[{ borderRadius: radii.lg, padding: 24, alignItems: 'center', marginTop: 16 }, elevation.card]}
        >
          <View
            className="items-center justify-center rounded-full mb-3"
            style={{ width: 56, height: 56, backgroundColor: 'rgba(255,255,255,0.25)' }}
          >
            <MaterialIcons name="groups" size={26} color="#FFFFFF" />
          </View>
          <Text className="text-white text-center" style={{ fontFamily: 'Inter_800ExtraBold', fontSize: 18 }}>
            ¿No encuentras tu grupo?
          </Text>
          <Text className="text-white/90 text-center mt-1 mb-4" style={{ fontSize: 13 }}>
            Crea tu propio grupo de interés e invita a más gente de la UJAP.
          </Text>
          <Pressable
            onPress={() => router.push('/group/new')}
            className="bg-white rounded-full px-6"
            style={({ pressed }) => [
              { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
              pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
            ]}
          >
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.primary }}>
              Crear grupo
            </Text>
          </Pressable>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
}
