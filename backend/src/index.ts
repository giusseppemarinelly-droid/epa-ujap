import path from 'node:path';

import cors from 'cors';
import express from 'express';

import { env } from './config/env';
import { errorHandler, HttpError } from './middleware/errorHandler';
import { authRouter } from './modules/auth/auth.routes';
import { connectionsRouter } from './modules/connections/connections.routes';
import { conversationsRouter } from './modules/conversations/conversations.routes';
import { groupsRouter } from './modules/groups/groups.routes';
import { interestsRouter } from './modules/interests/interests.routes';
import { locationRouter } from './modules/location/location.routes';
import { plansRouter } from './modules/plans/plans.routes';
import { usersRouter } from './modules/users/users.routes';

const app = express();
const publicWebDir = path.join(__dirname, '..', 'public-web');

// Render (y la mayoría de los PaaS) entrega las requests detrás de un proxy
// reverso: sin esto, req.ip sería siempre la IP del proxy y el rate limiter
// de las rutas de auth trataría a todos los usuarios como uno solo.
app.set('trust proxy', 1);

// El bearer token (no cookies) ya evita que un sitio ajeno pueda usar la
// sesión de alguien vía CORS, pero igual conviene un allowlist explícito en
// vez de aceptar cualquier origen. Esto cubre desarrollo local y despliegues
// web futuros en otro dominio.
const devOrigins = ['http://localhost:8081', 'http://localhost:19006'];
const extraOrigins = env.ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean) ?? [];
const allowedOrigins = [...devOrigins, ...extraOrigins];

// El origin se calcula por request (no una lista fija) para poder comparar
// contra el propio host: los navegadores mandan el header Origin incluso en
// mismo origen para ciertos recursos (las fuentes @font-face SIEMPRE piden en
// modo CORS, aunque vengan del mismo sitio) — sin este chequeo, producción
// (que sirve front y back del mismo origen) se rechazaba a sí misma con 500.
app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  const isSameOrigin = requestOrigin === `${req.protocol}://${req.get('host')}`;
  cors({
    origin(origin, callback) {
      // Sin Origin (apps nativas, curl) siempre se permite: CORS es una
      // protección que solo aplica a navegadores.
      if (!origin || isSameOrigin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new HttpError(403, 'Origen no permitido'));
    },
  })(req, res, next);
});
// Límite alto porque las fotos de perfil viajan como base64 en el body
// (una foto de cámara sin comprimir de más puede superar los 10mb en base64).
app.use(express.json({ limit: '25mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

const apiRouters: Array<[string, express.Router]> = [
  ['/auth', authRouter],
  ['/interests', interestsRouter],
  ['/plans', plansRouter],
  ['/groups', groupsRouter],
  ['/conversations', conversationsRouter],
  ['/users', usersRouter],
  ['/location', locationRouter],
  ['/connections', connectionsRouter],
];
for (const [prefix, router] of apiRouters) {
  app.use(prefix, router);
}

// Sirve el build web de la app (PWA para "Agregar a inicio" en iOS) desde
// el mismo servidor que la API.
app.use(express.static(publicWebDir, { extensions: ['html'] }));
app.get('*', (req, res) => {
  // Sin esto, una ruta de API mal escrita (ej. /auth/algo-que-no-existe) caía
  // hasta aquí y respondía 200 con el index.html de la SPA en vez de un 404.
  const isUnmatchedApiRoute = apiRouters.some(([prefix]) => req.path.startsWith(prefix));
  if (isUnmatchedApiRoute) {
    return res.status(404).json({ error: 'No encontrado' });
  }
  res.sendFile(path.join(publicWebDir, 'index.html'));
});

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Epa API escuchando en el puerto ${env.PORT}`);
});
