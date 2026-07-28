import { View, type ViewProps } from 'react-native';

import { elevation } from '@/src/theme/tokens';

type CardProps = ViewProps & {
  padded?: boolean;
};

export function Card({ className = '', style, padded = true, ...props }: CardProps) {
  return (
    <View
      className={`bg-surface-container-lowest rounded-md ${padded ? 'p-5' : ''} ${className}`}
      style={[elevation.card, style]}
      {...props}
    />
  );
}
