'use client';

import { useEffect, useState, type ComponentPropsWithoutRef } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

interface Frontmatter {
  title: string;
  icd: string;
  aliases: string;
}

interface Block {
  id: string;
  title: string;
  content: string;
}

interface NosologyData {
  sha: string;
  frontmatter: Frontmatter;
  blocks: Block[];
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const MD_COMPONENTS = {
  pre: (props: ComponentPropsWithoutRef<'pre'>) => <div {...(props as ComponentPropsWithoutRef<'div'>)} />,
  code: ({ inline, ...props }: ComponentPropsWithoutRef<'code'> & { inline?: boolean }) => (
    <span {...(props as ComponentPropsWithoutRef<'span'>)} />
  ),
  table: (props: ComponentPropsWithoutRef<'table'>) => (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%' }}>
      <table {...props} />
    </div>
  ),
};

function SaveStatus({ state, error }: { state: SaveState; error: string | null }) {
  if (state === 'saving') return <p className="text-sm text-gray-500 mt-2">Сохранение…</p>;
  if (state === 'saved') {
    return <p className="text-sm text-green-600 mt-2">Сохранено ✓ (сайт обновится через 1–2 минуты)</p>;
  }
  if (state === 'error') return <p className="text-sm text-red-600 mt-2">{error}</p>;
  return null;
}

export default function AdminEditor({ slug, editorName }: { slug: string; editorName: string }) {
  const [data, setData] = useState<NosologyData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [fmDraft, setFmDraft] = useState<Frontmatter>({ title: '', icd: '', aliases: '' });
  const [fmState, setFmState] = useState<SaveState>('idle');
  const [fmError, setFmError] = useState<string | null>(null);

  const [openBlocks, setOpenBlocks] = useState<Record<string, boolean>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [previewOn, setPreviewOn] = useState<Record<string, boolean>>({});
  const [blockStates, setBlockStates] = useState<Record<string, SaveState>>({});
  const [blockErrors, setBlockErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/nosologies/${slug}`, { credentials: 'include' })
      .then(async (res) => {
        if (res.status === 401) {
          window.location.href = '/admin/login';
          return;
        }
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setLoadError(json.error || 'Не удалось загрузить файл');
          return;
        }
        setData(json);
        setFmDraft(json.frontmatter);
        const d: Record<string, string> = {};
        (json.blocks as Block[]).forEach((b) => {
          d[b.id] = b.content;
        });
        setDrafts(d);
      })
      .catch(() => {
        if (!cancelled) setLoadError('Не удалось загрузить файл. Проверьте соединение.');
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const saveFrontmatter = async () => {
    if (!data) return;
    if (!fmDraft.title.trim()) {
      setFmState('error');
      setFmError('Название не может быть пустым');
      return;
    }
    setFmState('saving');
    setFmError(null);
    try {
      const res = await fetch(`/api/admin/nosologies/${slug}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sha: data.sha, type: 'frontmatter', ...fmDraft }),
      });
      const json = await res.json();
      if (res.status === 409) {
        setFmState('error');
        setFmError('Файл изменился, обновите страницу');
        return;
      }
      if (!res.ok) {
        setFmState('error');
        setFmError(json.error || 'Не удалось сохранить');
        return;
      }
      setData((prev) => (prev ? { ...prev, sha: json.sha } : prev));
      setFmState('saved');
    } catch {
      setFmState('error');
      setFmError('Ошибка сети');
    }
  };

  const saveBlock = async (blockId: string) => {
    if (!data) return;
    const content = drafts[blockId] ?? '';
    if (blockId !== 'intro' && !content.trim()) {
      setBlockStates((p) => ({ ...p, [blockId]: 'error' }));
      setBlockErrors((p) => ({ ...p, [blockId]: 'Раздел нельзя сохранить пустым' }));
      return;
    }
    setBlockStates((p) => ({ ...p, [blockId]: 'saving' }));
    setBlockErrors((p) => ({ ...p, [blockId]: '' }));
    try {
      const res = await fetch(`/api/admin/nosologies/${slug}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sha: data.sha, type: 'block', blockId, content }),
      });
      const json = await res.json();
      if (res.status === 409) {
        setBlockStates((p) => ({ ...p, [blockId]: 'error' }));
        setBlockErrors((p) => ({ ...p, [blockId]: 'Файл изменился, обновите страницу' }));
        return;
      }
      if (!res.ok) {
        setBlockStates((p) => ({ ...p, [blockId]: 'error' }));
        setBlockErrors((p) => ({ ...p, [blockId]: json.error || 'Не удалось сохранить' }));
        return;
      }
      setData((prev) => (prev ? { ...prev, sha: json.sha } : prev));
      setBlockStates((p) => ({ ...p, [blockId]: 'saved' }));
    } catch {
      setBlockStates((p) => ({ ...p, [blockId]: 'error' }));
      setBlockErrors((p) => ({ ...p, [blockId]: 'Ошибка сети' }));
    }
  };

  if (loadError) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <Link href="/admin" className="text-blue-500 text-sm hover:underline whitespace-nowrap">
            ← Все нозологии
          </Link>
          <p className="text-sm text-red-600 mt-4">{loadError}</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <p className="text-gray-400 text-sm">Загрузка…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/admin" className="text-blue-500 text-sm hover:underline whitespace-nowrap">
          ← Все нозологии
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 mt-4 mb-1">{fmDraft.title || slug}</h1>
        <p className="text-gray-500 text-sm mb-8">Редактирует: {editorName}</p>

        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Основная информация</h2>
          <div className="flex flex-col gap-4">
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">Название</span>
              <input
                type="text"
                value={fmDraft.title}
                onChange={(e) => setFmDraft((p) => ({ ...p, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base text-gray-900 font-medium focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">МКБ</span>
              <input
                type="text"
                value={fmDraft.icd}
                onChange={(e) => setFmDraft((p) => ({ ...p, icd: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base text-gray-900 font-medium focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">Поисковые синонимы (через запятую)</span>
              <textarea
                value={fmDraft.aliases}
                onChange={(e) => setFmDraft((p) => ({ ...p, aliases: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base text-gray-900 font-medium focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              />
            </label>
          </div>
          <button
            onClick={saveFrontmatter}
            disabled={fmState === 'saving'}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg px-5 py-2 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {fmState === 'saving' ? 'Сохранение…' : 'Сохранить'}
          </button>
          <SaveStatus state={fmState} error={fmError} />
        </div>

        <div className="flex flex-col gap-3">
          {data.blocks.map((block) => {
            const isOpen = openBlocks[block.id] === true;
            const label = block.id === 'intro' ? 'Вводная часть' : block.title || block.id;
            const preview = previewOn[block.id] === true;
            const state = blockStates[block.id] ?? 'idle';

            return (
              <div key={block.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenBlocks((p) => ({ ...p, [block.id]: !p[block.id] }))}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900">{label}</span>
                  <span className="text-gray-400 text-lg ml-4">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 border-t border-gray-100 pt-4">
                    <div className="mb-3 inline-flex rounded-lg border border-gray-300 p-0.5 bg-gray-50">
                      <button
                        type="button"
                        onClick={() => setPreviewOn((p) => ({ ...p, [block.id]: false }))}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${
                          !preview ? 'bg-white text-blue-600 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Редактор
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewOn((p) => ({ ...p, [block.id]: true }))}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${
                          preview ? 'bg-white text-blue-600 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Предпросмотр
                      </button>
                    </div>

                    {preview ? (
                      <div className="prose prose-gray max-w-none prose-sm border border-gray-100 rounded-lg px-4 py-3 min-h-[12rem]">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={MD_COMPONENTS}>
                          {drafts[block.id] ?? ''}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <textarea
                        value={drafts[block.id] ?? ''}
                        onChange={(e) => setDrafts((p) => ({ ...p, [block.id]: e.target.value }))}
                        rows={16}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 font-mono focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                      />
                    )}

                    <button
                      onClick={() => saveBlock(block.id)}
                      disabled={state === 'saving'}
                      className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg px-5 py-2 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {state === 'saving' ? 'Сохранение…' : 'Сохранить'}
                    </button>
                    <SaveStatus state={state} error={blockErrors[block.id] ?? null} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
