import { Image, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';

import { colors, elevation } from '@/src/theme/tokens';
import type { MapPerson } from '@/src/types';

const SIZE = 44;

type PersonMarkerProps = {
  person: MapPerson;
  onPress: () => void;
};

// Círculo con la foto, frente al pin cuadrado de los planes: de un vistazo se
// distingue "hay alguien aquí" de "hay algo que hacer aquí".
export function PersonMarker({ person, onPress }: PersonMarkerProps) {
  return (
    <Marker
      coordinate={{ latitude: person.lat, longitude: person.lng }}
      onPress={onPress}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View
        className="items-center justify-center rounded-full bg-surface-container-lowest"
        style={[
          { width: SIZE, height: SIZE, borderWidth: 3, borderColor: '#FFFFFF', overflow: 'hidden' },
          elevation.card,
        ]}
      >
        {person.photoUrl ? (
          <Image
            source={{ uri: person.photoUrl }}
            style={{ width: SIZE, height: SIZE, borderRadius: SIZE / 2 }}
          />
        ) : (
          <MaterialIcons name="person" size={SIZE * 0.6} color={colors['on-surface-variant']} />
        )}
      </View>
    </Marker>
  );
}
