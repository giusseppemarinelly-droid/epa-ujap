import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// Documento HTML raíz del export web. Expo Router usa este archivo tal cual
// (sin JS del lado del cliente) para renderizar el <head>, así que aquí van
// las meta tags de PWA / "Agregar a inicio" de iOS Safari.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <title>Epa — El punto de encuentro de la UJAP</title>
        <meta name="description" content="Epa, la app social de la comunidad UJAP." />

        <meta name="theme-color" content="#FF6F61" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Epa" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="icon" href="/favicon.png" />
        <link rel="manifest" href="/manifest.json" />

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
