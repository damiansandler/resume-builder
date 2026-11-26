// Renders the built HTML to PDF with Playwright (Chromium).
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { buildLetterHtml } from './letter.js';
import { buildHtml } from './render.js';

/**
 * Prints an HTML file to PDF. Page size and margins come from @page in its CSS.
 * Pass an existing `browser` to reuse it (used by the preview server).
 */
async function printPdf({ htmlPath, output, browser }) {
  const ownBrowser = !browser;
  browser ??= await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const failed = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'error').map((f) => f.family));
    if (failed.length) throw new Error(`Font failed to load: ${failed.join(', ')}`);
    await page.emulateMedia({ media: 'print' });
    await page.pdf({
      path: output,
      preferCSSPageSize: true,
      printBackground: true,
      tagged: true, // tagged (accessible) PDF: logical structure + reading order for ATS
      outline: false,
    });
    await page.close();
  } finally {
    if (ownBrowser) await browser.close();
  }
}

/** Builds the resume HTML from Markdown and prints it to PDF. */
export async function generatePdf({ input, output, browser }) {
  const { htmlPath, resume } = await buildHtml(input);
  await printPdf({ htmlPath, output, browser });
  return { output, htmlPath, resume };
}

/** Builds the cover letter HTML from Markdown and prints it to PDF. */
export async function generateLetterPdf({ input, output, title, author, browser }) {
  const { htmlPath, letter } = await buildLetterHtml(input, { title, author });
  await printPdf({ htmlPath, output, browser });
  return { output, htmlPath, letter };
}
