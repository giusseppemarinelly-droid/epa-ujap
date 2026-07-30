import { View } from 'react-native';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import L from 'leaflet';

import { colors } from '@/src/theme/tokens';
import type { Plan } from '@/src/types';

const UJAP_CENTER: [number, number] = [10.2167, -68.0092];

function createMarkerIcon(selected: boolean) {
  const size = selected ? 40 : 30;
  return L.divIcon({
    className: 'epa-plan-marker',
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 9999px;
      background: ${colors.primary};
      border: 3px solid #ffffff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.35);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

type MapCanvasProps = {
  plans: Plan[];
  selectedPlanId: string | null;
  onSelectPlan: (id: string) => void;
};

// Mapa real e interactivo en web con Leaflet + OpenStreetMap (react-native-maps
// no tiene build para web). Gratis, sin API key, con calles, zoom y arrastre.
export function MapCanvas({ plans, selectedPlanId, onSelectPlan }: MapCanvasProps) {
  return (
    <View style={{ flex: 1 }}>
      <MapContainer
        center={UJAP_CENTER}
        zoom={16}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {plans.map((plan) => (
          <Marker
            key={plan.id}
            position={[plan.location.lat, plan.location.lng]}
            icon={createMarkerIcon(plan.id === selectedPlanId)}
            eventHandlers={{ click: () => onSelectPlan(plan.id) }}
          />
        ))}
      </MapContainer>
    </View>
  );
}
