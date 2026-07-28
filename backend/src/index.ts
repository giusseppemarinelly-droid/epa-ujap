import cors from 'cors';
import express from 'express';

import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './modules/auth/auth.routes';
import { conversationsRouter } from './modules/conversations/conversations.routes';
import { groupsRouter } from './modules/groups/groups.routes';
import { interestsRouter } from './modules/interests/interests.routes';
import { plansRouter } from './modules/plans/plans.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/auth', authRouter);
app.use('/interests', interestsRouter);
app.use('/plans', plansRouter);
app.use('/groups', groupsRouter);
app.use('/conversations', conversationsRouter);

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Epa API escuchando en el puerto ${env.PORT}`);
});
