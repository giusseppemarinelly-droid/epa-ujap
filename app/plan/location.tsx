import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { Button } from '@/src/components/ui';
import { LocationPicker } from '@/src/components/plan/LocationPicker';
import { useLocationPickerStore } from '@/src/store';
import { colors, elevation } from '@/src/theme/tokens';

const UJAP_CENTER = { lat: 10.2167, lng: -68.0092 };

type SearchResult = { lat: number; lng: number; label: string };

// Selector de ubicación estilo Google Maps: el pin queda fijo en el centro
// y el usuario mueve el mapa por debajo; también se puede buscar una
// dirección y el mapa vuela hasta ahí. Nominatim (OSM) no pide API key.
export default function LocationPickerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ lat?: string; lng?: string }>();
  const setPending = useLocationPickerStore((state) => state.setPending);

  const initial = useRef({
    lat: params.lat ? Number(params.lat) : UJAP_CENTER.lat,
    lng: params.lng ? Number(params.lng) : UJAP_CENTER.lng,
  }).current;

  const [center, setCenter] = useState(initial);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState('Ubicando...');
  const [resolvingAddress, setResolvingAddress] = useState(true);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    reverseGeocode(initial.lat, initial.lng);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function reverseGeocode(lat: number, lng: number) {
    setResolvingAddress(true);
    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
      headers: { 'Accept-Language': 'es' },
    })
      .then((res) => res.json())
      .then((data) => setAddress(data.display_name ?? 'Ubicación sin nombre'))
      .catch(() => setAddress('No se pudo obtener la dirección'))
      .finally(() => setResolvingAddress(false));
  }

  function handleRegionChange(lat: number, lng: number) {
    setCenter({ lat, lng });
    reverseGeocode(lat, lng);
  }

  function handleSearchChange(text: string) {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 3) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      setSearching(true);
      fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
          text
        )}&countrycodes=ve&viewbox=-68.05,10.24,-67.97,10.19&limit=6`,
        { headers: { 'Accept-Language': 'es' } }
      )
        .then((res) => res.json())
        .then((data: Array<{ lat: string; lon: string; display_name: string }>) => {
          setResults(
            data.map((item) => ({ lat: Number(item.lat), lng: Number(item.lon), label: item.display_name }))
          );
        })
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 450);
  }

  function selectResult(result: SearchResult) {
    setResults([]);
    setQuery('');
    setFlyTo({ lat: result.lat, lng: result.lng });
    setCenter({ lat: result.lat, lng: result.lng });
    setAddress(result.label);
  }

  function handleConfirm() {
    setPending({ lat: center.lat, lng: center.lng, address });
    router.back();
  }

  return (
    <View style={{ flex: 1 }}>
      <LocationPicker
        initialLat={initial.lat}
        initialLng={initial.lng}
        flyTo={flyTo}
        onRegionChange={handleRegionChange}
      />

      <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0 }} edges={['top']}>
        <View
          className="flex-row items-center mx-4 mt-2 bg-surface-container-lowest rounded-full px-2"
          style={[elevation.card, { minHeight: 52 }]}
        >
          <Pressable onPress={() => router.back()} className="p-2">
            <MaterialIcons name="arrow-back" size={22} color={colors['on-surface']} />
          </Pressable>
          <TextInput
            value={query}
            onChangeText={handleSearchChange}
            placeholder="Buscar dirección o lugar..."
            placeholderTextColor={colors['on-surface-variant']}
            className="flex-1 text-on-surface px-2"
            style={{ fontFamily: 'Inter_400Regular', fontSize: 14 }}
          />
          {searching && <ActivityIndicator size="small" color={colors.primary} />}
        </View>

        {results.length > 0 && (
          <View
            className="mx-4 mt-1 bg-surface-container-lowest rounded-md overflow-hidden"
            style={elevation.card}
          >
            <FlatList
              data={results}
              keyExtractor={(item, index) => `${item.lat}-${item.lng}-${index}`}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item, index }) => (
                <Pressable
                  onPress={() => selectResult(item)}
                  className="px-4 py-3"
                  style={{
                    borderTopWidth: index === 0 ? 0 : 1,
                    borderTopColor: colors['surface-container'],
                  }}
                >
                  <Text className="text-on-surface" style={{ fontSize: 13 }} numberOfLines={2}>
                    {item.label}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        )}
      </SafeAreaView>

      <SafeAreaView style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} edges={['bottom']}>
        <View className="mx-4 mb-4 bg-surface-container-lowest rounded-lg p-4" style={elevation.floating}>
          <View className="flex-row items-start mb-3">
            <MaterialIcons name="location-on" size={18} color={colors.primary} style={{ marginTop: 2 }} />
            <Text
              className="text-on-surface flex-1 ml-2"
              style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13 }}
              numberOfLines={2}
            >
              {resolvingAddress ? 'Ubicando...' : address}
            </Text>
          </View>
          <Button label="Confirmar ubicación" onPress={handleConfirm} disabled={resolvingAddress} />
        </View>
      </SafeAreaView>
    </View>
  );
}
