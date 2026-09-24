import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_TTL_MS } from '@/lib/auth';

export const SESSION_COOKIE = 'session';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: unknown): email is string {
  return typeof email === 'string' && EMAIL_REGEX.test(email);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function setSessionCookie(sessionId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionIdFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

// The Yandex Cloud Postgres instance isn't reachable yet (account pending
// approval), so this surfaces a clear 500 instead of an unhandled throw
// whenever DATABASE_URL hasn't been configured.
export function checkDatabaseConfigured(): NextResponse | null {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: 'База данных временно недоступна: DATABASE_URL не настроен.' },
      { status: 500 }
    );
  }
  return null;
}

export function dbErrorResponse(error: unknown): NextResponse {
  console.error('Database error:', error);
  return NextResponse.json(
    { error: 'База данных временно недоступна. Попробуйте позже.' },
    { status: 500 }
  );
}
