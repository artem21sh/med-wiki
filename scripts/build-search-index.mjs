import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import { writeFileSync, mkdirSync } from 'fs';

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const n2m = new NotionToMarkdown({ notionClient: notion });

function cleanMarkdown(md) {
  if (!md) return '';
  return md.split('\n').map(l => l.replace(/^[\t ]+/, '')).join('\n');
}

async function main() {
  console.log('Fetching nosologies...');
  const response = await notion.databases.query({
    database_id: process.env.NOTION_DB_ID,
    sorts: [{ property: 'Page', direction: 'ascending' }],
  });

  const index = [];

  for (const page of response.results) {
    const title = page.properties.Page?.title?.[0]?.plain_text ?? '';
    if (!title) continue;
    console.log('Processing: ' + title);
    const slug = page.id.replace(/-/g, '');
    await new Promise(r => setTimeout(r, 500));
    try {
      const mdBlocks = await n2m.pageToMarkdown(page.id);
      const markdown = n2m.toMarkdownString(mdBlocks);
      const content = cleanMarkdown(markdown?.parent ?? '');
      index.push({ id: page.id, title, slug, content });
    } catch (e) {
      index.push({ id: page.id, title, slug, content: '' });
    }
  }

  mkdirSync('public', { recursive: true });
  writeFileSync('public/search-index.json', JSON.stringify(index));
  console.log('Done! ' + index.length + ' nosologies indexed.');
}

main();
