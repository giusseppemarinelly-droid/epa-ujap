import colors from './colors';
import type { TextStyle, ViewStyle } from 'react-native';

export { colors };

// `colors` es un objeto mutable (ver colors.js): sus valores cambian al
// alternar tema, pero un array/objeto calculado una sola vez a partir de él
// al cargar el módulo queda congelado con los valores iniciales. Por eso
// esto y `categoryAccents` de abajo son funciones, no constantes: se leen
// en cada uso, después de que el remount por cambio de tema ya aplicó la
// paleta correspondiente.
export function getEpaGradient() {
  return [colors['brand-gradient-start'], colors['brand-gradient-end']] as const;
}

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
// Un poco más marcados que la versión original (0.05 de opacidad se sentía
// plano sobre el fondo casi blanco) para que las tarjetas tengan presencia.
export const elevation = {
  card: {
    shadowColor: colors['ujap-navy'],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.09,
    shadowRadius: 18,
    elevation: 4,
  } satisfies ViewStyle,
  floating: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 6,
  } satisfies ViewStyle,
};

// Un color por categoría de grupo, para que la lista de Grupos no se vea
// monocromática (antes todo usaba el mismo círculo morado clarito).
export function getCategoryAccents(): Record<string, { bg: string; fg: string }> {
  return {
    Académico: { bg: colors['category-academico-bg'], fg: colors['category-academico-fg'] },
    Deportes: { bg: colors['category-deportes-bg'], fg: colors['category-deportes-fg'] },
    Tecnología: { bg: colors['category-tecnologia-bg'], fg: colors['category-tecnologia-fg'] },
    Creatividad: { bg: colors['category-creatividad-bg'], fg: colors['category-creatividad-fg'] },
    Arte: { bg: colors['category-arte-bg'], fg: colors['category-arte-fg'] },
  };
}
