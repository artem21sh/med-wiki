'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Не удалось зарегистрироваться');
        setLoading(false);
        return;
      }
      router.push('/');
    } catch {
      setError('Не удалось зарегистрироваться. Проверьте соединение.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Регистрация</h1>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base text-gray-900 font-medium placeholder:text-gray-300 placeholder:font-normal focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">Имя (необязательно)</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ваше имя"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base text-gray-900 font-medium placeholder:text-gray-300 placeholder:font-normal focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">Пароль</span>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base text-gray-900 font-medium placeholder:text-gray-300 placeholder:font-normal focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              />
              <span className="block text-xs text-gray-400 mt-1">Минимум 8 символов</span>
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Создание...' : 'Создать аккаунт'}
            </button>
          </form>
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
          <p className="text-sm text-gray-500 text-center mt-6">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="text-blue-500 hover:underline font-medium">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
