'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function parseSections(markdown: string) {
  const lines = markdown.split('\n');
  const sections = [];
  let currentSection = null;
  let contentLines = [];
  let preamble = [];
  let inSection = false;

  for (const line of lines) {
    const isHeader = /^#{1,2}\s+\d+/.test(line);
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

function highlight(text, query) {
  if (!query) return text;
  const parts = text.split(new RegExp('(' + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? '<mark style="background:#fef08a;border-radius:2px;padding:0 2px">' + part + '</mark>'
      : part
  ).join('');
}

export default function NosologyContent({ markdown }: { markdown: string }) {
  const sections = parseSections(markdown);
  const namedSections = sections.filter(s => s.title);
  const intro = sections.find(s => !s.title);

  const [open, setOpen] = useState({});
  const [search, setSearch] = useState('');

  const toggleAll = (val) => {
    const next = {};
    namedSections.forEach(s => { next[s.anchor] = val; });
    setOpen(next);
  };

  const filtered = search === ''
    ? namedSections
    : namedSections.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.content.toLowerCase().includes(search.toLowerCase())
      );

  const isOpen = (anchor) => {
    if (search !== '') return true;
    return open[anchor] === true;
  };

  return (
    <div>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Поиск по странице..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
        />
        {search && (
          <p className="text-xs text-gray-400 mt-2">
            Найдено разделов: {filtered.length}
          </p>
        )}
      </div>

      {search === '' && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Содержание</span>
            <div className="flex gap-3 text-xs text-blue-500">
              <button onClick={() => toggleAll(true)} className="hover:underline">развернуть все</button>
              <button onClick={() => toggleAll(false)} className="hover:underline">свернуть все</button>
            </div>
          </div>
          <ol className="list-none space-y-1">
            {namedSections.map((s, i) => (
              <li key={s.anchor}>
                <a
                  href={'#' + s.anchor}
                  className="text-sm text-blue-600 hover:underline"
                  onClick={e => {
                    e.preventDefault();
                    setOpen(prev => ({ ...prev, [s.anchor]: true }));
                    setTimeout(() => {
                      document.getElementById(s.anchor)?.scrollIntoView({ behavior: 'smooth' });
                    }, 50);
                  }}
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </div>
      )}

      {intro && search === '' && (
        <div className="prose prose-gray max-w-none mb-6">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{intro.content}</ReactMarkdown>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {filtered.map(s => (
          <div key={s.anchor} id={s.anchor} className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => {
                if (search === '') {
                  setOpen(prev => ({ ...prev, [s.anchor]: !prev[s.anchor] }));
                }
              }}
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <span
                className="font-semibold text-gray-900"
                dangerouslySetInnerHTML={{ __html: highlight(s.title, search) }}
              />
              {search === '' && (
                <span className="text-gray-400 text-lg ml-4">{isOpen(s.anchor) ? '-' : '+'}</span>
              )}
            </button>
            {isOpen(s.anchor) && (
              <div className="px-6 pb-6 border-t border-gray-100 pt-4">
                {search ? (
                  <div
                    className="prose prose-gray max-w-none"
                    dangerouslySetInnerHTML={{ __html: highlight(s.content.replace(/[<>]/g, c => c === '<' ? '&lt;' : '&gt;'), search) }}
                  />
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

      {filtered.length === 0 && search !== '' && (
        <p className="text-gray-400 text-center py-12">Ничего не найдено по запросу {search}</p>
      )}
    </div>
  );
}