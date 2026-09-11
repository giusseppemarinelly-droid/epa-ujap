import { useEffect } from 'react';
import { View } from 'react-native';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import L from 'leaflet';

import { useThemeStore } from '@/src/store';
import { colors } from '@/src/theme/tokens';
import type { MapPerson, Plan } from '@/src/types';

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

// Mismo ícono de persona que usa Avatar cuando no hay foto, dibujado a mano
// porque dentro de un divIcon solo se puede meter HTML, no componentes.
const PERSON_SVG = `<svg viewBox="0 0 24 24" width="60%" height="60%" fill="${colors['on-surface-variant']}"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`;

function createPersonIcon(person: MapPerson) {
  const size = 44;
  const inner = person.photoUrl
    ? `background-image: url('${person.photoUrl}'); background-size: cover; background-position: center;`
    : `background: ${colors['surface-container']}; display: flex; align-items: center; justify-content: center;`;

  return L.divIcon({
    className: 'epa-person-marker',
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 9999px;
      border: 3px solid #ffffff;
      box-shadow: 0 6px 16px rgba(19,35,62,0.30);
      overflow: hidden;
      ${inner}
    ">${person.photoUrl ? '' : PERSON_SVG}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

type MapCanvasProps = {
  plans: Plan[];
  people: MapPerson[];
  selectedPlanId: string | null;
  onSelectPlan: (id: string) => void;
  onSelectPerson: (id: string) => void;
};

// Filtro CSS para simular un mapa oscuro: los tiles de OpenStreetMap solo
// vienen en un estilo (claro), a diferencia de CARTO que ofrece light_all y
// dark_all. Se inyecta una sola vez en <head> porque react-leaflet no expone
// un prop `style`/`filter` para el TileLayer, solo `className`.
function useDarkTileFilter() {
  useEffect(() => {
    const styleId = 'epa-map-dark-filter';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent =
      '.epa-tiles-dark { filter: invert(1) hue-rotate(180deg) brightness(0.95) contrast(0.9) saturate(0.7); }';
    document.head.appendChild(style);
  }, []);
}

// Mapa real e interactivo en web con Leaflet. Tiles estándar de
// OpenStreetMap: gratis y sin API key, a diferencia de CARTO (que en agosto
// 2026 empezó a exigir una clave incluso para su capa gratuita). Sin estilo
// oscuro propio, así que el modo oscuro se simula con un filtro CSS — si el
// tráfico crece mucho, conviene pasar a un proveedor con capa dedicada.
// react-native-maps no tiene build web, por eso esta variante aparte.
export function MapCanvas({
  plans,
  people,
  selectedPlanId,
  onSelectPlan,
  onSelectPerson,
}: MapCanvasProps) {
  const isDark = useThemeStore((state) => state.resolvedScheme === 'dark');
  useDarkTileFilter();

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
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          subdomains="abc"
          maxZoom={19}
          className={isDark ? 'epa-tiles-dark' : undefined}
        />
        {plans.map((plan) => (
          <Marker
            key={plan.id}
            position={[plan.location.lat, plan.location.lng]}
            icon={createMarkerIcon(plan.id === selectedPlanId)}
            eventHandlers={{ click: () => onSelectPlan(plan.id) }}
          />
        ))}
        {people.map((person) => (
          <Marker
            key={person.id}
            position={[person.lat, person.lng]}
            icon={createPersonIcon(person)}
            eventHandlers={{ click: () => onSelectPerson(person.id) }}
          />
        ))}
      </MapContainer>
    </View>
  );
}
