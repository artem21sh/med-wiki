import { getNosologies, getNosologyBySlug } from '@/lib/content';
import NosologyPage from './NosologyPage';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const revalidate = 0;

export async function generateStaticParams() {
  const nosologies = await getNosologies();
  return nosologies.map(n => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const nosology = await getNosologyBySlug(slug);
  if (!nosology) return { title: 'Не найдено' };

  const icdPart = nosology.icd ? ` (МКБ ${nosology.icd})` : '';
  const description = `${nosology.title}${icdPart}: диагностика, классификация, лечение и осложнения. Клинический справочник на русском языке.`;

  return {
    title: nosology.title,
    description,
    keywords: [nosology.title, ...nosology.aliases].slice(0, 15),
    openGraph: {
      title: `${nosology.title} — МедСправочник`,
      description,
      type: 'article',
    },
    alternates: {
      canonical: `https://med-wiki.vercel.app/nosologies/${slug}`,
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const nosology = await getNosologyBySlug(slug);
  if (!nosology) notFound();

  return (
    <NosologyPage
      title={nosology.title}
      content={nosology.content}
      updatedAt={nosology.updatedAt}
    />
  );
}
