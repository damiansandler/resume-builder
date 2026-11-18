// Renders the built HTML to PDF with Playwright (Chromium).
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { buildHtml } from './render.js';
import { latestResume, pdfFor } from './versions.js';

/**
 * Builds the HTML from Markdown and prints it to PDF.
 * Pass an existing `browser` to reuse it (used by the preview server).
 */
export async function generatePdf({ input = latestResume(), output = pdfFor(input), browser } = {}) {
  const { htmlPath, resume } = await buildHtml(input);
  const ownBrowser = !browser;
  browser ??= await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const missing = await page.evaluate(() =>
      [...document.fonts].filter((f) => f.family.includes('Carlito') && f.status === 'error').length,
    );
    if (missing) throw new Error('Carlito font failed to load');
    await page.emulateMedia({ media: 'print' });
    await page.pdf({
      path: output,
      preferCSSPageSize: true, // page size and margins come from @page in resume.css
      printBackground: true,
      tagged: true, // tagged (accessible) PDF: logical structure + reading order for ATS
      outline: false,
    });
    await page.close();
    return { output, htmlPath, resume };
  } finally {
    if (ownBrowser) await browser.close();
  }
}
