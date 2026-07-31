// Single source of truth for color tokens, adapted from the Stitch
// "University Pulse" design system (projects/3632403423750015018) into
// Epa branding. Required directly by tailwind.config.js and re-exported
// by tokens.ts, so this stays a plain CommonJS module (no TS in this file).
module.exports = {
  // Fondo con un dejo cálido (no gris puro) para que las tarjetas blancas
  // floten con más presencia — el blanco/gris plano era la causa principal
  // de que la app se sintiera apagada.
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

  // Coral: color primario de acción de Epa.
  primary: '#FF6F61',
  'on-primary': '#FFFFFF',
  'primary-container': '#FFDAD5',
  'on-primary-container': '#6F0205',
  'primary-dim': '#AC332A',
  'primary-fixed': '#FFDAD5',
  'primary-fixed-dim': '#FFB4AA',

  // Morado: acento secundario de Epa.
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

  // Institucional UJAP, uso puntual (headers, insignias, splash).
  'ujap-navy': '#13233E',
  'ujap-gold': '#CCA04F',
  'ujap-gold-container': '#FBEED2',
  'on-ujap-gold-container': '#6B4F0F',

  // Acentos por categoría de grupo, para que Grupos deje de verse
  // monocromático (todo en el mismo círculo morado clarito).
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
};
