import { getNosologies, getNosologyBySlug } from '@/lib/content';
import NosologyContent from '@/app/components/NosologyContent';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const revalidate = 0;

export async function generateStaticParams() {
  const nosologies = await getNosologies();
  return nosologies.map(n => ({ slug: n.slug }));
}

export default async function NosologyPage({ params }: { params: { slug: string } }) {
  const nosology = await getNosologyBySlug(params.slug);
  if (!nosology) notFound();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/" className="text-blue-500 text-sm hover:underline mb-6 block">← Все нозологии</Link>
        <h1 className="text-3xl font-semibold text-gray-900 mb-8">{nosology.title}</h1>
        <NosologyContent content={nosology.content} />
        <p className="text-xs text-gray-400 text-right mt-8">
          Обновлено: {new Date(nosology.updatedAt).toLocaleDateString('ru-RU')}
        </p>
      </div>
    </main>
  );
}
