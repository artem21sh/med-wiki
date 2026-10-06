import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/admin-auth';
import { getNosologies } from '@/lib/content';
import AdminLogoutButton from './AdminLogoutButton';

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  const nosologies = await getNosologies();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-1">Админка</h1>
            <p className="text-gray-500 text-sm">Вы вошли как {session.name}</p>
          </div>
          <AdminLogoutButton />
        </div>
        <div className="flex flex-col gap-3">
          {nosologies.map((n) => (
            <Link
              key={n.slug}
              href={`/admin/${n.slug}`}
              className="bg-white border border-gray-200 rounded-xl px-6 py-4 hover:border-blue-300 hover:shadow-sm transition-all flex items-center justify-between"
            >
              <div>
                <div className="text-gray-900 font-medium">{n.title}</div>
                <div className="text-sm text-gray-500">
                  {n.slug}
                  {n.icd && ` · МКБ ${n.icd}`}
                </div>
              </div>
              <span className="text-gray-400 text-sm shrink-0 ml-4">→</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
