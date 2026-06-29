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

function parseFrontmatterValue(fm, key) {
  const m = fm.match(new RegExp(`^${key}:\\s*["']?(.+?)["']?\\s*$`, 'm'));
  return m ? m[1] : '';
}

// Extract # sections (main headers) with their titles, for section-level search
function parseSections(content) {
  const lines = content.split('\n');
  const sections = [];
  let current = null;
  let buf = [];
  let sectionIdx = 0;

  for (const line of lines) {
    const isH1 = /^#\s+/.test(line) && !/^##/.test(line);
    if (isH1) {
      if (current) {
        current.content = buf.join('\n').trim();
        sections.push(current);
      }
      const title = line.replace(/^#+\s+/, '').trim();
      current = { title, anchor: `section-${sectionIdx}`, content: '' };
      sectionIdx++;
      buf = [];
    } else if (current) {
      buf.push(line);
    }
  }
  if (current) {
    current.content = buf.join('\n').trim();
    sections.push(current);
  }
  return sections;
}

for (const file of files) {
  const slug = file.replace('.md', '');
  const raw = readFileSync(join(contentDir, file), 'utf-8');

  // Parse frontmatter
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n/);
  let title = slug;
  let aliases = [];
  let icd = '';
  let content = raw;

  if (fmMatch) {
    const fm = fmMatch[1];
    title = parseFrontmatterValue(fm, 'title') || slug;
    icd = parseFrontmatterValue(fm, 'icd');
    const aliasStr = parseFrontmatterValue(fm, 'aliases');
    aliases = aliasStr ? aliasStr.split(',').map(s => s.trim()).filter(Boolean) : [];
    content = raw.slice(fmMatch[0].length);
  }

  // Skip drafts / untitled
  if (!title || title === slug) {
    console.log(`Skipping (no title): ${slug}`);
    continue;
  }

  // Section titles for section-level search ("лечение синусита")
  const sections = parseSections(content);
  const sectionList = sections
    .filter(s => s.title)
    .map(s => ({ title: s.title, anchor: s.anchor }));

  console.log(`Indexing: ${title} (icd=${icd}, ${aliases.length} aliases, ${sectionList.length} sections)`);
  index.push({ id: slug, title, slug, icd, aliases, sections: sectionList, content });
}

mkdirSync('public', { recursive: true });
writeFileSync('public/search-index.json', JSON.stringify(index));
console.log(`Done! ${index.length} nosologies indexed.`);
