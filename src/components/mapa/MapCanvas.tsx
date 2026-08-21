import MapView from 'react-native-maps';

import type { MapPerson, Plan } from '@/src/types';
import { PersonMarker } from './PersonMarker';
import { PlanMarker } from './PlanMarker';

const UJAP_REGION = {
  latitude: 10.2167,
  longitude: -68.0092,
  latitudeDelta: 0.012,
  longitudeDelta: 0.012,
};

type MapCanvasProps = {
  plans: Plan[];
  people: MapPerson[];
  selectedPlanId: string | null;
  onSelectPlan: (id: string) => void;
  onSelectPerson: (id: string) => void;
};

export function MapCanvas({
  plans,
  people,
  selectedPlanId,
  onSelectPlan,
  onSelectPerson,
}: MapCanvasProps) {
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
      {people.map((person) => (
        <PersonMarker key={person.id} person={person} onPress={() => onSelectPerson(person.id)} />
      ))}
    </MapView>
  );
}
