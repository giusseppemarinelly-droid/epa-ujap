import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import MapView from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';

import { colors, elevation } from '@/src/theme/tokens';

type LocationPickerProps = {
  initialLat: number;
  initialLng: number;
  flyTo: { lat: number; lng: number } | null;
  onRegionChange: (lat: number, lng: number) => void;
};

// Selector de ubicación estilo Uber/Google Maps: el pin queda fijo en el
// centro de la pantalla y es el mapa el que se mueve por debajo al
// arrastrarlo, para no depender de tocar un punto exacto con el dedo.
export function LocationPicker({ initialLat, initialLng, flyTo, onRegionChange }: LocationPickerProps) {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (flyTo) {
      mapRef.current?.animateToRegion(
        { latitude: flyTo.lat, longitude: flyTo.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        500
      );
    }
  }, [flyTo]);

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: initialLat,
          longitude: initialLng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        onRegionChangeComplete={(region) => onRegionChange(region.latitude, region.longitude)}
      />
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: '50%', left: '50%', marginLeft: -20, marginTop: -40 }}
      >
        <MaterialIcons name="place" size={40} color={colors.primary} style={elevation.floating} />
      </View>
    </View>
  );
}
