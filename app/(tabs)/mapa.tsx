import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { MapCanvas } from '@/src/components/mapa/MapCanvas';
import { PlanDetailCard } from '@/src/components/mapa/PlanDetailCard';
import { Avatar } from '@/src/components/ui';
import { useAuthStore, usePlansStore } from '@/src/store';
import { colors, epaGradient, radii } from '@/src/theme/tokens';

export default function MapaScreen() {
  const router = useRouter();
  const plans = usePlansStore((state) => state.plans);
  const fetchPlans = usePlansStore((state) => state.fetchPlans);
  const currentUser = useAuthStore((state) => state.currentUser);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId);

  return (
    <View className="flex-1 bg-surface">
      <MapCanvas plans={plans} selectedPlanId={selectedPlanId} onSelectPlan={setSelectedPlanId} />

      <SafeAreaView edges={['top']} className="absolute top-0 left-0 right-0">
        <View className="flex-row items-center px-margin-mobile py-3">
          <Avatar uri={currentUser?.photoUrl} size={36} />
          <Text
            className="text-on-surface ml-2 flex-1"
            style={{ fontFamily: 'Inter_800ExtraBold', fontSize: 20 }}
          >
            Epa
          </Text>
          <Pressable
            className="bg-surface-container-lowest items-center justify-center rounded-full"
            style={{ width: 40, height: 40 }}
            onPress={() => Alert.alert('Epas nuevos', 'No tienes epas nuevos por ahora.')}
          >
            <MaterialIcons name="notifications" size={20} color={colors['on-surface']} />
          </Pressable>
        </View>
      </SafeAreaView>

      {selectedPlan && <PlanDetailCard plan={selectedPlan} onClose={() => setSelectedPlanId(null)} />}

      {!selectedPlan && (
        <Pressable className="absolute right-5 bottom-28" onPress={() => router.push('/plan/new')}>
          <LinearGradient
            colors={epaGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 56,
              height: 56,
              borderRadius: radii.full,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialIcons name="add" size={28} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>
      )}
    </View>
  );
}
