#!/usr/bin/env node
// Live preview: serves the generated PDF (and the HTML it is printed from) on a local
// server, opens it in the default browser and regenerates/reloads whenever the .md
// or anything in template/ changes.
//
// Usage: npm run preview [-- <application name>]  (default: your base resume)   (PORT env var, default 4321; NO_OPEN=1 to not open a browser)
import http from 'node:http';
import { watch } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { chromium } from 'playwright';
import { generatePdf } from '../src/pdf.js';
import { resolveResume } from '../src/paths.js';
import { BUILD_DIR, TEMPLATE_DIR } from '../src/render.js';

const { md: input, pdf: finalPdf } = resolveResume(process.argv[2]);
const downloadName = path.basename(finalPdf);
const watching = path.relative(process.cwd(), input);
const PORT = Number(process.env.PORT ?? 4321);
const pdfPath = path.join(BUILD_DIR, 'preview.pdf');

const browser = await chromium.launch();
const clients = new Set();
let version = 0;
let lastError = null;

function broadcast(event, data) {
  for (const res of clients) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

let building = null;
let pending = false;
async function rebuild() {
  if (building) return void (pending = true);
  building = (async () => {
    const t = Date.now();
    try {
      await generatePdf({ input, output: pdfPath, browser });
      version++;
      lastError = null;
      console.log(`↻ rebuilt in ${Date.now() - t} ms`);
      broadcast('reload', { version });
    } catch (err) {
      lastError = err.stack ?? String(err);
      console.error(`✗ build failed: ${err.message}`);
      broadcast('failure', { message: lastError });
    }
  })();
  await building;
  building = null;
  if (pending) {
    pending = false;
    await rebuild();
  }
}

let timer;
const scheduleRebuild = () => {
  clearTimeout(timer);
  timer = setTimeout(rebuild, 150);
};
watch(path.dirname(input), (_, file) => file === path.basename(input) && scheduleRebuild());
watch(TEMPLATE_DIR, { recursive: true }, scheduleRebuild);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
};

const viewer = () => `<!doctype html>
<html><head><meta charset="utf-8"><title>Resume preview</title>
<style>
  html, body { margin: 0; height: 100%; font: 13px system-ui, sans-serif; background: #525659; }
  nav { display: flex; gap: 12px; align-items: center; padding: 6px 12px; background: #323639; color: #eee; }
  nav a { color: #9cf; text-decoration: none; } nav a.on { color: #fff; font-weight: 600; }
  nav .status { margin-left: auto; opacity: .7; }
  iframe { border: 0; width: 100%; height: calc(100% - 31px); display: block; background: #525659; }
  pre { position: fixed; inset: 40px 20px auto; margin: 0; padding: 16px; background: #fee; color: #900; white-space: pre-wrap; display: none; }
</style></head>
<body>
<nav>
  <strong>Resume preview</strong>
  <a href="#pdf" data-view="pdf">PDF</a>
  <a href="#html" data-view="html">HTML</a>
  <a href="/resume.pdf" download="${downloadName}">Download</a>
  <span class="status">watching ${watching} and template/</span>
</nav>
<iframe id="frame"></iframe>
<pre id="error"></pre>
<script>
  let version = ${version};
  const frame = document.getElementById('frame');
  const errorBox = document.getElementById('error');
  const view = () => (location.hash === '#html' ? 'html' : 'pdf');
  function show() {
    document.querySelectorAll('nav a[data-view]').forEach((a) => a.classList.toggle('on', a.dataset.view === view()));
    frame.src = view() === 'pdf' ? '/resume.pdf?v=' + version + '#view=FitH' : '/html/resume.html?v=' + version;
  }
  window.addEventListener('hashchange', show);
  const es = new EventSource('/events');
  es.addEventListener('reload', (e) => { version = JSON.parse(e.data).version; errorBox.style.display = 'none'; show(); });
  es.addEventListener('failure', (e) => { errorBox.textContent = JSON.parse(e.data).message; errorBox.style.display = 'block'; });
  show();
</script>
</body></html>`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname === '/') {
      res.writeHead(200, { 'content-type': MIME['.html'] });
      return res.end(viewer());
    }
    if (url.pathname === '/events') {
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' });
      res.write(': connected\n\n');
      if (lastError) res.write(`event: failure\ndata: ${JSON.stringify({ message: lastError })}\n\n`);
      clients.add(res);
      return req.on('close', () => clients.delete(res));
    }
    if (url.pathname === '/resume.pdf') {
      res.writeHead(200, { 'content-type': MIME['.pdf'], 'cache-control': 'no-store' });
      return res.end(await readFile(pdfPath));
    }
    if (url.pathname.startsWith('/html/')) {
      const file = path.join(BUILD_DIR, path.normalize(decodeURIComponent(url.pathname.slice(6))));
      if (!file.startsWith(BUILD_DIR + path.sep)) throw Object.assign(new Error('forbidden'), { code: 'ENOENT' });
      res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
      return res.end(await readFile(file));
    }
    res.writeHead(404).end('Not found');
  } catch (err) {
    res.writeHead(err.code === 'ENOENT' ? 404 : 500).end(String(err.message));
  }
});

await rebuild();
server.listen(PORT, '127.0.0.1', () => {
  const url = `http://localhost:${PORT}/`;
  console.log(`Preview running at ${url}  (Ctrl+C to stop)`);
  if (!process.env.NO_OPEN) {
    const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd' : 'xdg-open';
    const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
    spawn(cmd, args, { stdio: 'ignore', detached: true }).on('error', () => {}).unref();
  }
});

const shutdown = async () => {
  server.close();
  await browser.close();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
