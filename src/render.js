// Turns the parsed resume model into semantic HTML and fills the template.
import { readFile, mkdir, copyFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseResume } from './parse.js';

const require = createRequire(import.meta.url);
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const TEMPLATE_DIR = path.join(ROOT, 'template');
export const BUILD_DIR = path.join(ROOT, 'build');

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Inline Markdown: ***bold italic***, **bold**, *italic* / _italic_, [text](url), \-escapes.
export function inline(md) {
  const tokens = [];
  const hold = (html) => `\u0000${tokens.push(html) - 1}\u0000`;
  let s = md.replace(/\\([\\`*_[\]()#|+\-.!{}])/g, (_, c) => hold(escapeHtml(c)));
  // Links first, so emphasis markers inside URLs (e.g. underscores) are left alone.
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, url) => hold(`<a href="${escapeHtml(url)}">${emphasis(escapeHtml(text))}</a>`));
  s = emphasis(escapeHtml(s));
  while (/\u0000\d+\u0000/.test(s)) s = s.replace(/\u0000(\d+)\u0000/g, (_, n) => tokens[+n]);
  return s;
}

function emphasis(s) {
  return s
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^\w*])\*(?!\s)(.+?)\*(?!\w)/g, '$1<em>$2</em>')
    .replace(/(^|[^\w])_(?!\s)(.+?)_(?!\w)/g, '$1<em>$2</em>');
}

function renderBlocks(blocks, indent) {
  return blocks
    .map((b) => {
      if (b.type === 'paragraph') return `${indent}<p>${inline(b.text)}</p>`;
      if (b.type === 'list') {
        const items = b.items.map((it) => `${indent}  <li>${inline(it)}</li>`).join('\n');
        return `${indent}<ul>\n${items}\n${indent}</ul>`;
      }
      if (b.type === 'entry') return renderEntry(b, indent);
      return '';
    })
    .join('\n');
}

function renderEntry(e, indent) {
  const head = [
    `${indent}  <div class="entry-head">`,
    `${indent}    <span class="entry-date">${inline(e.date)}</span>`,
    `${indent}    <h3 class="entry-org">${inline(e.org)}</h3>`,
    e.location ? `${indent}    <span class="entry-location">${inline(e.location)}</span>` : '',
    `${indent}  </div>`,
  ].filter(Boolean);
  const body = e.blocks.length
    ? [`${indent}  <div class="entry-body">`, renderBlocks(e.blocks, indent + '    '), `${indent}  </div>`]
    : [];
  return [`${indent}<article class="${['entry', ...e.classes].join(' ')}">`, ...head, ...body, `${indent}</article>`].join('\n');
}

export function renderContent(resume) {
  const header = [
    '<header class="resume-header">',
    `  <h1>${inline(resume.name)}</h1>`,
    renderBlocks(resume.header, '  '),
    '</header>',
  ];
  const sections = resume.sections.map((s) =>
    [
      `<section class="${['section', `section-${s.slug}`, ...s.classes].join(' ')}">`,
      `  <h2>${inline(s.title)}</h2>`,
      `  <div class="section-body">`,
      renderBlocks(s.blocks, '    '),
      `  </div>`,
      `</section>`,
    ].join('\n'),
  );
  return [...header, ...sections].join('\n');
}

const cssString = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\A ')}"`;
const plainText = (md) => inline(md).replace(/<[^>]+>/g, '');

// Fonts: Carlito is metric-compatible with Calibri (the font of the original resume).
// The @fontsource CSS (with its unicode ranges) is copied into build/fonts.css.
const FONT_CSS = ['latin', 'latin-ext'].flatMap((subset) =>
  ['400', '400-italic', '700', '700-italic'].map((v) => `${subset}-${v}.css`),
);

async function copyFonts(outDir) {
  const pkgDir = path.dirname(require.resolve('@fontsource/carlito/package.json'));
  await mkdir(path.join(outDir, 'fonts'), { recursive: true });
  let css = '';
  for (const file of FONT_CSS) {
    const src = (await readFile(path.join(pkgDir, file), 'utf8'))
      .replace(/,\s*url\([^)]*\.woff\) format\('woff'\)/g, '')
      .replace(/url\(\.\/files\//g, 'url(fonts/');
    for (const [, font] of src.matchAll(/url\(fonts\/([^)]+\.woff2)\)/g)) {
      await copyFile(path.join(pkgDir, 'files', font), path.join(outDir, 'fonts', font));
    }
    css += src + '\n';
  }
  await writeFile(path.join(outDir, 'fonts.css'), css);
}

/** Builds build/resume.html from a Markdown file. Returns { htmlPath, resume }. */
export async function buildHtml(markdownPath, { outDir = BUILD_DIR } = {}) {
  const resume = parseResume(await readFile(markdownPath, 'utf8'));
  const template = await readFile(path.join(TEMPLATE_DIR, 'resume.html'), 'utf8');

  await copyFonts(outDir);
  await copyFile(path.join(TEMPLATE_DIR, 'resume.css'), path.join(outDir, 'resume.css'));

  const vars = {
    title: escapeHtml(resume.meta.title ?? plainText(resume.name)),
    author: escapeHtml(resume.meta.author ?? plainText(resume.name)),
    lang: escapeHtml(resume.meta.lang ?? 'en'),
    footer: cssString(resume.meta.footer ?? ''),
    content: renderContent(resume),
  };
  const html = template.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => (k in vars ? vars[k] : m));
  const htmlPath = path.join(outDir, 'resume.html');
  await writeFile(htmlPath, html);
  return { htmlPath, resume };
}
