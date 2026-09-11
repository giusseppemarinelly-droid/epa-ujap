import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { MapCanvas } from '@/src/components/mapa/MapCanvas';
import { PlanDetailCard } from '@/src/components/mapa/PlanDetailCard';
import { Avatar, Button, Card } from '@/src/components/ui';
import {
  useAuthStore,
  useConnectionsStore,
  useConversationsStore,
  useMapPeopleStore,
  usePlansStore,
} from '@/src/store';
import { colors, elevation, getEpaGradient, radii } from '@/src/theme/tokens';

// Cadencia del mapa de personas: un minuto es suficiente para que la gente se
// vea moverse por el campus sin castigar la batería ni el plan de datos.
const PEOPLE_REFRESH_MS = 60_000;

export default function MapaScreen() {
  const router = useRouter();
  const plans = usePlansStore((state) => state.plans);
  const fetchPlans = usePlansStore((state) => state.fetchPlans);
  const currentUser = useAuthStore((state) => state.currentUser);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [openingChat, setOpeningChat] = useState(false);

  const people = useMapPeopleStore((state) => state.people);
  const sharing = useMapPeopleStore((state) => state.sharing);
  const fetchPeople = useMapPeopleStore((state) => state.fetchPeople);
  const pushMyLocation = useMapPeopleStore((state) => state.pushMyLocation);
  const setSharing = useMapPeopleStore((state) => state.setSharing);
  const hydrateSharing = useMapPeopleStore((state) => state.hydrateSharing);

  const startDirectConversation = useConversationsStore((state) => state.startDirectConversation);
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

  // El interruptor arranca con lo que ya dice el perfil, para que no aparezca
  // apagado un segundo cuando en realidad estás compartiendo.
  useEffect(() => {
    hydrateSharing(currentUser?.shareLocation ?? false);
  }, [currentUser?.shareLocation, hydrateSharing]);

  useEffect(() => {
    fetchPeople();
    pushMyLocation();
    const interval = setInterval(() => {
      fetchPeople();
      // pushMyLocation no hace nada si el interruptor está apagado, así que
      // el mismo intervalo sirve para los dos casos.
      pushMyLocation();
    }, PEOPLE_REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchPeople, pushMyLocation]);

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
  const selectedPerson = people.find((person) => person.id === selectedPersonId);

  function handleSelectPlan(id: string) {
    setSelectedPersonId(null);
    setSelectedPlanId(id);
  }

  function handleSelectPerson(id: string) {
    setSelectedPlanId(null);
    setSelectedPersonId(id);
  }

  async function handleOpenChat() {
    if (!selectedPerson || !currentUser?.id || openingChat) return;
    setOpeningChat(true);
    try {
      const conversation = await startDirectConversation(selectedPerson.id, currentUser.id);
      setSelectedPersonId(null);
      router.push(`/chat/${conversation.id}`);
    } catch (err) {
      Alert.alert('No se pudo abrir el chat', err instanceof Error ? err.message : undefined);
    } finally {
      setOpeningChat(false);
    }
  }

  const detailVisible = !!selectedPlan || !!selectedPerson;

  return (
    <View className="flex-1 bg-surface">
      <MapCanvas
        plans={plans}
        people={people}
        selectedPlanId={selectedPlanId}
        onSelectPlan={handleSelectPlan}
        onSelectPerson={handleSelectPerson}
      />

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

      {selectedPerson && (
        <Card className="absolute left-5 right-5 bottom-28">
          <View className="flex-row items-center">
            <Avatar uri={selectedPerson.photoUrl} size={48} />
            <View className="ml-3 flex-1">
              <Text className="text-on-surface" style={{ fontFamily: 'Inter_700Bold', fontSize: 16 }}>
                {selectedPerson.name}
              </Text>
              <Text className="text-on-surface-variant mt-1" style={{ fontSize: 12 }}>
                {selectedPerson.career || 'Comunidad UJAP'}
              </Text>
            </View>
            <Pressable onPress={() => setSelectedPersonId(null)} className="p-1">
              <MaterialIcons name="close" size={20} color={colors['on-surface-variant']} />
            </Pressable>
          </View>

          <View className="mt-4">
            <Button label="Échale un epa" onPress={handleOpenChat} disabled={openingChat} />
          </View>
        </Card>
      )}

      {/* Modo fantasma: un toque para aparecer o desaparecer del mapa. Se
          esconde mientras hay una tarjeta abierta porque ocupan el mismo sitio. */}
      {!detailVisible && (
        <Pressable
          className="absolute left-5 bottom-28 items-center"
          onPress={() => setSharing(!sharing)}
        >
          <View
            className="items-center justify-center rounded-full"
            style={[
              {
                width: 56,
                height: 56,
                backgroundColor: sharing ? colors.primary : colors['surface-container-lowest'],
                borderWidth: 2,
                borderColor: sharing ? colors.primary : colors['outline-variant'],
              },
              elevation.card,
            ]}
          >
            <MaterialIcons
              name={sharing ? 'my-location' : 'visibility-off'}
              size={24}
              color={sharing ? '#FFFFFF' : colors['on-surface-variant']}
            />
          </View>
          <View
            className="bg-surface-container-lowest rounded-full px-2 py-1 mt-1"
            style={elevation.card}
          >
            <Text
              className="text-on-surface"
              style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10 }}
            >
              {sharing ? 'Visible' : 'Invisible'}
            </Text>
          </View>
        </Pressable>
      )}

      {!detailVisible && (
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
