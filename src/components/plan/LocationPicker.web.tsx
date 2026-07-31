import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet';
import { MaterialIcons } from '@expo/vector-icons';

import { useThemeStore } from '@/src/store';
import { colors, elevation } from '@/src/theme/tokens';

type LocationPickerProps = {
  initialLat: number;
  initialLng: number;
  flyTo: { lat: number; lng: number } | null;
  onRegionChange: (lat: number, lng: number) => void;
};

function MoveWatcher({ onRegionChange }: { onRegionChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    moveend: (event) => {
      const center = event.target.getCenter();
      onRegionChange(center.lat, center.lng);
    },
  });
  return null;
}

function FlyToHandler({ flyTo }: { flyTo: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (flyTo) {
      map.flyTo([flyTo.lat, flyTo.lng], 17, { duration: 0.6 });
    }
  }, [flyTo, map]);
  return null;
}

// Equivalente web del selector nativo: mismo patrón de pin fijo en el
// centro, el mapa se mueve debajo con Leaflet en vez de react-native-maps.
export function LocationPicker({ initialLat, initialLng, flyTo, onRegionChange }: LocationPickerProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const isDark = useThemeStore((state) => state.resolvedScheme === 'dark');

  return (
    <View style={{ flex: 1 }}>
      <MapContainer
        center={[initialLat, initialLng]}
        zoom={17}
        style={{ height: '100%', width: '100%', background: colors['surface-container'] }}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom
        ref={mapRef}
      >
        <TileLayer
          key={isDark ? 'dark' : 'light'}
          url={`https://{s}.basemaps.cartocdn.com/${isDark ? 'dark_all' : 'light_all'}/{z}/{x}/{y}{r}.png`}
          attribution="&copy; OpenStreetMap, &copy; CARTO"
          subdomains="abcd"
          maxZoom={19}
        />
        <MoveWatcher onRegionChange={onRegionChange} />
        <FlyToHandler flyTo={flyTo} />
      </MapContainer>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          marginLeft: -20,
          marginTop: -40,
          zIndex: 1000,
        }}
      >
        <MaterialIcons name="place" size={40} color={colors.primary} style={elevation.floating} />
      </View>
    </View>
  );
}
