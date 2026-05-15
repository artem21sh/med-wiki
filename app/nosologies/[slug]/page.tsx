import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getNosologies, getNosologyById } from '@/lib/notion';

export const revalidate = 60;

export async function generateStaticParams() {
  const nosologies = await getNosologies();
  return nosologies.map((n) => ({ slug: n.slug }));
}

export default async function NosologyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const nosology = await getNosologyById(slug);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/" className="text-blue-500 text-sm hover:underline mb-8 block">
          ← Все нозологии
        </Link>
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">{nosology.title}</h1>
        {nosology.tags.length > 0 && (
          <div className="flex gap-2 mb-8">
            {nosology.tags.map((tag: string) => (
              <span key={tag} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="bg-white border border-gray-200 rounded-xl px-8 py-8 prose prose-gray max-w-none overflow-x-auto">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{nosology.markdown}</ReactMarkdown>
        </div>
        <p className="text-gray-400 text-xs mt-6 text-right">
          Обновлено: {new Date(nosology.lastEdited).toLocaleDateString('ru-RU')}
        </p>
      </div>
    </main>
  );
}
