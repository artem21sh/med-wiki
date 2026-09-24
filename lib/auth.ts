import bcrypt from 'bcrypt';
import { query } from '@/lib/db';

const SALT_ROUNDS = 10;
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  subscription_status: string;
  subscription_until: Date | null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string): Promise<string> {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const rows = await query<{ id: string }>(
    'INSERT INTO sessions (user_id, expires_at) VALUES ($1, $2) RETURNING id',
    [userId, expiresAt]
  );
  return rows[0].id;
}

export async function getSessionUser(sessionId: string): Promise<SessionUser | null> {
  const rows = await query<SessionUser>(
    `SELECT u.id, u.email, u.name, u.subscription_status, u.subscription_until
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = $1 AND s.expires_at > now()`,
    [sessionId]
  );
  return rows[0] ?? null;
}
