import { getNosologies, getNosologyBySlug } from '@/lib/content';
import NosologyPage from './NosologyPage';
import { notFound } from 'next/navigation';

export const revalidate = 0;

export async function generateStaticParams() {
  const nosologies = await getNosologies();
  return nosologies.map(n => ({ slug: n.slug }));
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
