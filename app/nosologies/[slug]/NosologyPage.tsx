'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import NosologyContent from '@/app/components/NosologyContent';
import SideNav, { NavItem } from '@/app/components/SideNav';

type Result = { anchor: string; title: string; snippet: string };

export default function NosologyPage({ title, content, updatedAt }: {
  title: string;
  content: string;
  updatedAt: string;
}) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const openSectionRef = useRef<((anchor: string) => void) | null>(null);

  const handleOpenSection = useCallback((fn: (anchor: string) => void) => {
    openSectionRef.current = fn;
  }, []);

  const handleSections = useCallback((s: NavItem[]) => {
    setNavItems(s);
  }, []);

  const navigateTo = (anchor: string) => {
    openSectionRef.current?.(anchor);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-blue-500 text-sm hover:underline whitespace-nowrap">← Все</Link>
          <span className="text-gray-300">|</span>
          <span className="text-sm font-semibold text-gray-900 truncate hidden sm:block">{title}</span>
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Поиск по странице..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 bg-gray-50"
            />
            {search && results.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50 max-h-80 overflow-y-auto">
                {results.map(r => (
                  <button
                    key={r.anchor}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                    onClick={() => {
                      setSearch('');
                      openSectionRef.current?.(r.anchor);
                    }}
                  >
                    <div className="text-xs font-medium text-blue-500 mb-0.5">{r.title}</div>
                    <div className="text-xs text-gray-500 line-clamp-2">{r.snippet}</div>
                  </button>
                ))}
              </div>
            )}
            {search && results.length === 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 z-50">
                <span className="text-sm text-gray-400">Ничего не найдено</span>
              </div>
            )}
          </div>
          {search && (
            <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Side navigation (desktop only) */}
          {search === '' && (
            <SideNav items={navItems} onNavigate={navigateTo} />
          )}

          {/* Main content */}
          <div className="flex-1 min-w-0 max-w-3xl">
            <h1 className="text-3xl font-semibold text-gray-900 mb-8">{title}</h1>
            <NosologyContent
              markdown={content}
              externalSearch={search}
              onResults={setResults}
              onOpenSection={handleOpenSection}
              onSections={handleSections}
            />
            <p className="text-xs text-gray-400 text-right mt-8">
              Обновлено: {new Date(updatedAt).toLocaleDateString('ru-RU')}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
