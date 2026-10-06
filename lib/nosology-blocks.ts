import 'server-only';
import fs from 'fs';
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), 'content/nosologies');

// A top-level section heading is a line like "# 1. Определение" — a single
// "#", whitespace, then the rest of the line. "## 3.1. ..." never matches
// this (the char right after the single "#" is another "#", not whitespace).
const H1_LINE_RE = /^#[ \t]+[^\n]*$/gm;

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?/;

export interface ContentBlock {
  id: string; // 'intro' | `section-${n}`, in file order
  title: string; // '' for intro; otherwise the heading text, e.g. "1. Определение"
  content: string; // exact raw slice of the file's body for this block —
  // for section blocks this INCLUDES the "# N. ..." heading line itself,
  // so editing it is just editing this one string.
}

export interface ParsedNosologyFile {
  frontmatterRaw: string; // exact text between the --- delimiters, byte-for-byte
  frontmatter: { title: string; icd: string; aliases: string };
  body: string; // exact text after the closing "---" line
  blocks: ContentBlock[];
}

function parseFrontmatterValue(fm: string, key: string): string {
  for (const line of fm.split('\n')) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    if (line.slice(0, colon).trim() !== key) continue;
    return line.slice(colon + 1).trim().replace(/^"(.*)"$/, '$1');
  }
  return '';
}

/** Split the file body (everything after the frontmatter) into the intro
 *  block plus one block per top-level "# N. ..." section, in order. The
 *  blocks fully partition `body`: concatenating their `content` in order
 *  reproduces `body` exactly. */
export function splitIntoBlocks(body: string): ContentBlock[] {
  const heads: { index: number; title: string }[] = [];
  const re = new RegExp(H1_LINE_RE); // fresh instance: avoid shared lastIndex state
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    heads.push({ index: m.index, title: m[0].replace(/^#[ \t]+/, '').trim() });
  }

  const blocks: ContentBlock[] = [];
  const introEnd = heads.length > 0 ? heads[0].index : body.length;
  blocks.push({ id: 'intro', title: '', content: body.slice(0, introEnd) });

  for (let i = 0; i < heads.length; i++) {
    const start = heads[i].index;
    const end = i + 1 < heads.length ? heads[i + 1].index : body.length;
    blocks.push({ id: `section-${i}`, title: heads[i].title, content: body.slice(start, end) });
  }
  return blocks;
}

/** Replace exactly one block's text, leaving every other byte of `body`
 *  untouched. Offsets are re-derived from `splitIntoBlocks(body)` rather
 *  than trusted from the caller, so this is always consistent with the
 *  `body` actually passed in. */
export function replaceBlock(body: string, blockId: string, newContent: string): string {
  const blocks = splitIntoBlocks(body);
  let offset = 0;
  for (const b of blocks) {
    if (b.id === blockId) {
      return body.slice(0, offset) + newContent + body.slice(offset + b.content.length);
    }
    offset += b.content.length;
  }
  throw new Error(`Unknown block id: ${blockId}`);
}

/** Parse a full nosology .md file (frontmatter + body) exactly as stored. */
export function parseNosologyFile(raw: string): ParsedNosologyFile {
  const m = raw.match(FRONTMATTER_RE);
  const frontmatterRaw = m ? m[1] : '';
  const body = m ? raw.slice(m[0].length) : raw;
  return {
    frontmatterRaw,
    frontmatter: {
      title: parseFrontmatterValue(frontmatterRaw, 'title'),
      icd: parseFrontmatterValue(frontmatterRaw, 'icd'),
      aliases: parseFrontmatterValue(frontmatterRaw, 'aliases'),
    },
    body,
    blocks: splitIntoBlocks(body),
  };
}

/** Rewrite one `key: "value"` line in place inside the raw frontmatter
 *  text, preserving every other line (order, spacing, untouched keys like
 *  publishedAt/status) byte-for-byte. Quotes and newlines are stripped
 *  from the value since the site's own frontmatter reader (lib/content.ts)
 *  only strips a single outer quote pair and has no escaping support. */
export function setFrontmatterValue(fmRaw: string, key: string, value: string): string {
  const safeValue = value.replace(/\r?\n/g, ' ').replace(/"/g, '');
  let found = false;
  const next = fmRaw.split('\n').map((line) => {
    const colon = line.indexOf(':');
    if (colon === -1 || line.slice(0, colon).trim() !== key) return line;
    found = true;
    return `${key}: "${safeValue}"`;
  });
  if (!found) next.push(`${key}: "${safeValue}"`);
  return next.join('\n');
}

export function buildFileWithFrontmatter(
  parsed: ParsedNosologyFile,
  updates: { title: string; icd: string; aliases: string }
): string {
  let fm = setFrontmatterValue(parsed.frontmatterRaw, 'title', updates.title);
  fm = setFrontmatterValue(fm, 'icd', updates.icd);
  fm = setFrontmatterValue(fm, 'aliases', updates.aliases);
  return `---\n${fm}\n---\n${parsed.body}`;
}

export function buildFileWithBlock(parsed: ParsedNosologyFile, blockId: string, newContent: string): string {
  const newBody = replaceBlock(parsed.body, blockId, newContent);
  return `---\n${parsed.frontmatterRaw}\n---\n${newBody}`;
}

/** Defends against path traversal and nonsense slugs: the regex alone
 *  would already block "../", but we also require the slug to match an
 *  actual file already committed in content/nosologies/. */
export function isValidNosologySlug(slug: string): boolean {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return false;
  const filePath = path.join(CONTENT_DIR, `${slug}.md`);
  return fs.existsSync(filePath) && path.dirname(filePath) === CONTENT_DIR;
}
