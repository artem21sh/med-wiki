import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword, createSession } from '@/lib/auth';
import {
  isValidEmail,
  normalizeEmail,
  setSessionCookie,
  checkDatabaseConfigured,
  dbErrorResponse,
} from '../_shared';

interface UserRow {
  id: string;
  email: string;
  name: string | null;
}

export async function POST(request: NextRequest) {
  const configError = checkDatabaseConfigured();
  if (configError) return configError;

  let body: { email?: unknown; password?: unknown; name?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Некорректное тело запроса' }, { status: 400 });
  }

  const { email, password, name } = body;

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Некорректный email' }, { status: 400 });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return NextResponse.json({ error: 'Пароль должен содержать минимум 8 символов' }, { status: 400 });
  }

  const normalizedEmail = normalizeEmail(email);
  const normalizedName = typeof name === 'string' && name.trim() ? name.trim() : null;

  try {
    const existing = await query<{ id: string }>('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Этот email уже зарегистрирован' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const inserted = await query<UserRow>(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name`,
      [normalizedEmail, passwordHash, normalizedName]
    );
    const user = inserted[0];

    const sessionId = await createSession(user.id);
    await setSessionCookie(sessionId);

    return NextResponse.json({ id: user.id, email: user.email, name: user.name });
  } catch (error: unknown) {
    // Unique violation — a concurrent request won the race against the
    // SELECT check above.
    if ((error as { code?: string })?.code === '23505') {
      return NextResponse.json({ error: 'Этот email уже зарегистрирован' }, { status: 409 });
    }
    return dbErrorResponse(error);
  }
}
