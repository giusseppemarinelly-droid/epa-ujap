import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { Button, Chip, Input } from '@/src/components/ui';
import { colors } from '@/src/theme/tokens';
import type { Faculty, Interest } from '@/src/types';

const faculties: Faculty[] = [
  'Ingeniería',
  'Ciencias Jurídicas y Políticas',
  'Ciencias Económicas y Sociales',
  'Ciencias de la Salud',
];

const semesters = [1, 2, 3, 4, 5];

export type DiscoverFilters = {
  faculty?: Faculty;
  semester?: number;
  career: string;
  interestIds: string[];
};

type FiltersSheetProps = {
  visible: boolean;
  filters: DiscoverFilters;
  interests: Interest[];
  onChange: (filters: DiscoverFilters) => void;
  onClose: () => void;
};

export function FiltersSheet({ visible, filters, interests: allInterests, onChange, onClose }: FiltersSheetProps) {
  function toggleInterest(interestId: string) {
    const isSelected = filters.interestIds.includes(interestId);
    onChange({
      ...filters,
      interestIds: isSelected
        ? filters.interestIds.filter((id) => id !== interestId)
        : [...filters.interestIds, interestId],
    });
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(19,35,62,0.4)' }}>
        <View className="bg-surface rounded-t-xl px-margin-mobile pt-5 pb-8" style={{ maxHeight: '85%' }}>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-on-surface" style={{ fontFamily: 'Inter_700Bold', fontSize: 18 }}>
              Filtros
            </Text>
            <Pressable onPress={onClose}>
              <MaterialIcons name="close" size={22} color={colors['on-surface-variant']} />
            </Pressable>
          </View>

          <ScrollView>
            <Text
              className="text-on-surface-variant mb-2"
              style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12 }}
            >
              FACULTAD
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              <Chip
                label="Todas"
                selected={!filters.faculty}
                onPress={() => onChange({ ...filters, faculty: undefined })}
              />
              {faculties.map((faculty) => (
                <Chip
                  key={faculty}
                  label={faculty}
                  selected={filters.faculty === faculty}
                  onPress={() => onChange({ ...filters, faculty })}
                />
              ))}
            </View>

            <Input
              label="Carrera"
              placeholder="Ej. Ingeniería en Computación"
              value={filters.career}
              onChangeText={(career) => onChange({ ...filters, career })}
            />

            <Text
              className="text-on-surface-variant mb-2"
              style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12 }}
            >
              SEMESTRE
            </Text>
            <View className="flex-row gap-2 mb-4">
              <Pressable
                onPress={() => onChange({ ...filters, semester: undefined })}
                className={`flex-1 items-center justify-center rounded-full py-3 ${
                  !filters.semester ? 'bg-primary' : 'bg-surface-container'
                }`}
              >
                <Text
                  className={!filters.semester ? 'text-on-primary' : 'text-on-surface-variant'}
                  style={{ fontFamily: 'Inter_700Bold', fontSize: 13 }}
                >
                  Todos
                </Text>
              </Pressable>
              {semesters.map((semester) => (
                <Pressable
                  key={semester}
                  onPress={() => onChange({ ...filters, semester })}
                  className={`flex-1 items-center justify-center rounded-full py-3 ${
                    filters.semester === semester ? 'bg-primary' : 'bg-surface-container'
                  }`}
                >
                  <Text
                    className={filters.semester === semester ? 'text-on-primary' : 'text-on-surface-variant'}
                    style={{ fontFamily: 'Inter_700Bold', fontSize: 13 }}
                  >
                    {semester === 5 ? '5+' : semester}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text
              className="text-on-surface-variant mb-2"
              style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12 }}
            >
              INTERESES
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {allInterests.map((interest) => (
                <Chip
                  key={interest.id}
                  label={interest.label}
                  selected={filters.interestIds.includes(interest.id)}
                  onPress={() => toggleInterest(interest.id)}
                />
              ))}
            </View>
          </ScrollView>

          <Button label="Aplicar filtros" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}
