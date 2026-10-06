import 'server-only';
import crypto from 'crypto';
import { cookies } from 'next/headers';

export const ADMIN_SESSION_COOKIE = 'admin_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface AdminSessionPayload {
  name: string;
  exp: number;
}

function sign(payload: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not configured');
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createSessionToken(name: string): string {
  const payload: AdminSessionPayload = { name, exp: Date.now() + SESSION_TTL_MS };
  const payloadStr = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  return `${payloadStr}.${sign(payloadStr)}`;
}

/** Pure, synchronous — safe to call from proxy.ts (Node.js runtime) and
 *  from Server Components/Route Handlers alike. */
export function verifySessionToken(token: string | undefined | null): AdminSessionPayload | null {
  if (!token) return null;
  const dot = token.indexOf('.');
  if (dot === -1) return null;
  const payloadStr = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  let expectedSig: string;
  try {
    expectedSig = sign(payloadStr);
  } catch {
    return null;
  }

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf-8')) as AdminSessionPayload;
    if (typeof payload.name !== 'string' || typeof payload.exp !== 'number') return null;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

export async function setAdminSessionCookie(name: string): Promise<void> {
  const token = createSessionToken(name);
  (await cookies()).set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearAdminSessionCookie(): Promise<void> {
  (await cookies()).delete(ADMIN_SESSION_COOKIE);
}

// --- password check ---------------------------------------------------
// timingSafeEqual requires equal-length buffers; hashing both sides to a
// fixed-length digest first is the standard way to compare secrets of
// unknown/unequal length without leaking length via an exception or timing.

export function checkAdminPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = crypto.createHash('sha256').update(input).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

// --- simple in-memory brute-force throttle ----------------------------
// Best-effort only: this Map lives in one serverless instance's memory,
// so it resets on cold start and isn't shared across instances. Good
// enough as a basic speed bump per the task ("простая защита"), not a
// substitute for a real rate limiter backed by shared storage.

interface Attempt {
  count: number;
  firstAttempt: number;
  lockedUntil?: number;
}

const attempts = new Map<string, Attempt>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;

export function checkRateLimit(key: string): { allowed: boolean; retryAfterSec?: number } {
  const entry = attempts.get(key);
  if (!entry) return { allowed: true };
  const now = Date.now();
  if (entry.lockedUntil && now < entry.lockedUntil) {
    return { allowed: false, retryAfterSec: Math.ceil((entry.lockedUntil - now) / 1000) };
  }
  if (now - entry.firstAttempt > WINDOW_MS) {
    attempts.delete(key);
  }
  return { allowed: true };
}

export function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now - entry.firstAttempt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAttempt: now });
    return;
  }
  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_MS;
  }
}

export function clearRateLimit(key: string): void {
  attempts.delete(key);
}
