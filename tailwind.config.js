const rawColors = require('./src/theme/colors');

// Cada token se resuelve como variable CSS (definida en global.css para
// :root y .dark:root) en vez de un hex fijo, así bg-surface/text-on-surface
// etc. cambian solos entre modo claro y oscuro sin tocar cada pantalla. Las
// claves salen de colors.js (colors.light) para no mantener la lista dos
// veces; colors.js sigue siendo la fuente de los valores hex reales para
// los usos directos en JS (íconos, gradientes, mapas).
const cssVarColors = Object.fromEntries(
  Object.keys(rawColors.light).map((key) => [key, `rgb(var(--color-${key}) / <alpha-value>)`])
);

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: cssVarColors,
      fontFamily: {
        sans: ['Inter_400Regular'],
      },
      borderRadius: {
        sm: '8px',
        DEFAULT: '16px',
        md: '24px',
        lg: '24px',
        xl: '32px',
      },
      spacing: {
        'margin-mobile': '20px',
        gutter: '16px',
      },
    },
  },
  plugins: [],
};
