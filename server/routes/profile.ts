import crypto from 'node:crypto';
import { Router } from 'express';
import { getDb } from '../db.ts';
import {
  hashPassword,
  requireAuth,
  verifyPassword,
  type AuthedRequest,
} from '../lib/auth.ts';
import { asyncHandler } from '../lib/http.ts';
import { getProfileOverview, readProfile } from '../lib/profile.ts';
import { getWeeklyActivity } from '../lib/study.ts';
import {
  PREPARATION_LEVELS,
  validateOnboarding,
  ValidationError,
} from '../lib/validation.ts';

export const profileRouter = Router();

profileRouter.get(
  '/profile',
  requireAuth,
  asyncHandler((req, res) => {
    const user = (req as AuthedRequest).user!;
    res.json({
      ...getProfileOverview(user.id),
      weeklyActivity: getWeeklyActivity(user.id, 7),
    });
  }),
);

profileRouter.put(
  '/profile',
  requireAuth,
  asyncHandler((req, res) => {
    const user = (req as AuthedRequest).user!;
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    if (name.length < 2 || name.length > 60) {
      throw new ValidationError([{ field: 'name', message: 'Enter a name of 2-60 characters.' }]);
    }
    const values = validateOnboarding({
      examYear: req.body?.examYear,
      preparationLevel: req.body?.preparationLevel,
      dailyGoalMinutes: req.body?.dailyGoalMinutes,
    });
    if (!PREPARATION_LEVELS.includes(values.preparationLevel)) {
      throw new ValidationError([{ field: 'preparationLevel', message: 'Choose a valid level.' }]);
    }
    getDb()
      .prepare(
        `UPDATE profiles SET name = ?, exam_year = ?, preparation_level = ?, daily_goal_minutes = ?,
          onboarding_complete = 1 WHERE id = ?`,
      )
      .run(name, values.examYear, values.preparationLevel, values.dailyGoalMinutes, user.id);
    res.json({
      message: 'Profile updated.',
      user: readProfile(user.id),
    });
  }),
);

profileRouter.put(
  '/profile/password',
  requireAuth,
  asyncHandler((req, res) => {
    const user = (req as AuthedRequest).user!;
    const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
    const db = getDb();
    const row = db
      .prepare('SELECT password_hash FROM users WHERE id = ?')
      .get(user.id) as { password_hash: string } | undefined;
    if (!row || !verifyPassword(currentPassword, row.password_hash)) {
      throw new ValidationError([
        { field: 'currentPassword', message: 'Your current password is incorrect.' },
      ]);
    }
    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      throw new ValidationError([
        {
          field: 'newPassword',
          message: 'Use at least 8 characters with a letter and a number.',
        },
      ]);
    }
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(
      hashPassword(newPassword),
      user.id,
    );
    // Keep the current session; revoke other sessions.
    const cookies = String(req.headers.cookie ?? '');
    const current = cookies
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith('sm_session='));
    const token = current?.slice('sm_session='.length) ?? '';
    if (token) {
      const hash = crypto.createHash('sha256').update(token).digest('hex');
      db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash != ?').run(user.id, hash);
    }
    res.json({ message: 'Password changed. Other sessions have been signed out.' });
  }),
);
