// Single source of truth for color tokens, adapted from the Stitch
// "University Pulse" design system (projects/3632403423750015018) into
// Epa branding. Required directly by tailwind.config.js and re-exported
// by tokens.ts, so this stays a plain CommonJS module (no TS in this file).
module.exports = {
  surface: '#F9F9F9',
  'surface-dim': '#DADADA',
  'surface-bright': '#F9F9F9',
  'surface-container-lowest': '#FFFFFF',
  'surface-container-low': '#F3F3F3',
  'surface-container': '#EEEEEE',
  'surface-container-high': '#E8E8E8',
  'surface-container-highest': '#E2E2E2',
  'on-surface': '#1A1C1C',
  'on-surface-variant': '#58413E',
  'inverse-surface': '#2F3131',
  'inverse-on-surface': '#F1F1F1',
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

  background: '#F9F9F9',
  'on-background': '#1A1C1C',

  // Institucional UJAP, uso puntual (headers, insignias, splash).
  'ujap-navy': '#13233E',
  'ujap-gold': '#CCA04F',
};
