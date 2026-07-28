import { Pressable, Text } from 'react-native';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export function Chip({ label, selected = false, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className={`rounded-full px-3 py-2 ${selected ? 'bg-primary' : 'bg-secondary-container'}`}
    >
      <Text
        className={selected ? 'text-on-primary' : 'text-on-secondary-container'}
        style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 0.6 }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
