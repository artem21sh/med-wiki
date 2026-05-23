import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const contentDir = './content/nosologies';
const index = [];

if (!existsSync(contentDir)) {
  console.log('No content directory, skipping index build');
  writeFileSync('public/search-index.json', '[]');
  process.exit(0);
}

const files = readdirSync(contentDir).filter(f => f.endsWith('.md'));

for (const file of files) {
  const slug = file.replace('.md', '');
  const raw = readFileSync(join(contentDir, file), 'utf-8');
  
  // Parse frontmatter manually
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n/);
  let title = slug;
  let content = raw;
  
  if (fmMatch) {
    const fm = fmMatch[1];
    const titleMatch = fm.match(/title:\s*["']?(.+?)["']?\s*$/m);
    if (titleMatch) title = titleMatch[1];
    content = raw.slice(fmMatch[0].length);
  }
  
  console.log(`Indexing: ${title}`);
  index.push({ id: slug, title, slug, content });
}

mkdirSync('public', { recursive: true });
writeFileSync('public/search-index.json', JSON.stringify(index));
console.log(`Done! ${index.length} nosologies indexed.`);
