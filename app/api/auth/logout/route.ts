import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionIdFromCookies, clearSessionCookie, checkDatabaseConfigured, dbErrorResponse } from '../_shared';

export async function POST() {
  const sessionId = await getSessionIdFromCookies();
  if (!sessionId) {
    return NextResponse.json({ ok: true });
  }

  const configError = checkDatabaseConfigured();
  if (configError) {
    await clearSessionCookie();
    return configError;
  }

  try {
    await query('DELETE FROM sessions WHERE id = $1', [sessionId]);
  } catch (error) {
    await clearSessionCookie();
    return dbErrorResponse(error);
  }

  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
