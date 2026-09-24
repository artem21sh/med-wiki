'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface MeResponse {
  email: string;
  name: string | null;
}

type Status = 'loading' | 'guest' | MeResponse;

export default function AuthStatus() {
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) {
          if (!cancelled) setStatus('guest');
          return;
        }
        const data: MeResponse = await res.json();
        if (!cancelled) setStatus({ email: data.email, name: data.name });
      })
      .catch(() => {
        if (!cancelled) setStatus('guest');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'loading') {
    return <span className="inline-block w-16 h-5" aria-hidden="true" />;
  }

  if (status === 'guest') {
    return (
      <Link href="/login" className="text-blue-500 text-sm font-medium hover:underline whitespace-nowrap">
        Войти
      </Link>
    );
  }

  return (
    <Link href="/profile" className="text-gray-700 text-sm font-medium hover:text-blue-500 whitespace-nowrap">
      {status.name || status.email}
    </Link>
  );
}
