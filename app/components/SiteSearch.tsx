'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface SectionRef {
  title: string;
  anchor: string;
}

interface IndexEntry {
  id: string;
  title: string;
  slug: string;
  icd?: string;
  aliases?: string[];
  sections?: SectionRef[];
  content: string;
}

interface ResultItem {
  slug: string;
  title: string;
  // where the link points
  anchor?: string;
  // type of match, drives label + ordering
  kind: 'title' | 'alias' | 'section' | 'content';
  label: string;   // secondary line ("Лечение", "также: гайморит", snippet...)
}

// strip markdown noise from a text fragment
function clean(text: string): string {
  return text.replace(/[#*`|>]/g, '').replace(/\s+/g, ' ').trim();
}

function getContentSnippet(content: string, query: string): { text: string; anchor: string } | null {
  const q = query.toLowerCase();
  const lower = content.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) return null;

  // figure out which section this offset belongs to
  const lines = content.split('\n');
  let pos = 0;
  let secIdx = 0;
  let anchor = '';
  for (const line of lines) {
    const isH1 = /^#\s+/.test(line) && !/^##/.test(line);
    if (isH1) {
      if (pos > idx) break;
      anchor = 'section-' + secIdx;
      secIdx++;
    }
    pos += line.length + 1;
  }

  const start = Math.max(0, idx - 50);
  const end = Math.min(content.length, idx + q.length + 60);
  const snippet =
    (start > 0 ? '...' : '') + clean(content.slice(start, end)) + (end < content.length ? '...' : '');
  return { text: snippet, anchor };
}

export default function SiteSearch() {
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState<IndexEntry[]>([]);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/search-index.json').then(r => r.json()).then(setIndex).catch(() => {});
  }, []);

  useEffect(() => {
    if (query.trim().length < 2 || index.length === 0) {
      setResults([]);
      setOpen(false);
      return;
    }

    const q = query.toLowerCase().trim();
    const words = q.split(/\s+/).filter(Boolean);
    const out: ResultItem[] = [];
    const seen = new Set<string>();

    const pushUnique = (key: string, item: ResultItem) => {
      if (seen.has(key)) return;
      seen.add(key);
      out.push(item);
    };

    for (const e of index) {
      const titleLower = e.title.toLowerCase();
      const aliases = e.aliases || [];
      const sections = e.sections || [];

      // 1) Title match — highest priority
      if (titleLower.includes(q)) {
        pushUnique(`${e.slug}:title`, {
          slug: e.slug,
          title: e.title,
          kind: 'title',
          label: e.icd ? `МКБ ${e.icd}` : '',
        });
        continue;
      }

      const aliasesLower = aliases.map(a => a.toLowerCase());
      // bidirectional partial match to survive russian word endings (синусит ~ синусита)
      const wordMatchesNosology = (w: string) => {
        if (w.length < 4) return false;
        const stem = w.slice(0, Math.max(4, w.length - 2)); // crude stem: drop up to 2 trailing chars
        if (titleLower.includes(stem)) return true;
        return aliasesLower.some(a => a.includes(stem) || stem.includes(a) || a.includes(w) || w.includes(a));
      };

      // 2) Section match — "лечение синусита" → раздел Лечение нозологии Синусит.
      // Checked BEFORE alias so a multi-word query lands on the section, not the page top.
      // Require: at least one word identifies THIS nosology AND a different word matches a section.
      const nosologyWords = words.filter(wordMatchesNosology);
      if (words.length >= 2 && nosologyWords.length > 0) {
        const sectionWords = words.filter(w => !nosologyWords.includes(w) && w.length >= 4);
        const matchedSection = sections.find(s =>
          sectionWords.some(w => {
            const stem = w.slice(0, Math.max(4, w.length - 2));
            return s.title.toLowerCase().includes(stem);
          })
        );
        if (matchedSection) {
          pushUnique(`${e.slug}:sec:${matchedSection.anchor}`, {
            slug: e.slug,
            title: e.title,
            anchor: matchedSection.anchor,
            kind: 'section',
            label: clean(matchedSection.title),
          });
          continue;
        }
      }

      // 3) Alias match — "гайморит" → Острый риносинусит
      const matchedAlias = aliases.find(a => {
        const al = a.toLowerCase();
        return al.includes(q) || q.includes(al);
      });
      if (matchedAlias) {
        pushUnique(`${e.slug}:alias`, {
          slug: e.slug,
          title: e.title,
          kind: 'alias',
          label: `по запросу «${matchedAlias}»`,
        });
        continue;
      }

      // 4) Full-text content match — lowest priority
      const snip = getContentSnippet(e.content, q);
      if (snip) {
        pushUnique(`${e.slug}:content`, {
          slug: e.slug,
          title: e.title,
          anchor: snip.anchor,
          kind: 'content',
          label: snip.text,
        });
      }
    }

    // order by kind priority
    const priority = { title: 0, section: 1, alias: 2, content: 3 };
    out.sort((a, b) => priority[a.kind] - priority[b.kind]);

    setResults(out.slice(0, 10));
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

  const hrefFor = (r: ResultItem) =>
    r.anchor ? `/nosologies/${r.slug}#${r.anchor}` : `/nosologies/${r.slug}`;

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        placeholder="Поиск: название, синоним или «лечение синусита»..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 bg-white"
      />
      {open && results.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-96 overflow-y-auto">
          {results.map((r, i) => (
            <Link
              key={i}
              href={hrefFor(r)}
              className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
              onClick={() => setOpen(false)}
            >
              <div className="text-sm text-gray-900 font-medium mb-0.5 flex items-center gap-2">
                {r.title}
                {r.kind === 'section' && (
                  <span className="text-blue-500 font-normal">→ {r.label}</span>
                )}
              </div>
              {r.kind !== 'section' && r.label && (
                <div className="text-xs text-gray-500">{r.label}</div>
              )}
            </Link>
          ))}
        </div>
      )}
      {open && results.length === 0 && query.trim().length >= 2 && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3">
          <span className="text-sm text-gray-400">Ничего не найдено</span>
        </div>
      )}
    </div>
  );
}
