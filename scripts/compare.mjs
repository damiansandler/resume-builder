#!/usr/bin/env node
// Compares the generated PDF against the original, both as text layout and as pixels.
//
// Usage: npm run compare [-- <application name or path.md> [reference.pdf]]   (default: your base resume)
// Writes to build/compare/: page-N-diff.png (pixelmatch) and page-N-overlay.png
// (reference in red, generated in blue, identical pixels in black).
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { rasterizePdf } from './pdf-raster.mjs';
import { ROOT } from '../src/render.js';
import { latestPdf, resolveResume } from '../src/paths.js';

const resolved = resolveResume(process.argv[2]);
const genPath = resolved.dated ? latestPdf(path.dirname(resolved.pdf), resolved.md) : resolved.pdf;
const refPath = path.resolve(process.argv[3] ?? path.join(ROOT, 'reference', 'original.pdf'));
if (!existsSync(refPath)) {
  console.log(`ℹ No reference PDF at ${path.relative(process.cwd(), refPath)}, nothing to compare.`);
  console.log('  This command is optional: put the PDF you want to match in reference/original.pdf to use it.');
  process.exit(0);
}
console.log(`Comparing ${path.relative(process.cwd(), genPath)} with ${path.relative(process.cwd(), refPath)}`);
const outDir = path.join(ROOT, 'build', 'compare');
const SCALE = 2;

/** Groups text items into visual lines: [{ page, y, x0, x1, text }] */
async function textLines(file) {
  const doc = await getDocument({ data: new Uint8Array(await readFile(file)), verbosity: 0 }).promise;
  const result = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const { height } = page.getViewport({ scale: 1 });
    const items = (await page.getTextContent()).items.filter((i) => i.str.trim());
    const lines = [];
    for (const i of items) {
      const y = height - i.transform[5];
      let line = lines.find((l) => Math.abs(l.y - y) < 2);
      if (!line) lines.push((line = { page: p, y, items: [] }));
      line.items.push(i);
    }
    for (const l of lines) {
      l.items.sort((a, b) => a.transform[4] - b.transform[4]);
      let text = '';
      let prevEnd = null;
      for (const i of l.items) {
        if (prevEnd !== null && i.transform[4] - prevEnd > 1) text += ' ';
        text += i.str;
        prevEnd = i.transform[4] + i.width;
      }
      l.text = text.replace(/\s+/g, ' ').trim();
      l.x0 = l.items[0].transform[4];
      l.x1 = Math.max(...l.items.map((i) => i.transform[4] + i.width));
      delete l.items;
    }
    result.push(...lines.sort((a, b) => a.y - b.y));
  }
  return { lines: result, pages: doc.numPages };
}

const fmt = (n) => (n >= 0 ? '+' : '') + n.toFixed(1);

const ref = await textLines(refPath);
const gen = await textLines(genPath);
console.log(`Pages: reference ${ref.pages}, generated ${gen.pages}${ref.pages === gen.pages ? '' : '  ⚠ page count differs'}\n`);

// ---- Text layout comparison ----
const unmatched = [...gen.lines];
let worst = 0;
let sum = 0;
let count = 0;
const problems = [];
for (const r of ref.lines) {
  const idx = unmatched.findIndex((g) => g.text === r.text);
  if (idx === -1) {
    problems.push(`  ✗ p${r.page} y=${r.y.toFixed(1)} line not found in generated PDF: "${r.text}"`);
    continue;
  }
  const g = unmatched.splice(idx, 1)[0];
  const d = Math.max(Math.abs(g.y - r.y), Math.abs(g.x0 - r.x0), Math.abs(g.x1 - r.x1), g.page !== r.page ? 999 : 0);
  worst = Math.max(worst, d);
  sum += d;
  count++;
  if (d > 1) {
    problems.push(
      `  ~ p${r.page}${g.page !== r.page ? `→p${g.page}` : ''} y=${r.y.toFixed(1)} dy=${fmt(g.y - r.y)} dx0=${fmt(g.x0 - r.x0)} dx1=${fmt(g.x1 - r.x1)}  "${r.text.slice(0, 60)}"`,
    );
  }
}
for (const g of unmatched) problems.push(`  ✗ p${g.page} y=${g.y.toFixed(1)} extra line in generated PDF: "${g.text}"`);
console.log(`Text lines: ${count}/${ref.lines.length} matched exactly by content (same line breaks)`);
console.log(`Position error: mean ${(sum / Math.max(count, 1)).toFixed(2)}pt, max ${worst.toFixed(2)}pt`);
console.log(problems.length ? `Lines off by more than 1pt or unmatched:\n${problems.join('\n')}` : 'All lines within 1pt ✔');

// ---- Pixel comparison ----
await mkdir(outDir, { recursive: true });
const [refPng, genPng] = await Promise.all([rasterizePdf(refPath, { scale: SCALE }), rasterizePdf(genPath, { scale: SCALE })]);
console.log('\nPixels (scale 2x, threshold 0.1):');
for (let i = 0; i < Math.max(refPng.length, genPng.length); i++) {
  if (!refPng[i] || !genPng[i]) {
    console.log(`  page ${i + 1}: missing in ${refPng[i] ? 'generated' : 'reference'}`);
    continue;
  }
  const a = PNG.sync.read(refPng[i]);
  const b = PNG.sync.read(genPng[i]);
  const width = Math.min(a.width, b.width);
  const height = Math.min(a.height, b.height);
  const crop = (img) => {
    const out = new PNG({ width, height });
    for (let y = 0; y < height; y++) img.data.copy(out.data, y * width * 4, y * img.width * 4, y * img.width * 4 + width * 4);
    return out;
  };
  const A = crop(a);
  const B = crop(b);
  const diff = new PNG({ width, height });
  const mismatched = pixelmatch(A.data, B.data, diff.data, width, height, { threshold: 0.1 });
  const overlay = new PNG({ width, height });
  let inked = 0;
  for (let p = 0; p < width * height * 4; p += 4) {
    const ra = 255 - A.data[p + 1]; // ink of reference (0..255)
    const gb = 255 - B.data[p + 1]; // ink of generated
    if (ra > 40 || gb > 40) inked++;
    overlay.data[p] = 255 - gb; // generated ink removes red → appears blue/black
    overlay.data[p + 1] = 255 - Math.max(ra, gb);
    overlay.data[p + 2] = 255 - ra; // reference ink removes blue → appears red/black
    overlay.data[p + 3] = 255;
  }
  await writeFile(path.join(outDir, `page-${i + 1}-diff.png`), PNG.sync.write(diff));
  await writeFile(path.join(outDir, `page-${i + 1}-overlay.png`), PNG.sync.write(overlay));
  await writeFile(path.join(outDir, `page-${i + 1}-reference.png`), refPng[i]);
  await writeFile(path.join(outDir, `page-${i + 1}-generated.png`), genPng[i]);
  console.log(
    `  page ${i + 1}: ${mismatched} px differ = ${((mismatched / (width * height)) * 100).toFixed(2)}% of page, ` +
      `${((mismatched / Math.max(inked, 1)) * 100).toFixed(1)}% of inked area`,
  );
}
console.log(`\nImages written to ${path.relative(process.cwd(), outDir)}/`);
