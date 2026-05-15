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
  snippets: Snippet[];
}

interface Snippet { text: string; section: string; anchor: string; }

function getAllSnippets(content: string, query: string): Snippet[] {
  const lines = content.split('\n');
  const q = query.toLowerCase();
  const snippets: Snippet[] = [];
  let currentSection = '';
  let currentAnchor = '';
  let sectionIndex = 0;
  let fullText = '';
  let sectionStart = 0;

  for (const line of lines) {
    const isHeader = /^#{1,2}\s+\d+/.test(line);
    if (isHeader) {
      currentSection = line.replace(/^#+\s+/, '').trim();
      currentAnchor = 'section-' + sectionIndex;
      sectionIndex++;
      sectionStart = fullText.length;
    }
    fullText += line + '\n';
  }

  const lower = fullText.toLowerCase();
  let pos = 0;
  let secIdx = 0;
  const headers: { title: string; anchor: string; pos: number }[] = [];

  for (const line of content.split('\n')) {
    if (/^#{1,2}\s+\d+/.test(line)) {
      headers.push({
        title: line.replace(/^#+\s+/, '').trim(),
        anchor: 'section-' + secIdx,
        pos,
      });
      secIdx++;
    }
    pos += line.length + 1;
  }

  pos = 0;
  while (true) {
    const idx = lower.indexOf(q, pos);
    if (idx === -1) break;
    const start = Math.max(0, idx - 60);
    const end = Math.min(fullText.length, idx + q.length + 60);
    const snippet = (start > 0 ? '...' : '') + fullText.slice(start, end).replace(/[#*`|]/g, '') + (end < fullText.length ? '...' : '');

    let sec = { title: '', anchor: '' };
    for (const h of headers) {
      if (h.pos <= idx) sec = h;
    }

    snippets.push({ text: snippet, section: sec.title, anchor: sec.anchor });
    pos = idx + q.length;
  }
  return snippets;
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
        snippets: getAllSnippets(e.content, query),
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
            <div key={r.id}>
              {r.snippets.map((s, i) => (
                <Link
                  key={i}
                  href={`/nosologies/${r.slug}#${s.anchor}`}
                  className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                  onClick={() => setOpen(false)}
                >
                  <div className="text-xs text-blue-500 font-medium mb-0.5">{r.title}{s.section ? ` — ${s.section}` : ''}</div>
                  <div className="text-xs text-gray-500">{s.text}</div>
                </Link>
              ))}
            </div>
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
