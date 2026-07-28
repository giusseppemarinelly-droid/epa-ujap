import { View } from 'react-native';
import { Marker } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';

import { elevation } from '@/src/theme/tokens';
import type { Plan } from '@/src/types';

const CATEGORY_ICON: Record<Plan['category'], keyof typeof MaterialIcons.glyphMap> = {
  deportes: 'sports-soccer',
  estudio: 'school',
  comida: 'restaurant',
  proyectos: 'rocket-launch',
  cultura: 'celebration',
};

type PlanMarkerProps = {
  plan: Plan;
  selected: boolean;
  onPress: () => void;
};

export function PlanMarker({ plan, selected, onPress }: PlanMarkerProps) {
  const size = selected ? 48 : 40;

  return (
    <Marker
      coordinate={{ latitude: plan.location.lat, longitude: plan.location.lng }}
      onPress={onPress}
    >
      <View
        className="items-center justify-center rounded-full bg-primary"
        style={[{ width: size, height: size, borderWidth: 3, borderColor: '#FFFFFF' }, elevation.floating]}
      >
        <MaterialIcons name={CATEGORY_ICON[plan.category]} size={selected ? 22 : 18} color="#FFFFFF" />
      </View>
    </Marker>
  );
}
