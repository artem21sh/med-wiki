import fs from 'fs';
import path from 'path';

const contentDir = path.join(process.cwd(), 'content/nosologies');

export interface Nosology {
  id: string;
  slug: string;
  title: string;
  content: string;
  updatedAt: string;
}

function parseFrontmatter(raw: string): { data: Record<string, string>; content: string } {
  const lines = raw.split('\n');
  if (lines[0].trim() !== '---') return { data: {}, content: raw };
  let endIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') { endIdx = i; break; }
  }
  if (endIdx === -1) return { data: {}, content: raw };
  const data: Record<string, string> = {};
  for (let i = 1; i < endIdx; i++) {
    const colon = lines[i].indexOf(':');
    if (colon === -1) continue;
    const key = lines[i].slice(0, colon).trim();
    const value = lines[i].slice(colon + 1).trim().replace(/^["\'"]|["\'"]$/g, '');
    data[key] = value;
  }
  const content = lines.slice(endIdx + 1).join('\n').trim();
  return { data, content };
}

export async function getNosologies(): Promise<Nosology[]> {
  if (!fs.existsSync(contentDir)) return [];
  const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.md'));
  return files.map(file => {
    const slug = file.replace('.md', '');
    const filePath = path.join(contentDir, file);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = parseFrontmatter(raw);
    const stats = fs.statSync(filePath);
    return {
      id: slug,
      slug,
      title: data.title || slug,
      content,
      updatedAt: data.updatedAt || data.publishedAt || stats.mtime.toISOString(),
    };
  })
  .filter(n => n.title && n.title !== n.slug)
  .sort((a, b) => a.title.localeCompare(b.title, 'ru'));
}

export async function getNosologyBySlug(slug: string): Promise<Nosology | null> {
  const filePath = path.join(contentDir, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = parseFrontmatter(raw);
  const stats = fs.statSync(filePath);
  return {
    id: slug,
    slug,
    title: data.title || slug,
    content,
    updatedAt: data.updatedAt || data.publishedAt || stats.mtime.toISOString(),
  };
}
