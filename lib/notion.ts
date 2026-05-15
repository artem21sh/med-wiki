import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const n2m = new NotionToMarkdown({ notionClient: notion as any });

const DATABASE_ID = process.env.NOTION_DB_ID!;

function cleanMarkdown(md: string): string {
  if (!md) return '';
  return md
    .split('\n')
    .map(line => line.replace(/^[\t ]+/, ''))
    .join('\n');
}

export async function getNosologies() {
  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: {
      property: 'Статус',
      select: {
        equals: 'Готово',
      },
    },
    sorts: [{ property: 'Page', direction: 'ascending' }],
  });

  return response.results.map((page: any) => ({
    id: page.id,
    title: page.properties.Page?.title?.[0]?.plain_text ?? 'Без названия',
    tags: page.properties.Tags?.multi_select?.map((t: any) => t.name) ?? [],
    lastEdited: page.last_edited_time,
    slug: page.id.replace(/-/g, ''),
  }));
}

export async function getNosologyById(id: string) {
  if (!id) throw new Error('id is required');
  const formatted = id.includes('-') ? id : [
    id.slice(0, 8), id.slice(8, 12), id.slice(12, 16),
    id.slice(16, 20), id.slice(20)
  ].join('-');

  const page = await notion.pages.retrieve({ page_id: formatted });
  const mdBlocks = await n2m.pageToMarkdown(formatted);
  const markdown = n2m.toMarkdownString(mdBlocks);

  return {
    id: (page as any).id,
    title: (page as any).properties.Page?.title?.[0]?.plain_text ?? 'Без названия',
    tags: (page as any).properties.Tags?.multi_select?.map((t: any) => t.name) ?? [],
    lastEdited: (page as any).last_edited_time,
    markdown: cleanMarkdown(markdown?.parent ?? ''),
  };
}

export async function searchNosologies(query: string) {
  const response = await notion.search({
    query,
    filter: { property: 'object', value: 'page' },
    sort: { direction: 'descending', timestamp: 'last_edited_time' },
  });

  return response.results
    .filter((r: any) => r.parent?.database_id?.replace(/-/g, '') === DATABASE_ID.replace(/-/g, ''))
    .map((page: any) => ({
      id: page.id,
      title: page.properties.Page?.title?.[0]?.plain_text ?? 'Без названия',
      slug: page.id.replace(/-/g, ''),
    }));
}
