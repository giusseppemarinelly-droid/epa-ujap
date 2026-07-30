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
          content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, shrink-to-fit=no, viewport-fit=cover, user-scalable=no"
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
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />

        <ScrollViewStyleReset />

        {/* Que el PWA se sienta como app instalada y no como Safari: sin
            rebote de scroll, sin zoom por pellizco/doble-tap, sin selección
            de texto ni menú de "copiar/guardar imagen" al mantener presionado,
            sin resaltado azul al tocar. Los campos de texto siguen
            seleccionables para poder pegar/copiar en ellos. */}
        <style
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `
              html, body {
                overscroll-behavior: none;
                overflow: hidden;
                position: fixed;
                inset: 0;
                width: 100%;
                height: 100%;
              }
              #root {
                overscroll-behavior: none;
              }
              * {
                -webkit-tap-highlight-color: transparent;
                -webkit-touch-callout: none;
              }
              body, div, span, p, h1, h2, h3, h4, h5, h6, button {
                -webkit-user-select: none;
                user-select: none;
                touch-action: manipulation;
              }
              input, textarea {
                -webkit-user-select: text;
                user-select: text;
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
