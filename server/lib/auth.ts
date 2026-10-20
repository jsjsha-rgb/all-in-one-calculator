import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { getDb, nowIso } from '../db.ts';

export const SESSION_COOKIE = 'sm_session';
const SESSION_DAYS = 30;

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  examYear: number | null;
  preparationLevel: string | null;
  dailyGoalMinutes: number;
  onboardingComplete: boolean;
  createdAt: string;
}

// ---------- password hashing ----------
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split(':');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

export const sha256 = (value: string): string =>
  crypto.createHash('sha256').update(value).digest('hex');

// ---------- sessions ----------
export function createSession(userId: string): { token: string; expiresAt: string } {
  const db = getDb();
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  db.prepare(
    'INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)',
  ).run(sha256(token), userId, expires.toISOString(), nowIso());
  return { token, expiresAt: expires.toISOString() };
}

export function setSessionCookie(res: Response, token: string, expiresAt: string): void {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Expires=${new Date(
      expiresAt,
    ).toUTCString()}${secure}`,
  );
}

export function clearSessionCookie(res: Response): void {
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
  );
}

function readToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7).trim();
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === SESSION_COOKIE) return decodeURIComponent(rest.join('='));
  }
  return null;
}

export function getSessionUser(req: Request): SessionUser | null {
  const token = readToken(req);
  if (!token) return null;
  const db = getDb();
  const row = db
    .prepare(
      `SELECT p.id, p.email, p.name, p.exam_year, p.preparation_level, p.daily_goal_minutes,
              p.onboarding_complete, p.created_at, s.expires_at
       FROM sessions s JOIN profiles p ON p.id = s.user_id
       WHERE s.token_hash = ?`,
    )
    .get(sha256(token)) as Record<string, unknown> | undefined;
  if (!row) return null;
  if (new Date(String(row.expires_at)).getTime() < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
    return null;
  }
  return {
    id: String(row.id),
    email: String(row.email),
    name: String(row.name),
    examYear: row.exam_year === null ? null : Number(row.exam_year),
    preparationLevel: row.preparation_level === null ? null : String(row.preparation_level),
    dailyGoalMinutes: Number(row.daily_goal_minutes),
    onboardingComplete: Number(row.onboarding_complete) === 1,
    createdAt: String(row.created_at),
  };
}

export function destroySession(req: Request): void {
  const token = readToken(req);
  if (!token) return;
  getDb().prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
}

export interface AuthedRequest extends Request {
  user?: SessionUser;
}

/** Guard for all user-specific endpoints. */
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const user = getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: 'Please log in to continue.', code: 'UNAUTHENTICATED' });
    return;
  }
  req.user = user;
  next();
}

// ---------- password reset ----------
export function createPasswordReset(userId: string): string {
  const token = crypto.randomBytes(24).toString('hex');
  const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  getDb()
    .prepare(
      'INSERT INTO password_resets (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)',
    )
    .run(sha256(token), userId, expires, nowIso());
  return token;
}

export function consumePasswordReset(token: string): string | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT user_id, expires_at, used_at FROM password_resets WHERE token_hash = ?`,
    )
    .get(sha256(token)) as Record<string, unknown> | undefined;
  if (!row || row.used_at) return null;
  if (new Date(String(row.expires_at)).getTime() < Date.now()) return null;
  db.prepare('UPDATE password_resets SET used_at = ? WHERE token_hash = ?').run(
    nowIso(),
    sha256(token),
  );
  return String(row.user_id);
}

// ---------- rate limiting ----------
interface Bucket {
  count: number;
  resetAt: number;
}
const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function rateLimitMiddleware(name: string, limit: number, windowMs: number) {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    const identity = req.user?.id ?? req.ip ?? 'anonymous';
    const result = rateLimit(`${name}:${identity}`, limit, windowMs);
    if (!result.allowed) {
      res.status(429).json({
        error: `Too many requests. Please try again in ${result.retryAfterSeconds} seconds.`,
        code: 'RATE_LIMITED',
        retryAfterSeconds: result.retryAfterSeconds,
      });
      return;
    }
    next();
  };
}

export function resetRateLimitsForTests(): void {
  buckets.clear();
}
