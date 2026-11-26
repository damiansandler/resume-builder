#!/usr/bin/env node
// Builds the PDF of an application's cover letter. Separate from npm run generate, because not every
// application needs one.
//
// Usage: npm run cover-letter -- cartify   → applications/<…cartify…>/cover-letter.md → "<Name> - Cover Letter - YYYYMMDD.pdf"
//                                           (dated today; it replaces the folder's older cover letter PDF)
//        npm run cover-letter            → the newest application
//        npm run cover-letter -- <path.md> [output.pdf]
// The name comes from the resume in the same folder (or your base resume).
import { existsSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { ROOT, inline } from '../src/render.js';
import { generateLetterPdf } from '../src/pdf.js';
import { BASE_RESUME, fail, latestApplication, pdfNameFor, personName, rel, removeOlderPdfs, resolveApplication } from '../src/paths.js';

const [arg, outArg] = process.argv.slice(2);
let input;
let dir;
if (arg && existsSync(arg) && statSync(arg).isFile()) {
  input = path.resolve(arg);
  dir = path.dirname(input);
} else {
  dir = arg ? resolveApplication(arg) : latestApplication();
  input = path.join(dir, 'cover-letter.md');
  if (!existsSync(input)) {
    const short = arg ?? path.basename(dir);
    fail(`${rel(dir)} has no cover letter yet (cover-letter.md).
  Ask Claude Code in the chat: "Write the cover letter for ${short}"
  or draft it from the terminal (needs an API key): npm run write-cover-letter -- ${short}`);
  }
}
// The samples in examples/ are built into build/, so no PDF lands in the shared examples folder.
const isExample = dir === path.join(ROOT, 'examples');
const resume = isExample
  ? path.join(ROOT, 'examples', 'sample-resume.md')
  : existsSync(path.join(dir, 'resume.md')) ? path.join(dir, 'resume.md') : BASE_RESUME;
const outDir = isExample ? path.join(ROOT, 'build') : dir;
const output = outArg ? path.resolve(outArg) : path.join(outDir, pdfNameFor(resume, 'Cover Letter'));
const name = personName(resume);

const started = Date.now();
const { letter } = await generateLetterPdf({
  input,
  output,
  title: name ? `${name} - Cover Letter` : undefined,
  author: name || undefined,
});
console.log(`✔ ${rel(output)} generated from ${rel(input)} in ${Date.now() - started} ms`);
if (!outArg) for (const old of removeOlderPdfs(output, resume, 'Cover Letter')) console.log(`  replaces ${old}`);

// Quick checks: every line is readable as text, and the letter fits on one page.
const doc = await getDocument({ data: new Uint8Array(await readFile(output)), verbosity: 0 }).promise;
let text = '';
for (let p = 1; p <= doc.numPages; p++) {
  for (const item of (await (await doc.getPage(p)).getTextContent()).items) text += item.str + (item.hasEOL ? '\n' : ' ');
}
// Only a hyphen at the end of a line joins the next word ("on-\nramp"); "high- and low-level" stays as it is.
const flat = text.replace(/(\w)-[ \t]*\n\s*/g, '$1-').replace(/\s+/g, ' ');
const plain = (md) => inline(md).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
const lines = letter.paragraphs.flat().map(plain).filter(Boolean);
const missing = lines.filter((l) => !flat.includes(l));
const words = lines.join(' ').split(/\s+/).length;
console.log(`${missing.length ? '✗' : '✔'} all text readable (${words} words)`);
for (const m of missing) console.log(`    not found as text: "${m.slice(0, 90)}"`);
console.log(`${doc.numPages === 1 ? '✔' : '⚠'} ${doc.numPages} page${doc.numPages === 1 ? '' : 's'}${doc.numPages > 1 ? ': a cover letter should fit on one page' : ''}`);
if (missing.length) process.exit(1);
