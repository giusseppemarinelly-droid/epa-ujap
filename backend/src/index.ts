import path from 'node:path';

import cors from 'cors';
import express from 'express';

import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './modules/auth/auth.routes';
import { connectionsRouter } from './modules/connections/connections.routes';
import { conversationsRouter } from './modules/conversations/conversations.routes';
import { groupsRouter } from './modules/groups/groups.routes';
import { interestsRouter } from './modules/interests/interests.routes';
import { plansRouter } from './modules/plans/plans.routes';
import { usersRouter } from './modules/users/users.routes';

const app = express();
const publicWebDir = path.join(__dirname, '..', 'public-web');

app.use(cors());
// Límite alto porque las fotos de perfil viajan como base64 en el body.
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/auth', authRouter);
app.use('/interests', interestsRouter);
app.use('/plans', plansRouter);
app.use('/groups', groupsRouter);
app.use('/conversations', conversationsRouter);
app.use('/users', usersRouter);
app.use('/connections', connectionsRouter);

// Sirve el build web de la app (PWA para "Agregar a inicio" en iOS) desde
// el mismo servidor que la API.
app.use(express.static(publicWebDir, { extensions: ['html'] }));
app.get('*', (_req, res) => {
  res.sendFile(path.join(publicWebDir, 'index.html'));
});

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Epa API escuchando en el puerto ${env.PORT}`);
});
