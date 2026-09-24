'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface MeResponse {
  id: string;
  email: string;
  name: string | null;
  subscription_status: string;
  subscription_until: string | null;
  created_at: string;
}

const SUBSCRIPTION_LABELS: Record<string, string> = {
  free: 'Бесплатный доступ',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) {
          router.replace('/login');
          return;
        }
        const data: MeResponse = await res.json();
        if (!cancelled) {
          setUser(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) router.replace('/login');
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } finally {
      router.push('/');
    }
  };

  if (loading || !user) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto px-4 py-16" />
      </main>
    );
  }

  const subscriptionLabel = SUBSCRIPTION_LABELS[user.subscription_status] ?? user.subscription_status;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Профиль</h1>
          <div className="flex flex-col gap-4">
            <div>
              <span className="block text-sm text-gray-500 mb-0.5">Email</span>
              <span className="block text-gray-900 font-medium">{user.email}</span>
            </div>
            {user.name && (
              <div>
                <span className="block text-sm text-gray-500 mb-0.5">Имя</span>
                <span className="block text-gray-900 font-medium">{user.name}</span>
              </div>
            )}
            <div>
              <span className="block text-sm text-gray-500 mb-0.5">Дата регистрации</span>
              <span className="block text-gray-900 font-medium">{formatDate(user.created_at)}</span>
            </div>
            <div>
              <span className="block text-sm text-gray-500 mb-0.5">Подписка</span>
              <span className="block text-gray-900 font-medium">{subscriptionLabel}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full mt-8 border border-gray-300 text-gray-700 font-medium rounded-lg py-2.5 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {loggingOut ? 'Выход...' : 'Выйти'}
          </button>
        </div>
      </div>
    </main>
  );
}
