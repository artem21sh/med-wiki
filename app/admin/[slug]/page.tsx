import { redirect, notFound } from 'next/navigation';
import { getAdminSession } from '@/lib/admin-auth';
import { isValidNosologySlug } from '@/lib/nosology-blocks';
import AdminEditor from './AdminEditor';

export default async function AdminNosologyPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  const { slug } = await params;
  if (!isValidNosologySlug(slug)) notFound();

  return <AdminEditor slug={slug} editorName={session.name} />;
}
