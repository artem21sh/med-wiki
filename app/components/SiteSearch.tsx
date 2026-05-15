'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface IndexEntry {
  id: string;
  title: string;
  slug: string;
  content: string;
}

interface Result {
  id: string;
  title: string;
  slug: string;
  snippet: string;
}

function getSnippet(text: string, query: string): string {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return '';
  const start = Math.max(0, idx - 60);
  const end = Math.min(text.length, idx + query.length + 60);
  return (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '');
}

export default function SiteSearch() {
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState<IndexEntry[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/search-index.json').then(r => r.json()).then(setIndex).catch(() => {});
  }, []);

  useEffect(() => {
    if (query.length < 2 || index.length === 0) {
      setResults([]);
      setOpen(false);
      return;
    }

    const q = query.toLowerCase();
    const found = index
      .filter(e => e.title.toLowerCase().includes(q) || e.content.toLowerCase().includes(q))
      .slice(0, 8)
      .map(e => ({
        id: e.id,
        title: e.title,
        slug: e.slug,
        snippet: getSnippet(e.content.replace(/[#*`|]/g, ''), query),
      }));

    setResults(found);
    setOpen(true);
  }, [query, index]);

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
      {open && results.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {results.map(r => (
            <Link
              key={r.id}
              href={`/nosologies/${r.slug}`}
              className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
              onClick={() => setOpen(false)}
            >
              <div className="text-sm font-medium text-gray-900">{r.title}</div>
              {r.snippet && (
                <div className="text-xs text-gray-400 mt-0.5 truncate">{r.snippet}</div>
              )}
            </Link>
          ))}
        </div>
      )}
      {open && results.length === 0 && query.length >= 2 && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3">
          <span className="text-sm text-gray-400">Ничего не найдено</span>
        </div>
      )}
    </div>
  );
}
