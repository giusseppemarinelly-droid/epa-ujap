// Single source of truth for color tokens, adapted from the Stitch
// "University Pulse" design system (projects/3632403423750015018) into
// Epa branding. Required directly by tailwind.config.js (key names only —
// see below) and re-exported by tokens.ts, so this stays a plain CommonJS
// module (no TS in this file).
//
// Two palettes so the app supports light/dark. Tailwind's `bg-surface`
// etc. get their real value from CSS variables in global.css (switched by
// NativeWind's darkMode:'class', see useThemeStore) — completely separate
// from this file. This file only powers direct JS color reads (icon
// `color` props, gradients, map markers/shadows) that can't consume a CSS
// variable. `colors` is a single mutable object so every existing
// `colors.foo` import keeps working after a theme switch: `applyColorScheme`
// mutates it in place and the app forces a full remount to re-read it.
const light = {
  surface: '#FDF9F8',
  'surface-dim': '#E3D3CE',
  'surface-bright': '#FDF9F8',
  'surface-container-lowest': '#FFFFFF',
  'surface-container-low': '#F8F1EE',
  'surface-container': '#F3E9E5',
  'surface-container-high': '#EDDDD7',
  'surface-container-highest': '#E6D2CA',
  'on-surface': '#221C1B',
  'on-surface-variant': '#6E6470',
  'inverse-surface': '#332C2A',
  'inverse-on-surface': '#F8F1EE',
  outline: '#8C716D',
  'outline-variant': '#E0BFBB',

  primary: '#FF6F61',
  'on-primary': '#FFFFFF',
  'primary-container': '#FFDAD5',
  'on-primary-container': '#6F0205',
  'primary-dim': '#AC332A',
  'primary-fixed': '#FFDAD5',
  'primary-fixed-dim': '#FFB4AA',

  secondary: '#6B5B95',
  'on-secondary': '#FFFFFF',
  'secondary-container': '#E9DDFF',
  'on-secondary-container': '#4D3D75',

  tertiary: '#4F5F7D',
  'on-tertiary': '#FFFFFF',
  'tertiary-container': '#D7E2FF',
  'on-tertiary-container': '#253450',

  error: '#BA1A1A',
  'on-error': '#FFFFFF',
  'error-container': '#FFDAD6',
  'on-error-container': '#93000A',

  background: '#FDF9F8',
  'on-background': '#221C1B',

  'ujap-navy': '#13233E',
  'ujap-gold': '#CCA04F',
  'ujap-gold-container': '#FBEED2',
  'on-ujap-gold-container': '#6B4F0F',

  'category-academico-bg': '#E9DDFF',
  'category-academico-fg': '#4D3D75',
  'category-deportes-bg': '#D7F2E1',
  'category-deportes-fg': '#1E7A46',
  'category-tecnologia-bg': '#D7E7FF',
  'category-tecnologia-fg': '#1D5FA8',
  'category-creatividad-bg': '#FFE3D1',
  'category-creatividad-fg': '#B4570A',
  'category-arte-bg': '#FFD9EC',
  'category-arte-fg': '#B0286B',

  // El degradado insignia de los CTAs se mantiene igual de vivo en los dos
  // temas a propósito: es una superficie de marca, no un tono M3 que deba
  // aclararse en oscuro, y el texto blanco de encima solo se ve bien si el
  // fondo se queda saturado.
  'brand-gradient-start': '#FF6F61',
  'brand-gradient-end': '#6B5B95',
};

const dark = {
  surface: '#171314',
  'surface-dim': '#171314',
  'surface-bright': '#3A3335',
  'surface-container-lowest': '#120E0F',
  'surface-container-low': '#1F1A1B',
  'surface-container': '#241E20',
  'surface-container-high': '#2F282A',
  'surface-container-highest': '#3A3335',
  'on-surface': '#F2E9E7',
  'on-surface-variant': '#CBBFC7',
  'inverse-surface': '#F2E9E7',
  'inverse-on-surface': '#241E20',
  outline: '#9B8D89',
  'outline-variant': '#4F4547',

  primary: '#FF8A7D',
  'on-primary': '#5C1208',
  'primary-container': '#7D2A20',
  'on-primary-container': '#FFDAD5',
  'primary-dim': '#FF6F61',
  'primary-fixed': '#FFDAD5',
  'primary-fixed-dim': '#FFB4AA',

  secondary: '#CABEFF',
  'on-secondary': '#34265C',
  'secondary-container': '#4D3D75',
  'on-secondary-container': '#E9DDFF',

  tertiary: '#AFC6FF',
  'on-tertiary': '#1A2D4C',
  'tertiary-container': '#253450',
  'on-tertiary-container': '#D7E2FF',

  error: '#FFB4AB',
  'on-error': '#690005',
  'error-container': '#93000A',
  'on-error-container': '#FFDAD6',

  background: '#171314',
  'on-background': '#F2E9E7',

  'ujap-navy': '#13233E',
  'ujap-gold': '#E3B968',
  'ujap-gold-container': '#4A3A12',
  'on-ujap-gold-container': '#FBEED2',

  'category-academico-bg': '#3A3060',
  'category-academico-fg': '#D8C8FF',
  'category-deportes-bg': '#1F3D2A',
  'category-deportes-fg': '#9FE8B8',
  'category-tecnologia-bg': '#1F324D',
  'category-tecnologia-fg': '#A8CBFF',
  'category-creatividad-bg': '#4A2E14',
  'category-creatividad-fg': '#FFC79A',
  'category-arte-bg': '#4A1F35',
  'category-arte-fg': '#FFB0DB',

  'brand-gradient-start': '#FF6F61',
  'brand-gradient-end': '#6B5B95',
};

const colors = { ...light };

function applyColorScheme(scheme) {
  const palette = scheme === 'dark' ? dark : light;
  Object.assign(colors, palette);
}

module.exports = colors;
module.exports.light = light;
module.exports.dark = dark;
module.exports.applyColorScheme = applyColorScheme;
