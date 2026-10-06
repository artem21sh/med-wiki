import { NextRequest, NextResponse } from 'next/server';
import {
  checkAdminPassword,
  setAdminSessionCookie,
  checkRateLimit,
  recordFailedAttempt,
  clearRateLimit,
} from '@/lib/admin-auth';

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  const rate = checkRateLimit(ip);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `Слишком много попыток. Попробуйте через ${Math.ceil((rate.retryAfterSec ?? 60) / 60)} мин.` },
      { status: 429 }
    );
  }

  let body: { name?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Некорректное тело запроса' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!name) {
    return NextResponse.json({ error: 'Укажите ваше имя' }, { status: 400 });
  }
  if (!password) {
    return NextResponse.json({ error: 'Введите пароль' }, { status: 400 });
  }

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: 'Вход недоступен: пароль администратора не настроен на сервере' },
      { status: 500 }
    );
  }

  if (!checkAdminPassword(password)) {
    recordFailedAttempt(ip);
    await sleep(800 + Math.random() * 400);
    return NextResponse.json({ error: 'Неверный пароль' }, { status: 401 });
  }

  clearRateLimit(ip);
  await setAdminSessionCookie(name);
  return NextResponse.json({ ok: true, name });
}
