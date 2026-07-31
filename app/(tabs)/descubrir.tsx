import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { ActionButtons } from '@/src/components/descubrir/ActionButtons';
import { DiscoverCard } from '@/src/components/descubrir/DiscoverCard';
import { FiltersSheet, type DiscoverFilters } from '@/src/components/descubrir/FiltersSheet';
import { SwipeableCard } from '@/src/components/descubrir/SwipeableCard';
import { Avatar, EmptyState } from '@/src/components/ui';
import { useAuthStore, useDiscoverStore } from '@/src/store';
import { colors } from '@/src/theme/tokens';

export default function DescubrirScreen() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const interests = useAuthStore((state) => state.interests);
  const usersById = useDiscoverStore((state) => state.usersById);
  const queue = useDiscoverStore((state) => state.queue);
  const history = useDiscoverStore((state) => state.history);
  const fetchCandidates = useDiscoverStore((state) => state.fetchCandidates);
  const descartar = useDiscoverStore((state) => state.descartar);
  const conectar = useDiscoverStore((state) => state.conectar);

  const [filtersVisible, setFiltersVisible] = useState(false);
  const [filters, setFilters] = useState<DiscoverFilters>({ career: '', interestIds: [] });

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const visibleQueue = useMemo(() => {
    const career = filters.career.trim().toLowerCase();
    return queue
      .map((id) => usersById[id])
      .filter((user): user is NonNullable<typeof user> => !!user)
      .filter((user) => (filters.faculty ? user.faculty === filters.faculty : true))
      .filter((user) => (filters.semester ? user.semester === filters.semester : true))
      .filter((user) => (career ? user.career.toLowerCase().includes(career) : true))
      .filter((user) =>
        filters.interestIds.length > 0
          ? filters.interestIds.some((id) => user.interestIds.includes(id))
          : true
      );
  }, [queue, usersById, filters]);

  const currentCandidate = visibleQueue[0];

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <View className="flex-row items-center px-margin-mobile py-3">
        <Avatar uri={currentUser?.photoUrl} size={36} />
        <Text
          className="text-on-surface ml-2 flex-1"
          style={{ fontFamily: 'Inter_800ExtraBold', fontSize: 20 }}
        >
          Epa
        </Text>
        <Pressable
          onPress={() => setFiltersVisible(true)}
          className="flex-row items-center rounded-full bg-surface-container px-3 py-2"
        >
          <MaterialIcons name="tune" size={16} color={colors['on-surface']} />
          <Text className="text-on-surface ml-1" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>
            Filtros
          </Text>
        </Pressable>
      </View>

      <View className="flex-1 px-margin-mobile pb-3">
        {currentCandidate && currentUser ? (
          <SwipeableCard
            key={currentCandidate.id}
            onSwipeLeft={() => descartar(currentCandidate.id)}
            onSwipeRight={() => conectar(currentCandidate.id)}
          >
            <DiscoverCard user={currentCandidate} currentUser={currentUser} />
          </SwipeableCard>
        ) : (
          <View className="flex-1 items-center justify-center">
            <EmptyState
              icon="groups"
              title="Epa, ya viste a todos por ahora"
              description="Vuelve más tarde por caras nuevas."
            />
          </View>
        )}
      </View>

      <View className="pb-20">
        {currentCandidate && <ActionButtons userId={currentCandidate.id} canUndo={history.length > 0} />}
      </View>

      <FiltersSheet
        visible={filtersVisible}
        filters={filters}
        interests={interests}
        onChange={setFilters}
        onClose={() => setFiltersVisible(false)}
      />
    </SafeAreaView>
  );
}
