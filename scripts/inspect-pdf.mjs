// Dumps text items (x, y from top, font, size), link annotations and fonts of a PDF.
// Usage: node scripts/inspect-pdf.mjs <file.pdf> [--lines]
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readFile } from 'node:fs/promises';

const file = process.argv[2];
const linesMode = process.argv.includes('--lines');
const doc = await getDocument({ data: new Uint8Array(await readFile(file)), verbosity: 0 }).promise;
for (let p = 1; p <= doc.numPages; p++) {
  const page = await doc.getPage(p);
  const vp = page.getViewport({ scale: 1 });
  console.log(`=== page ${p} (${vp.width}x${vp.height})`);
  const tc = await page.getTextContent();
  const items = tc.items.filter((i) => i.str.trim() !== '');
  if (linesMode) {
    const lines = new Map();
    for (const i of items) {
      const y = Math.round((vp.height - i.transform[5]) * 2) / 2;
      const key = [...lines.keys()].find((k) => Math.abs(k - y) < 1.5) ?? y;
      if (!lines.has(key)) lines.set(key, []);
      lines.get(key).push(i);
    }
    for (const [y, its] of [...lines].sort((a, b) => a[0] - b[0])) {
      its.sort((a, b) => a.transform[4] - b.transform[4]);
      console.log(y.toFixed(1).padStart(6), its.map((i) => `@${i.transform[4].toFixed(1)}-${(i.transform[4] + i.width).toFixed(1)} ${JSON.stringify(i.str)}`).join('  '));
    }
  } else {
    for (const i of items) {
      const style = tc.styles[i.fontName];
      console.log(`${(vp.height - i.transform[5]).toFixed(2).padStart(7)} x=${i.transform[4].toFixed(2).padStart(7)} w=${i.width.toFixed(2).padStart(7)} sz=${i.transform[0].toFixed(2)} ${style?.fontFamily ?? ''} ${i.fontName} ${JSON.stringify(i.str)}`);
    }
  }
  for (const a of await page.getAnnotations()) {
    if (a.subtype === 'Link') console.log(`LINK ${a.url ?? a.dest} rect=${a.rect.map((n) => n.toFixed(1))}`);
  }
}
