'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

interface SubSection {
  title: string;
  anchor: string;
  content: string;
}

interface Section {
  title: string;
  anchor: string;
  content: string;
  subsections: SubSection[];
}

function parseSections(markdown: string): Section[] {
  if (!markdown) return [];

  const lines = markdown.split('\n');
  const sections: Section[] = [];
  let currentSection: Section | null = null;
  let currentSubSection: SubSection | null = null;
  let contentLines: string[] = [];
  let preamble: string[] = [];
  let inSection = false;

  const flushSubSection = () => {
    if (currentSubSection && currentSection) {
      currentSubSection.content = contentLines.join('\n').trim();
      currentSection.subsections.push(currentSubSection);
      currentSubSection = null;
      contentLines = [];
    }
  };

  const flushSection = () => {
    if (currentSection) {
      if (currentSubSection) {
        flushSubSection();
      } else {
        currentSection.content = contentLines.join('\n').trim();
        contentLines = [];
      }
      sections.push(currentSection);
      currentSection = null;
    } else if (preamble.length > 0) {
      sections.push({ title: '', anchor: 'intro', content: preamble.join('\n').trim(), subsections: [] });
    }
  };

  for (const line of lines) {
    const isH1 = /^#\s+/.test(line) && !/^##/.test(line);
    const isH2 = /^##\s+/.test(line);

    if (isH1) {
      flushSection();
      inSection = true;
      const title = line.replace(/^#+\s+/, '').trim();
      const anchor = 'section-' + sections.length;
      currentSection = { title, anchor, content: '', subsections: [] };
      contentLines = [];
    } else if (isH2 && currentSection) {
      if (currentSubSection) {
        flushSubSection();
      } else {
        currentSection.content = contentLines.join('\n').trim();
        contentLines = [];
      }
      const title = line.replace(/^#+\s+/, '').trim();
      const anchor = 'subsection-' + sections.length + '-' + currentSection.subsections.length;
      currentSubSection = { title, anchor, content: '' };
    } else if (!inSection) {
      preamble.push(line);
    } else {
      contentLines.push(line);
    }
  }

  flushSection();
  return sections;
}

function getSnippet(text: string, query: string, radius: number = 120): string {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, radius) + '...';
  const start = Math.max(0, idx - radius / 2);
  const end = Math.min(text.length, idx + query.length + radius / 2);
  return (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '');
}

const MD_COMPONENTS = {
  pre: ({ node, ...props }: any) => <div {...props} />,
  code: ({ node, inline, ...props }: any) => <span {...props} />,
};

function SubSectionBlock({
  sub,
  forceOpen = false,
}: {
  sub: SubSection;
  forceOpen?: boolean;
}) {
  const [open, setOpen] = useState(forceOpen);

  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  return (
    <div id={sub.anchor} className="border border-gray-100 rounded-lg overflow-hidden mt-2">
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-800 text-sm">{sub.title}</span>
        <span className="text-gray-400 ml-4">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
          <div className="prose prose-gray max-w-none prose-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={MD_COMPONENTS}>
              {sub.content}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NosologyContent({
  markdown,
  externalSearch = '',
  onResults,
  onOpenSection,
}: {
  markdown: string;
  externalSearch?: string;
  onResults?: (r: { anchor: string; title: string; snippet: string }[]) => void;
  onOpenSection?: (fn: (anchor: string) => void) => void;
}) {
  const sections = parseSections(markdown);
  const namedSections = sections.filter(s => s.title);
  const intro = sections.find(s => !s.title);

  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [openSubs, setOpenSubs] = useState<Record<string, boolean>>({});
  const [tocOpen, setTocOpen] = useState(false);
  const search = externalSearch;

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      setOpen(prev => ({ ...prev, [hash]: true }));
      setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, []);

  useEffect(() => {
    if (onOpenSection) {
      onOpenSection((anchor: string) => {
        // anchor could be a section or subsection
        setOpen(prev => ({ ...prev, [anchor]: true }));
        // also open parent section if it's a subsection
        namedSections.forEach(s => {
          s.subsections.forEach(sub => {
            if (sub.anchor === anchor) {
              setOpen(prev => ({ ...prev, [s.anchor]: true }));
              setOpenSubs(prev => ({ ...prev, [sub.anchor]: true }));
            }
          });
        });
        setTimeout(() => {
          document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
      });
    }
  }, [onOpenSection]);

  useEffect(() => {
    if (!onResults) return;
    if (!search) { onResults([]); return; }
    const q = search.toLowerCase();
    const res: { anchor: string; title: string; snippet: string }[] = [];

    namedSections.forEach(s => {
      const sectionAllText = s.content + ' ' + s.subsections.map(sub => sub.title + ' ' + sub.content).join(' ');
      if (s.title.toLowerCase().includes(q) || sectionAllText.toLowerCase().includes(q)) {
        // Check if match is in a subsection
        let matchAnchor = s.anchor;
        let matchTitle = s.title;
        let matchSnippet = '';

        s.subsections.forEach(sub => {
          const subText = sub.title + ' ' + sub.content;
          if (sub.title.toLowerCase().includes(q) || sub.content.toLowerCase().includes(q)) {
            matchAnchor = sub.anchor;
            matchTitle = s.title + ' → ' + sub.title;
            matchSnippet = getSnippet(subText.replace(/[#*`|]/g, ''), search);
          }
        });

        if (!matchSnippet) {
          matchSnippet = getSnippet(sectionAllText.replace(/[#*`|]/g, ''), search);
        }

        res.push({ anchor: matchAnchor, title: matchTitle, snippet: matchSnippet });
      }
    });

    onResults(res);
  }, [search, onResults]);

  const toggleAll = (val: boolean) => {
    const next: Record<string, boolean> = {};
    namedSections.forEach(s => { next[s.anchor] = val; });
    setOpen(next);
  };

  const isOpen = (anchor: string) => open[anchor] === true;

  return (
    <div>
      <div className="mb-6 relative" />

      {intro && search === '' && (
        <div className="prose prose-gray max-w-none mb-6">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={MD_COMPONENTS}>
            {intro.content}
          </ReactMarkdown>
        </div>
      )}

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
                {namedSections.map(s => (
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
                    {s.subsections.length > 0 && (
                      <ol className="list-none pl-4 mt-1 space-y-1">
                        {s.subsections.map(sub => (
                          <li key={sub.anchor}>
                            <button
                              className="text-xs text-blue-500 hover:underline text-left"
                              onClick={() => {
                                setOpen(prev => ({ ...prev, [s.anchor]: true }));
                                setOpenSubs(prev => ({ ...prev, [sub.anchor]: true }));
                                setTimeout(() => {
                                  document.getElementById(sub.anchor)?.scrollIntoView({ behavior: 'smooth' });
                                }, 50);
                              }}
                            >
                              {sub.title}
                            </button>
                          </li>
                        ))}
                      </ol>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}
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
              onClick={() => setOpen(prev => ({ ...prev, [s.anchor]: !prev[s.anchor] }))}
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-semibold text-gray-900">{s.title}</span>
              <span className="text-gray-400 text-lg ml-4">{isOpen(s.anchor) ? '−' : '+'}</span>
            </button>

            {isOpen(s.anchor) && (
              <div className="px-6 pb-6 border-t border-gray-100 pt-4">
                {s.content && (
                  <div className="prose prose-gray max-w-none mb-2">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={MD_COMPONENTS}>
                      {s.content}
                    </ReactMarkdown>
                  </div>
                )}
                {s.subsections.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1">
                    {s.subsections.map(sub => (
                      <SubSectionBlock
                        key={sub.anchor}
                        sub={sub}
                        forceOpen={openSubs[sub.anchor] === true}
                      />
                    ))}
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
