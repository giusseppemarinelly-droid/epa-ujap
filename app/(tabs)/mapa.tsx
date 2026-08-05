import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { MapCanvas } from '@/src/components/mapa/MapCanvas';
import { PlanDetailCard } from '@/src/components/mapa/PlanDetailCard';
import { Avatar } from '@/src/components/ui';
import { useAuthStore, useConnectionsStore, useConversationsStore, usePlansStore } from '@/src/store';
import { colors, elevation, getEpaGradient, radii } from '@/src/theme/tokens';

export default function MapaScreen() {
  const router = useRouter();
  const plans = usePlansStore((state) => state.plans);
  const fetchPlans = usePlansStore((state) => state.fetchPlans);
  const currentUser = useAuthStore((state) => state.currentUser);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const incomingCount = useConnectionsStore((state) => state.incoming.length);
  const fetchConnections = useConnectionsStore((state) => state.fetchAll);
  const unreadCount = useConversationsStore((state) =>
    state.conversations.reduce((total, conversation) => total + (conversation.unreadCount > 0 ? 1 : 0), 0)
  );
  const fetchConversations = useConversationsStore((state) => state.fetchConversations);
  const notificationCount = incomingCount + unreadCount;

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    fetchConnections();
    const interval = setInterval(fetchConnections, 8000);
    return () => clearInterval(interval);
  }, [fetchConnections]);

  useEffect(() => {
    if (!currentUser?.id) return;
    fetchConversations(currentUser.id);
    const interval = setInterval(() => fetchConversations(currentUser.id!), 8000);
    return () => clearInterval(interval);
  }, [currentUser?.id, fetchConversations]);

  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId);

  return (
    <View className="flex-1 bg-surface">
      <MapCanvas plans={plans} selectedPlanId={selectedPlanId} onSelectPlan={setSelectedPlanId} />

      <SafeAreaView edges={['top']} className="absolute top-0 left-0 right-0 px-margin-mobile pt-2">
        <View
          className="flex-row items-center bg-surface-container-lowest rounded-full px-3 py-2"
          style={elevation.card}
        >
          <Avatar uri={currentUser?.photoUrl} size={36} />
          <Text
            className="text-on-surface ml-2 flex-1"
            style={{ fontFamily: 'Inter_800ExtraBold', fontSize: 20 }}
          >
            Epa
          </Text>
          <Pressable
            className="bg-surface-container items-center justify-center rounded-full"
            style={{ width: 40, height: 40 }}
            onPress={() => router.push('/notificaciones')}
          >
            <MaterialIcons name="notifications" size={20} color={colors['on-surface']} />
            {notificationCount > 0 && (
              <View
                className="absolute rounded-full items-center justify-center bg-primary"
                style={{ top: -2, right: -2, minWidth: 16, height: 16, paddingHorizontal: 3 }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 10, fontFamily: 'Inter_700Bold' }}>
                  {notificationCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </SafeAreaView>

      {selectedPlan && <PlanDetailCard plan={selectedPlan} onClose={() => setSelectedPlanId(null)} />}

      {!selectedPlan && (
        <Pressable className="absolute right-5 bottom-28" onPress={() => router.push('/plan/new')}>
          <LinearGradient
            colors={getEpaGradient()}
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
