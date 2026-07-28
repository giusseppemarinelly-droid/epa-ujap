import { Pressable, ScrollView, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { colors } from '@/src/theme/tokens';
import type { Plan } from '@/src/types';

type MapCanvasProps = {
  plans: Plan[];
  selectedPlanId: string | null;
  onSelectPlan: (id: string) => void;
};

// react-native-maps no tiene implementación web. Aquí se muestra la lista de
// planes en su lugar; el mapa interactivo completo vive en la app móvil.
export function MapCanvas({ plans, selectedPlanId, onSelectPlan }: MapCanvasProps) {
  return (
    <ScrollView className="flex-1 bg-surface-container px-margin-mobile" contentContainerStyle={{ paddingTop: 96, paddingBottom: 120 }}>
      <View className="flex-row items-center mb-4">
        <MaterialIcons name="phone-iphone" size={16} color={colors['on-surface-variant']} />
        <Text className="text-on-surface-variant ml-2 flex-1" style={{ fontSize: 12 }}>
          El mapa interactivo está disponible en la app móvil. Aquí tienes la lista de planes.
        </Text>
      </View>
      {plans.map((plan) => (
        <Pressable
          key={plan.id}
          onPress={() => onSelectPlan(plan.id)}
          className="bg-surface-container-lowest rounded-md p-4 mb-3"
          style={{ borderWidth: 2, borderColor: plan.id === selectedPlanId ? colors.primary : 'transparent' }}
        >
          <Text className="text-on-surface" style={{ fontFamily: 'Inter_700Bold', fontSize: 16 }}>
            {plan.title}
          </Text>
          <Text className="text-on-surface-variant mt-1" style={{ fontSize: 13 }}>
            {plan.location.address}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
