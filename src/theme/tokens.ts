import colors from './colors';
import type { TextStyle, ViewStyle } from 'react-native';

export { colors };

// Gradiente insignia de los CTAs primarios (coral -> morado).
export const epaGradient = [colors.primary, colors.secondary] as const;

export const typography = {
  headlineXl: { fontFamily: 'Inter_800ExtraBold', fontSize: 32, lineHeight: 40, letterSpacing: -0.6 },
  headlineLg: { fontFamily: 'Inter_700Bold', fontSize: 24, lineHeight: 32, letterSpacing: -0.2 },
  headlineLgMobile: { fontFamily: 'Inter_700Bold', fontSize: 20, lineHeight: 28 },
  titleMd: { fontFamily: 'Inter_600SemiBold', fontSize: 18, lineHeight: 24 },
  bodyLg: { fontFamily: 'Inter_400Regular', fontSize: 16, lineHeight: 24 },
  bodyMd: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 },
  labelMd: { fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 16, letterSpacing: 0.6 },
  buttonText: { fontFamily: 'Inter_700Bold', fontSize: 16, lineHeight: 20 },
} as const satisfies Record<string, TextStyle>;

export const radii = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 9999,
};

export const spacing = {
  marginMobile: 20,
  gutter: 16,
  stackSm: 8,
  stackMd: 16,
  stackLg: 32,
};

// Niveles de elevación descritos en el design system ("Elevation & Depth").
export const elevation = {
  card: {
    shadowColor: colors['ujap-navy'],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  } satisfies ViewStyle,
  floating: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 6,
  } satisfies ViewStyle,
};
