import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAIStatus } from './lib/ai.ts';
import { getDb, getDbPath } from './db.ts';
import { ValidationError } from './lib/validation.ts';
import { seedDatabase, DEMO_EMAIL, DEMO_PASSWORD } from './seed/index.ts';
import { authRouter } from './routes/auth.ts';
import { contentRouter } from './routes/content.ts';
import { practiceRouter } from './routes/practice.ts';
import { mentorRouter } from './routes/mentor.ts';
import { mainsRouter } from './routes/mains.ts';
import { profileRouter } from './routes/profile.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

export function createApp() {
  getDb();

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '256kb' }));

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'studaymentor-ai', time: new Date().toISOString() });
  });

  app.use('/api/auth', authRouter);
  app.use('/api', contentRouter);
  app.use('/api/practice', practiceRouter);
  app.use('/api', mentorRouter);
  app.use('/api', mainsRouter);
  app.use('/api', profileRouter);

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API route not found.' });
  });

  const dist = path.join(root, 'dist');
  if (fs.existsSync(dist)) {
    app.use(express.static(dist, { index: false, maxAge: '1h' }));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(dist, 'index.html'));
    });
  }

  app.use(
    (
      error: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      if (error instanceof ValidationError) {
        res.status(400).json({
          error: error.message,
          code: 'VALIDATION_ERROR',
          errors: error.errors,
        });
        return;
      }
      if (error instanceof SyntaxError && 'body' in error) {
        res.status(400).json({ error: 'Request body is not valid JSON.', code: 'BAD_JSON' });
        return;
      }
      console.error('Unhandled server error:', error);
      res.status(500).json({
        error: 'Something went wrong on our side. Please try again.',
        code: 'INTERNAL_ERROR',
      });
    },
  );

  return app;
}

const isDirectRun = process.argv[1]?.endsWith('server/index.ts') || process.argv[1]?.endsWith('server/index.js');
if (isDirectRun) {
  const db = getDb();
  const shouldSeed =
    process.env.SEED_ON_START === 'true' ||
    (process.env.SEED_ON_START !== 'false' && process.env.NODE_ENV !== 'production');
  if (shouldSeed) {
    seedDatabase({ quiet: true, demo: process.env.SEED_DEMO_ACCOUNT !== 'false' });
  } else {
    console.log('Startup seeding skipped. Run `npm run seed` explicitly if needed.');
  }
  const port = Number(process.env.PORT || 3001);
  const app = createApp();
  app.listen(port, '0.0.0.0', () => {
    const ai = getAIStatus();
    console.log(`StudyMentor API listening on http://0.0.0.0:${port}`);
    console.log(`SQLite database: ${getDbPath()}`);
    console.log(
      `AI mode: ${ai.mode}${ai.mode === 'demo' ? ` (${ai.reason ?? 'no provider configured'})` : ` via ${ai.provider}/${ai.model}`}`,
    );
    const userCount = Number((db.prepare('SELECT COUNT(*) AS c FROM users').get() as any).c);
    console.log(`Accounts: ${userCount}. Demo login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  });
}
