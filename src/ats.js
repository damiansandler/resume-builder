// ATS sanity checks for a generated PDF: extractable text in reading order, every Markdown line
// present, working links, embedded fonts, tagged structure, metadata.
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readFile } from 'node:fs/promises';
import { parseResume } from './parse.js';
import { inline } from './render.js';

/**
 * Checks `pdf` against the Markdown it was built from and prints one line per check.
 * With `verbose`, also prints the page count and the start of the extracted text.
 * Returns true when every check passes.
 */
export async function checkPdf({ md, pdf, verbose = false }) {
  const doc = await getDocument({ data: new Uint8Array(await readFile(pdf)), verbosity: 0 }).promise;
  let ok = true;
  const check = (cond, msg) => {
    console.log(`${cond ? '✔' : '✗'} ${msg}`);
    ok &&= cond;
  };

  // Text in content-stream order (what most ATS parsers read), joined like a plain-text extractor.
  let text = '';
  const links = [];
  let tagged = true;
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    for (const item of (await page.getTextContent()).items) text += item.str + (item.hasEOL ? '\n' : '');
    text += '\n';
    for (const a of await page.getAnnotations()) if (a.subtype === 'Link') links.push(a.url);
    tagged &&= !!(await page.getStructTree());
  }
  // Lines broken after a hyphen ("natural-\nlanguage") are joined back without a space.
  const flat = text.replace(/(\w)-\s*\n\s*/g, '$1-').replace(/\s+/g, ' ');

  // Every piece of resume content must appear, in document order.
  const source = await readFile(md, 'utf8');
  const resume = parseResume(source);
  const plain = (s) =>
    inline(s)
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
  const expected = [resume.name, ...resume.header.map((b) => b.text)];
  const walk = (blocks) => {
    for (const b of blocks) {
      if (b.type === 'paragraph') expected.push(b.text);
      if (b.type === 'list') expected.push(...b.items);
      if (b.type === 'entry') {
        expected.push(b.date, b.org, b.location);
        walk(b.blocks);
      }
    }
  };
  for (const s of resume.sections) expected.push(s.title), walk(s.blocks);
  let cursor = 0;
  const missing = [];
  const pieces = expected.filter(Boolean).map(plain);
  for (const piece of pieces) {
    const at = flat.indexOf(piece, cursor);
    if (at === -1) missing.push(piece);
    else cursor = at + piece.length;
  }
  check(missing.length === 0, `all ${pieces.length} content pieces extractable as text, in reading order`);
  for (const m of missing) console.log(`    missing/out of order: "${m.slice(0, 90)}"`);

  const mdLinks = [...source.matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1]);
  check(
    mdLinks.every((u) => links.some((l) => l === u || l === u + '/')),
    `hyperlinks clickable: ${links.join(', ') || 'none'}`,
  );

  const raw = (await readFile(pdf)).toString('latin1');
  const fonts = [...new Set([...raw.matchAll(/\/FontName\s*\/([^\s/>]+)/g)].map((m) => m[1].replace(/^[A-Z]{6}\+/, '')))];
  const descriptors = (raw.match(/\/Type\s*\/FontDescriptor/g) ?? []).length;
  const files = (raw.match(/\/FontFile[23]?\s/g) ?? []).length;
  check(descriptors > 0 && files >= descriptors, `fonts embedded (${files}/${descriptors}): ${fonts.join(', ')}`);
  check(tagged, 'tagged PDF (structure tree present on every page)');
  const { info } = await doc.getMetadata();
  check(!!info.Title, `document title: "${info.Title ?? ''}"`);
  console.log(`  ${doc.numPages} page${doc.numPages === 1 ? '' : 's'}`);
  if (verbose) console.log(`--- extracted text (first 600 chars) ---\n${text.slice(0, 600)}`);
  return ok;
}
