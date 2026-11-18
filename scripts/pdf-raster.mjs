// Rasterizes PDF pages to PNG buffers using pdf.js running inside Playwright's Chromium.
// No native dependencies (poppler, ghostscript, canvas) are required.
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const pdfjsDir = path.dirname(require.resolve('pdfjs-dist/package.json'));
const ORIGIN = 'http://pdf-raster.local';

export async function rasterizePdf(pdfPath, { scale = 2 } = {}) {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.route(`${ORIGIN}/**`, async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname === '/') {
        return route.fulfill({ contentType: 'text/html', body: '<!doctype html><body></body>' });
      }
      if (url.pathname === '/doc.pdf') {
        return route.fulfill({ contentType: 'application/pdf', body: await readFile(pdfPath) });
      }
      const file = path.join(pdfjsDir, url.pathname.replace(/^\/pdfjs\//, ''));
      return route.fulfill({ contentType: 'text/javascript', body: await readFile(file) });
    });
    await page.goto(`${ORIGIN}/`);
    const pages = await page.evaluate(async ({ scale }) => {
      const pdfjs = await import('/pdfjs/build/pdf.mjs');
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/build/pdf.worker.mjs';
      const doc = await pdfjs.getDocument({ url: '/doc.pdf', standardFontDataUrl: '/pdfjs/standard_fonts/' }).promise;
      const out = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const p = await doc.getPage(i);
        const vp = p.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(vp.width);
        canvas.height = Math.round(vp.height);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await p.render({ canvasContext: ctx, viewport: vp }).promise;
        out.push(canvas.toDataURL('image/png').split(',')[1]);
      }
      return out;
    }, { scale });
    return pages.map((b64) => Buffer.from(b64, 'base64'));
  } finally {
    await browser.close();
  }
}
