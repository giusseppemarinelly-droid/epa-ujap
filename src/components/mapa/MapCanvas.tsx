import MapView from 'react-native-maps';

import type { Plan } from '@/src/types';
import { PlanMarker } from './PlanMarker';

const UJAP_REGION = {
  latitude: 10.2167,
  longitude: -68.0092,
  latitudeDelta: 0.012,
  longitudeDelta: 0.012,
};

type MapCanvasProps = {
  plans: Plan[];
  selectedPlanId: string | null;
  onSelectPlan: (id: string) => void;
};

export function MapCanvas({ plans, selectedPlanId, onSelectPlan }: MapCanvasProps) {
  return (
    <MapView style={{ flex: 1 }} initialRegion={UJAP_REGION}>
      {plans.map((plan) => (
        <PlanMarker
          key={plan.id}
          plan={plan}
          selected={plan.id === selectedPlanId}
          onPress={() => onSelectPlan(plan.id)}
        />
      ))}
    </MapView>
  );
}
