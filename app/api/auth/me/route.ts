import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getSessionIdFromCookies, checkDatabaseConfigured, dbErrorResponse } from '../_shared';

export async function GET() {
  const sessionId = await getSessionIdFromCookies();
  if (!sessionId) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const configError = checkDatabaseConfigured();
  if (configError) return configError;

  try {
    const user = await getSessionUser(sessionId);
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    return NextResponse.json(user);
  } catch (error) {
    return dbErrorResponse(error);
  }
}
