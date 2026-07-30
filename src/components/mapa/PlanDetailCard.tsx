import { Pressable, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { Avatar, Button, Card } from '@/src/components/ui';
import { useAuthStore, usePlansStore } from '@/src/store';
import { colors } from '@/src/theme/tokens';
import type { Plan } from '@/src/types';

type PlanDetailCardProps = {
  plan: Plan;
  onClose: () => void;
};

export function PlanDetailCard({ plan, onClose }: PlanDetailCardProps) {
  const joinPlan = usePlansStore((state) => state.joinPlan);
  const currentUser = useAuthStore((state) => state.currentUser);
  const attendees = plan.attendees ?? [];
  const alreadyJoined = !!currentUser && plan.attendeeIds.includes(currentUser.id);
  const time = new Date(plan.dateTime).toLocaleTimeString('es-VE', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <Card className="absolute left-5 right-5 bottom-28">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-2">
          {plan.status === 'en_curso' && (
            <View className="self-start rounded-full bg-primary-container px-2 py-1 mb-2">
              <Text className="text-on-primary-container" style={{ fontFamily: 'Inter_700Bold', fontSize: 10 }}>
                EN CURSO
              </Text>
            </View>
          )}
          <Text className="text-on-surface" style={{ fontFamily: 'Inter_700Bold', fontSize: 16 }}>
            {plan.title}
          </Text>
          <Text className="text-on-surface-variant mt-1" style={{ fontSize: 12 }}>
            {plan.location.address}
          </Text>
        </View>
        <Pressable onPress={onClose} className="p-1">
          <MaterialIcons name="close" size={20} color={colors['on-surface-variant']} />
        </Pressable>
      </View>

      <View className="flex-row items-center mt-3">
        <Avatar uri={plan.creator?.photoUrl} size={32} />
        <View className="ml-2 flex-1">
          <Text className="text-on-surface" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>
            {plan.creator?.name}
          </Text>
          <Text className="text-on-surface-variant" style={{ fontSize: 12 }}>
            Creador · {time}
          </Text>
        </View>
        <View className="flex-row">
          {attendees.slice(0, 3).map((attendee, index) => (
            <View key={attendee.id} style={{ marginLeft: index === 0 ? 0 : -10 }}>
              <Avatar uri={attendee.photoUrl} size={28} />
            </View>
          ))}
        </View>
        <Text className="text-primary ml-2" style={{ fontFamily: 'Inter_700Bold', fontSize: 12 }}>
          {plan.attendeeIds.length} van
        </Text>
      </View>

      <View className="mt-4">
        <Button
          label={alreadyJoined ? 'Ya estás dentro' : 'Me apunto'}
          onPress={() => joinPlan(plan.id)}
          disabled={alreadyJoined}
        />
      </View>
    </Card>
  );
}
