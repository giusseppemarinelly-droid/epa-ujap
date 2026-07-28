import { ActivityIndicator, Pressable, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { epaGradient, radii } from '@/src/theme/tokens';

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
      className={variant === 'ghost' ? 'text-primary' : 'text-on-primary'}
      style={{ fontFamily: 'Inter_700Bold', fontSize: 16 }}
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
        style={{ minHeight: 56 }}
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
    >
      <LinearGradient
        colors={epaGradient}
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
