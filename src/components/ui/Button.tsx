import { ActivityIndicator, Pressable, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { getEpaGradient, radii } from '@/src/theme/tokens';

type ButtonVariant = 'primary' | 'ghost';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = true,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const content = loading ? (
    <ActivityIndicator color={variant === 'ghost' ? '#FF6F61' : '#FFFFFF'} />
  ) : (
    <Text
      className={variant === 'ghost' ? 'text-primary' : undefined}
      style={{
        fontFamily: 'Inter_700Bold',
        fontSize: 16,
        color: variant === 'ghost' ? undefined : '#FFFFFF',
      }}
    >
      {label}
    </Text>
  );

  if (variant === 'ghost') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        className={`items-center justify-center rounded-full border-2 border-primary px-8 ${fullWidth ? 'w-full' : ''} ${isDisabled ? 'opacity-50' : ''}`}
        style={({ pressed }) => [{ minHeight: 56 }, pressed && { transform: [{ scale: 0.97 }], opacity: 0.85 }]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`${fullWidth ? 'w-full' : ''} ${isDisabled ? 'opacity-50' : ''}`}
      style={({ pressed }) => pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 }}
    >
      <LinearGradient
        colors={getEpaGradient()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          minHeight: 56,
          borderRadius: radii.full,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
        }}
      >
        {content}
      </LinearGradient>
    </Pressable>
  );
}
