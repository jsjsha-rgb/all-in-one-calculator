import crypto from 'node:crypto';
import { Router } from 'express';
import { getDb, nowIso } from '../db.ts';
import {
  clearSessionCookie,
  consumePasswordReset,
  createPasswordReset,
  createSession,
  destroySession,
  getSessionUser,
  hashPassword,
  rateLimitMiddleware,
  requireAuth,
  setSessionCookie,
  verifyPassword,
  type AuthedRequest,
} from '../lib/auth.ts';
import { asyncHandler } from '../lib/http.ts';
import { readProfile } from '../lib/profile.ts';
import {
  ValidationError,
  validateLogin,
  validateOnboarding,
  validateSignup,
} from '../lib/validation.ts';
import { ensureTodayTasks } from '../lib/study.ts';

export const authRouter = Router();

authRouter.post(
  '/signup',
  rateLimitMiddleware('signup', 10, 15 * 60 * 1000),
  asyncHandler((req, res) => {
    const { name, email, password } = validateSignup(req.body ?? {});
    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      throw new ValidationError([
        { field: 'email', message: 'An account with this email already exists. Try logging in.' },
      ]);
    }
    const userId = crypto.randomUUID();
    const createdAt = nowIso();
    db.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)').run(
      userId,
      email,
      hashPassword(password),
      createdAt,
    );
    db.prepare(
      `INSERT INTO profiles (id, name, email, exam_year, preparation_level, daily_goal_minutes,
        onboarding_complete, created_at) VALUES (?, ?, ?, NULL, NULL, 120, 0, ?)`,
    ).run(userId, name, email, createdAt);

    const session = createSession(userId);
    setSessionCookie(res, session.token, session.expiresAt);
    res.status(201).json({ user: readProfile(userId) });
  }),
);

authRouter.post(
  '/login',
  rateLimitMiddleware('login', 20, 15 * 60 * 1000),
  asyncHandler((req, res) => {
    const { email, password } = validateLogin(req.body ?? {});
    const db = getDb();
    const user = db
      .prepare('SELECT id, password_hash FROM users WHERE email = ?')
      .get(email) as { id: string; password_hash: string } | undefined;
    // Uniform message avoids revealing whether an email is registered.
    if (!user || !verifyPassword(password, user.password_hash)) {
      res.status(401).json({
        error: 'Email or password is incorrect.',
        code: 'INVALID_CREDENTIALS',
      });
      return;
    }
    const session = createSession(user.id);
    setSessionCookie(res, session.token, session.expiresAt);
    ensureTodayTasks(user.id);
    res.json({ user: readProfile(user.id) });
  }),
);

authRouter.post(
  '/logout',
  asyncHandler((req, res) => {
    destroySession(req);
    clearSessionCookie(res);
    res.json({ ok: true });
  }),
);

authRouter.get(
  '/me',
  asyncHandler((req, res) => {
    const user = getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: 'Not signed in.', code: 'UNAUTHENTICATED' });
      return;
    }
    res.json({ user: readProfile(user.id) });
  }),
);

authRouter.put(
  '/onboarding',
  requireAuth,
  asyncHandler((req, res) => {
    const user = (req as AuthedRequest).user!;
    const values = validateOnboarding(req.body ?? {});
    const db = getDb();
    db.prepare(
      `UPDATE profiles SET exam_year = ?, preparation_level = ?, daily_goal_minutes = ?,
        onboarding_complete = 1 WHERE id = ?`,
    ).run(values.examYear, values.preparationLevel, values.dailyGoalMinutes, user.id);
    // Rebuild today's plan against the new time goal.
    db.prepare(
      `DELETE FROM study_tasks WHERE user_id = ? AND due_date = ? AND status = 'pending'`,
    ).run(user.id, new Date().toISOString().slice(0, 10));
    ensureTodayTasks(user.id);
    res.json({ user: readProfile(user.id) });
  }),
);

authRouter.post(
  '/forgot-password',
  rateLimitMiddleware('forgot', 8, 15 * 60 * 1000),
  asyncHandler((req, res) => {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const db = getDb();
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as
      | { id: string }
      | undefined;
    let devToken: string | undefined;
    if (user) {
      const token = createPasswordReset(user.id);
      // In development we surface the token so the flow is testable without email.
      // Production must deliver it through a configured email provider.
      if (process.env.NODE_ENV !== 'production') devToken = token;
    }
    res.json({
      message:
        'If an account exists for that email, a password reset link has been created. In production this is delivered by email.',
      devResetToken: devToken,
    });
  }),
);

authRouter.post(
  '/reset-password',
  rateLimitMiddleware('reset', 10, 15 * 60 * 1000),
  asyncHandler((req, res) => {
    const token = String(req.body?.token ?? '');
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      throw new ValidationError([
        { field: 'password', message: 'Use at least 8 characters with a letter and a number.' },
      ]);
    }
    const userId = consumePasswordReset(token);
    if (!userId) {
      res.status(400).json({
        error: 'This reset link is invalid or has expired. Request a new one.',
        code: 'INVALID_RESET_TOKEN',
      });
      return;
    }
    const db = getDb();
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(password), userId);
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
    clearSessionCookie(res);
    res.json({ message: 'Password updated. You can now log in with your new password.' });
  }),
);
