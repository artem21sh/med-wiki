import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const contentDir = path.join(process.cwd(), 'content/nosologies');

export interface Nosology {
  id: string;
  slug: string;
  title: string;
  content: string;
  updatedAt: string;
}

export async function getNosologies(): Promise<Nosology[]> {
  if (!fs.existsSync(contentDir)) return [];
  const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.md'));
  return files.map(file => {
    const slug = file.replace('.md', '');
    const filePath = path.join(contentDir, file);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(raw);
    const stats = fs.statSync(filePath);
    return {
      id: slug,
      slug,
      title: data.title || slug,
      content,
      updatedAt: data.updatedAt || stats.mtime.toISOString(),
    };
  })
  .filter(n => n.title && n.title !== n.slug)
  .sort((a, b) => a.title.localeCompare(b.title, 'ru'));
}

export async function getNosologyBySlug(slug: string): Promise<Nosology | null> {
  const filePath = path.join(contentDir, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);
  const stats = fs.statSync(filePath);
  return {
    id: slug,
    slug,
    title: data.title || slug,
    content,
    updatedAt: data.updatedAt || stats.mtime.toISOString(),
  };
}
