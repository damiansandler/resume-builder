// Cover letters: applications/<folder>/cover-letter.md → HTML → PDF.
//
//   ---                      front matter (company, role, lang, title)
//   ---
//   Dear Cartify Team,       paragraphs separated by blank lines;
//                            a line break inside a paragraph is kept (the sign-off)
//   **Title line**           inline Markdown as in the resume: **bold**, *italic*, [text](url)
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { BUILD_DIR, TEMPLATE_DIR, inline } from './render.js';

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Parses a cover letter → { meta, paragraphs: [[line, …], …] }. */
export function parseLetter(source) {
  let text = source.replace(/\r\n?/g, '\n').replace(/<!--[\s\S]*?-->/g, '');
  const meta = {};
  const fm = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (fm) {
    for (const line of fm[1].split('\n')) {
      const m = line.match(/^\s*([\w-]+)\s*:\s*(.*?)\s*$/);
      if (m) meta[m[1]] = m[2].replace(/^(["'])(.*)\1$/, '$2');
    }
    text = text.slice(fm[0].length);
  }
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((block) => block.split('\n').map((l) => l.trim()).filter(Boolean))
    .filter((lines) => lines.length);
  return { meta, paragraphs };
}

/** Builds build/cover-letter.html from a Markdown file. Returns { htmlPath, letter }. */
export async function buildLetterHtml(markdownPath, { title, author, outDir = BUILD_DIR } = {}) {
  const letter = parseLetter(await readFile(markdownPath, 'utf8'));
  const template = await readFile(path.join(TEMPLATE_DIR, 'cover-letter.html'), 'utf8');
  await mkdir(outDir, { recursive: true });
  await copyFile(path.join(TEMPLATE_DIR, 'cover-letter.css'), path.join(outDir, 'cover-letter.css'));
  const { meta } = letter;
  const defaultTitle = ['Cover Letter', [meta.role, meta.company].filter(Boolean).join(' · ')].filter(Boolean).join(' – ');
  const vars = {
    title: escapeHtml(meta.title ?? title ?? defaultTitle),
    author: escapeHtml(meta.author ?? author ?? ''),
    lang: escapeHtml(meta.lang ?? 'en'),
    content: letter.paragraphs.map((lines) => `    <p>${lines.map(inline).join('<br>\n      ')}</p>`).join('\n'),
  };
  const html = template.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => (k in vars ? vars[k] : m));
  const htmlPath = path.join(outDir, 'cover-letter.html');
  await writeFile(htmlPath, html);
  return { htmlPath, letter };
}
