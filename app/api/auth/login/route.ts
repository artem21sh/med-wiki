import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyPassword, createSession } from '@/lib/auth';
import { normalizeEmail, setSessionCookie, checkDatabaseConfigured, dbErrorResponse } from '../_shared';

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  password_hash: string;
}

const INVALID_CREDENTIALS_MESSAGE = 'Неверный email или пароль';

export async function POST(request: NextRequest) {
  const configError = checkDatabaseConfigured();
  if (configError) return configError;

  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Некорректное тело запроса' }, { status: 400 });
  }

  const { email, password } = body;

  if (typeof email !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: INVALID_CREDENTIALS_MESSAGE }, { status: 401 });
  }

  try {
    const rows = await query<UserRow>(
      'SELECT id, email, name, password_hash FROM users WHERE email = $1',
      [normalizeEmail(email)]
    );
    const user = rows[0];
    if (!user) {
      return NextResponse.json({ error: INVALID_CREDENTIALS_MESSAGE }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: INVALID_CREDENTIALS_MESSAGE }, { status: 401 });
    }

    const sessionId = await createSession(user.id);
    await setSessionCookie(sessionId);

    return NextResponse.json({ id: user.id, email: user.email, name: user.name });
  } catch (error) {
    return dbErrorResponse(error);
  }
}
