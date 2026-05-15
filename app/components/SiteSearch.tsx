'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Result {
  id: string;
  title: string;
  slug: string;
}

export default function SiteSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        placeholder="Поиск по всем нозологиям..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 bg-white"
      />
      {loading && (
        <div className="absolute right-4 top-3.5 text-gray-400 text-xs">Поиск...</div>
      )}
      {open && results.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {results.map(r => (
            <Link
              key={r.id}
              href={`/nosologies/${r.slug}`}
              className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
              onClick={() => setOpen(false)}
            >
              <span className="text-sm text-gray-900">{r.title}</span>
            </Link>
          ))}
        </div>
      )}
      {open && results.length === 0 && !loading && query.length >= 2 && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3">
          <span className="text-sm text-gray-400">Ничего не найдено</span>
        </div>
      )}
    </div>
  );
}
