import Link from 'next/link';
import { getNosologies } from '@/lib/notion';
import SiteSearch from '@/app/components/SiteSearch';

export const revalidate = 60;

export default async function Home() {
  const nosologies = await getNosologies();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">МедСправочник</h1>
          <p className="text-gray-500 mb-6">База знаний нозологий</p>
          <SiteSearch />
        </div>

        <div className="flex flex-col gap-3">
          {nosologies.map((item) => (
            <Link
              key={item.id}
              href={`/nosologies/${item.slug}`}
              className="bg-white border border-gray-200 rounded-xl px-6 py-4 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-gray-900 font-medium">{item.title}</span>
                <span className="text-gray-400 text-sm">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
