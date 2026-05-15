'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Section { title: string; anchor: string; content: string; }

function parseSections(markdown: string): Section[] {
  const lines = markdown.split('\n');
  const sections: Section[] = [];
  let currentSection: Section | null = null;
  let contentLines: string[] = [];
  let preamble: string[] = [];
  let inSection = false;

  for (const line of lines) {
    const isHeader = /^#{1,2}\s+/.test(line);
    if (isHeader) {
      if (currentSection) {
        currentSection.content = contentLines.join('\n').trim();
        sections.push(currentSection);
      } else if (preamble.length > 0) {
        sections.push({ title: '', anchor: 'intro', content: preamble.join('\n').trim() });
      }
      inSection = true;
      const title = line.replace(/^#+\s+/, '').trim();
      const anchor = 'section-' + sections.length;
      currentSection = { title, anchor, content: '' };
      contentLines = [];
    } else if (!inSection) {
      preamble.push(line);
    } else {
      contentLines.push(line);
    }
  }

  if (currentSection) {
    currentSection.content = contentLines.join('\n').trim();
    sections.push(currentSection);
  }

  return sections;
}


function getSnippet(text: string, query: string, radius: number = 120): string {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, radius) + '...';
  const start = Math.max(0, idx - radius / 2);
  const end = Math.min(text.length, idx + query.length + radius / 2);
  const before = start > 0 ? '...' : '';
  const after = end < text.length ? '...' : '';
  const snippet = text.slice(start, end);
  return before + snippet + after;
}

export default function NosologyContent({ markdown }: { markdown: string }) {
  const sections = parseSections(markdown);
  const namedSections = sections.filter(s => s.title);
  const intro = sections.find(s => !s.title);

  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [tocOpen, setTocOpen] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      setOpen(prev => ({ ...prev, [hash]: true }));
      setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, []);
  const [search, setSearch] = useState('');

  const toggleAll = (val: boolean) => {
    const next: Record<string, boolean> = {};
    namedSections.forEach(s => { next[s.anchor] = val; });
    setOpen(next);
  };

  const filtered = namedSections.filter(s =>
    search === '' ||
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.content.toLowerCase().includes(search.toLowerCase())
  );

  const isOpen = (anchor: string) => open[anchor] === true;

  return (
    <div>
      <div className="mb-6 relative">
        <input
          type="text"
          placeholder="Поиск по странице..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
        />
        {search && filtered.length > 0 && (
          <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            {filtered.map(s => (
              <button
                key={s.anchor}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                onClick={() => {
                  setSearch('');
                  setOpen(prev => ({ ...prev, [s.anchor]: true }));
                  setTimeout(() => {
                    document.getElementById(s.anchor)?.scrollIntoView({ behavior: 'smooth' });
                  }, 50);
                }}
              >
                <div className="text-xs font-medium text-blue-500 mb-0.5">{s.title}</div>
                <div className="text-xs text-gray-500">{getSnippet(s.content.replace(/[#*`|]/g, ''), search)}</div>
              </button>
            ))}
          </div>
        )}
        {search && filtered.length === 0 && (
          <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3">
            <span className="text-sm text-gray-400">Ничего не найдено</span>
          </div>
        )}
      </div>

      {search === '' && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl mb-8 overflow-hidden">
          <button
            onClick={() => setTocOpen(prev => !prev)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100 transition-colors"
          >
            <span className="text-sm font-medium text-gray-700">Содержание</span>
            <span className="text-gray-400">{tocOpen ? '−' : '+'}</span>
          </button>
          {tocOpen && (
            <div className="px-4 pb-4">
              <ol className="list-none space-y-1">
                {namedSections.map((s, i) => (
                  <li key={s.anchor}>
                    <button
                      className="text-sm text-blue-600 hover:underline text-left"
                      onClick={() => {
                        setOpen(prev => ({ ...prev, [s.anchor]: true }));
                        setTimeout(() => {
                          document.getElementById(s.anchor)?.scrollIntoView({ behavior: 'smooth' });
                        }, 50);
                      }}
                    >
                      {s.title}
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {intro && search === '' && (
        <div className="prose prose-gray max-w-none mb-6">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{intro.content}</ReactMarkdown>
        </div>
      )}

      <div className="flex justify-end mb-2">
        <button
          onClick={() => toggleAll(!Object.values(open).some(Boolean))}
          className="text-xs text-blue-500 hover:underline"
        >
          {Object.values(open).some(Boolean) ? 'Свернуть все' : 'Развернуть все'}
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {namedSections.map(s => (
          <div key={s.anchor} id={s.anchor} className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => {
                if (search === '') {
                  setOpen(prev => ({ ...prev, [s.anchor]: !prev[s.anchor] }));
                }
              }}
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-semibold text-gray-900">{s.title}</span>
              {search === '' && (
                <span className="text-gray-400 text-lg ml-4">{isOpen(s.anchor) ? '-' : '+'}</span>
              )}
            </button>
            {isOpen(s.anchor) && (
              <div className="px-6 pb-6 border-t border-gray-100 pt-4">
                {search ? (
                  <div>
                    <button
                      className="w-full text-left text-sm text-gray-600 bg-yellow-50 border border-yellow-100 rounded-lg px-4 py-3 hover:bg-yellow-100 transition-colors"
                      onClick={() => {
                        setOpen(prev => ({ ...prev, [s.anchor]: !prev[s.anchor] }));
                        if (!open[s.anchor]) {
                          setTimeout(() => {
                            document.getElementById(s.anchor)?.scrollIntoView({ behavior: 'smooth' });
                          }, 50);
                        }
                      }}
                    >
                      {getSnippet(s.content.replace(/[#*`|]/g, ''), search)}
                      <span className="block text-xs text-blue-500 mt-1">{open[s.anchor] ? 'Свернуть' : 'Открыть раздел →'}</span>
                    </button>
                    {open[s.anchor] && (
                      <div className="prose prose-gray max-w-none mt-4 border-t border-gray-100 pt-4">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{s.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="prose prose-gray max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{s.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>


    </div>
  );
}
