import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { getFile, putFile, GitHubNotFoundError, GitHubConflictError } from '@/lib/github';
import {
  parseNosologyFile,
  buildFileWithFrontmatter,
  buildFileWithBlock,
  isValidNosologySlug,
  hasInvalidHeadingStructure,
  normalizeBlockTail,
  otherBlocksUnchanged,
} from '@/lib/nosology-blocks';

const CONTENT_DIR = 'content/nosologies';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const { slug } = await params;
  if (!isValidNosologySlug(slug)) {
    return NextResponse.json({ error: 'Нозология не найдена' }, { status: 404 });
  }

  try {
    const { content: raw, sha } = await getFile(`${CONTENT_DIR}/${slug}.md`);
    const parsed = parseNosologyFile(raw);
    return NextResponse.json({
      sha,
      frontmatter: parsed.frontmatter,
      blocks: parsed.blocks.map((b) => ({ id: b.id, title: b.title, content: b.content })),
    });
  } catch (error) {
    if (error instanceof GitHubNotFoundError) {
      return NextResponse.json({ error: 'Нозология не найдена' }, { status: 404 });
    }
    console.error('Admin GET nosology failed:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Не удалось загрузить файл из GitHub' }, { status: 500 });
  }
}

type PutBody =
  | { sha: string; type: 'frontmatter'; title: string; icd: string; aliases: string }
  | { sha: string; type: 'block'; blockId: string; content: string };

export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const { slug } = await params;
  if (!isValidNosologySlug(slug)) {
    return NextResponse.json({ error: 'Нозология не найдена' }, { status: 404 });
  }

  let body: Partial<PutBody>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Некорректное тело запроса' }, { status: 400 });
  }

  if (!body || typeof body.sha !== 'string' || !body.sha) {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 });
  }

  const filePath = `${CONTENT_DIR}/${slug}.md`;

  // Always re-fetch the current file from GitHub rather than trusting any
  // locally cached copy, so the sha comparison below reflects reality.
  let current: { content: string; sha: string };
  try {
    current = await getFile(filePath);
  } catch (error) {
    if (error instanceof GitHubNotFoundError) {
      return NextResponse.json({ error: 'Нозология не найдена' }, { status: 404 });
    }
    console.error('Admin PUT nosology (fetch current) failed:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Не удалось связаться с GitHub' }, { status: 500 });
  }

  // App-level optimistic-lock check (fast, clear message). GitHub's own
  // PUT below re-checks sha at commit time too, closing the narrow race
  // between this GET and that PUT.
  if (current.sha !== body.sha) {
    return NextResponse.json({ error: 'Файл изменился, обновите страницу' }, { status: 409 });
  }

  const parsed = parseNosologyFile(current.content);
  let newRaw: string;
  let sectionLabel: string;

  if (body.type === 'frontmatter') {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) {
      return NextResponse.json({ error: 'Название не может быть пустым' }, { status: 400 });
    }
    newRaw = buildFileWithFrontmatter(parsed, {
      title,
      icd: typeof body.icd === 'string' ? body.icd.trim() : '',
      aliases: typeof body.aliases === 'string' ? body.aliases.trim() : '',
    });
    sectionLabel = 'Основная информация';
  } else if (body.type === 'block') {
    const blockId = typeof body.blockId === 'string' ? body.blockId : '';
    const blockIndex = parsed.blocks.findIndex((b) => b.id === blockId);
    if (blockIndex === -1) {
      return NextResponse.json({ error: 'Раздел не найден' }, { status: 400 });
    }
    const block = parsed.blocks[blockIndex];
    const content = typeof body.content === 'string' ? body.content : '';

    if (block.id !== 'intro' && !content.trim()) {
      return NextResponse.json({ error: 'Раздел нельзя сохранить пустым' }, { status: 400 });
    }
    if (hasInvalidHeadingStructure(block.id, content)) {
      return NextResponse.json(
        {
          error:
            'В блоке не должно быть дополнительных строк вида "# Заголовок" (подзаголовки пишите как "## Название")',
        },
        { status: 400 }
      );
    }

    const isLast = blockIndex === parsed.blocks.length - 1;
    const normalizedContent = normalizeBlockTail(content, isLast);

    newRaw = buildFileWithBlock(parsed, block.id, normalizedContent);

    // Belt-and-suspenders: the edit must only ever touch this one block.
    const reparsed = parseNosologyFile(newRaw);
    if (!otherBlocksUnchanged(parsed.blocks, reparsed.blocks, block.id)) {
      return NextResponse.json({ error: 'Правка нарушает структуру файла' }, { status: 400 });
    }

    sectionLabel = block.title || 'Вводная часть';
  } else {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 });
  }

  const message = `admin: ${slug} — ${sectionLabel} (${session.name})`;

  try {
    const result = await putFile(filePath, newRaw, current.sha, message);
    return NextResponse.json({ sha: result.sha });
  } catch (error) {
    if (error instanceof GitHubConflictError) {
      return NextResponse.json({ error: 'Файл изменился, обновите страницу' }, { status: 409 });
    }
    console.error('Admin PUT nosology (commit) failed:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Не удалось сохранить файл в GitHub' }, { status: 500 });
  }
}
