import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { ActionButtons } from '@/src/components/descubrir/ActionButtons';
import { DiscoverCard } from '@/src/components/descubrir/DiscoverCard';
import { FiltersSheet, type DiscoverFilters } from '@/src/components/descubrir/FiltersSheet';
import { SwipeableCard } from '@/src/components/descubrir/SwipeableCard';
import { Avatar, Button, EmptyState } from '@/src/components/ui';
import { useAuthStore, useDiscoverStore } from '@/src/store';
import { colors } from '@/src/theme/tokens';

const emptyFilters: DiscoverFilters = { career: '', interestIds: [] };

export default function DescubrirScreen() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const interests = useAuthStore((state) => state.interests);
  const usersById = useDiscoverStore((state) => state.usersById);
  const queue = useDiscoverStore((state) => state.queue);
  const loading = useDiscoverStore((state) => state.loading);
  const history = useDiscoverStore((state) => state.history);
  const fetchCandidates = useDiscoverStore((state) => state.fetchCandidates);
  const descartar = useDiscoverStore((state) => state.descartar);
  const conectar = useDiscoverStore((state) => state.conectar);

  const [filtersVisible, setFiltersVisible] = useState(false);
  const [filters, setFilters] = useState<DiscoverFilters>(emptyFilters);

  const hasActiveFilters =
    !!filters.faculty ||
    !!filters.semester ||
    filters.career.trim().length > 0 ||
    filters.interestIds.length > 0;

  const clearFilters = useCallback(() => setFilters(emptyFilters), []);

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

  // El estado vacío tiene que decir la verdad sobre por qué no hay nadie: no
  // es lo mismo que el backend ya no tenga a quién proponerte (todos los
  // demás ya son contactos o tienen solicitud) a que tú mismo te hayas
  // escondido a la gente con los filtros. Son dos salidas distintas.
  function renderEmptyState() {
    if (loading) {
      return <ActivityIndicator color={colors.primary} />;
    }

    if (queue.length > 0 && hasActiveFilters) {
      return (
        <View className="items-center">
          <EmptyState
            icon="filter-alt-off"
            title="Nadie encaja con esos filtros"
            description="Hay estudiantes por conocer, pero ninguno cumple lo que pediste. Afloja un poco los filtros."
          />
          <View className="mt-5">
            <Button label="Limpiar filtros" variant="ghost" fullWidth={false} onPress={clearFilters} />
          </View>
        </View>
      );
    }

    return (
      <EmptyState
        icon="groups"
        title="Ya le escribiste a todo el mundo"
        description="No queda nadie nuevo por ahora. Vuelve más tarde, siempre se están registrando estudiantes."
      />
    );
  }

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
          {/* Punto de aviso: si la pila se ve vacía por culpa de un filtro
              puesto hace rato, conviene que se note desde el header. */}
          {hasActiveFilters && (
            <View
              className="ml-1 rounded-full"
              style={{ width: 6, height: 6, backgroundColor: colors.primary }}
            />
          )}
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
          <View className="flex-1 items-center justify-center">{renderEmptyState()}</View>
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
