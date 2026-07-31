import { View } from 'react-native';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import L from 'leaflet';

import { useThemeStore } from '@/src/store';
import { colors } from '@/src/theme/tokens';
import type { Plan } from '@/src/types';

const UJAP_CENTER: [number, number] = [10.2167, -68.0092];

function createMarkerIcon(selected: boolean) {
  const size = selected ? 46 : 34;
  const dot = size * 0.32;
  return L.divIcon({
    className: 'epa-plan-marker',
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 9999px;
      background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%);
      border: 3px solid #ffffff;
      box-shadow: 0 6px 16px rgba(19,35,62,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
    "><div style="
      width: ${dot}px;
      height: ${dot}px;
      border-radius: 9999px;
      background: #ffffff;
    "></div></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

type MapCanvasProps = {
  plans: Plan[];
  selectedPlanId: string | null;
  onSelectPlan: (id: string) => void;
};

// Mapa real e interactivo en web con Leaflet + tiles CARTO Positron (más
// limpios y de marca que el estilo por defecto de OpenStreetMap). Gratis,
// sin API key. react-native-maps no tiene build web, por eso esta variante.
export function MapCanvas({ plans, selectedPlanId, onSelectPlan }: MapCanvasProps) {
  const isDark = useThemeStore((state) => state.resolvedScheme === 'dark');

  return (
    <View style={{ flex: 1 }}>
      <MapContainer
        center={UJAP_CENTER}
        zoom={16}
        style={{ height: '100%', width: '100%', background: colors['surface-container'] }}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom
      >
        <TileLayer
          key={isDark ? 'dark' : 'light'}
          url={`https://{s}.basemaps.cartocdn.com/${isDark ? 'dark_all' : 'light_all'}/{z}/{x}/{y}{r}.png`}
          attribution='&copy; OpenStreetMap, &copy; CARTO'
          subdomains="abcd"
          maxZoom={19}
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
