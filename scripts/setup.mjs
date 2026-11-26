#!/usr/bin/env node
// First-time setup: installs dependencies (and Chromium), creates your personal folders,
// builds a PDF and opens it so you can see that everything works.
// Uses only Node built-ins, so it runs before `npm install`.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const run = (args) => spawnSync(npm, args, { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' }).status === 0;

const [major] = process.versions.node.split('.').map(Number);
if (major < 18) {
  console.error(`✗ Node.js ${process.versions.node} is too old. Install Node.js 18 or later from https://nodejs.org`);
  process.exit(1);
}

console.log('1/3 Installing dependencies and Chromium (the first time takes a few minutes)…\n');
if (!run(['install'])) {
  console.error(`
✗ The install failed. Common fixes:
  - Check your internet connection and run npm run setup again.
  - If the error mentions Chromium or Playwright, run: npx playwright install chromium`);
  process.exit(1);
}

console.log('\n2/3 Creating your personal folders…');
for (const dir of ['profile', 'profile/cover-letters', 'profile/old-resumes', 'applications']) {
  mkdirSync(path.join(ROOT, dir), { recursive: true });
  console.log(`  ${dir}/`);
}

console.log('\n3/3 Building a test PDF…\n');
if (!run(['run', 'generate'])) {
  console.error('\n✗ The PDF could not be built. Try: npx playwright install chromium, then npm run setup again.');
  process.exit(1);
}

// Open the PDF that was just built: your base resume, or the sample while there is none.
const built = existsSync(path.join(ROOT, 'profile', 'resume-base.md'))
  ? path.join(ROOT, 'profile', 'resume-base.pdf')
  : path.join(ROOT, 'build', 'sample-resume.pdf');
if (existsSync(built)) {
  const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  spawnSync(opener, process.platform === 'win32' ? ['""', `"${built}"`] : [built], { shell: process.platform === 'win32', stdio: 'ignore' });
}

console.log(`
✔ All set.

Next steps:
  1. Put your files in profile/:
       profile/                ← your LinkedIn profile PDF and your current resume
       profile/old-resumes/    ← your older resumes
       profile/cover-letters/  ← your past cover letters
  2. Ask Claude Code "Create my base resume from my profile files", or run npm run import.
     (No files? Copy examples/sample-resume.md to profile/resume-base.md and edit it.)
  3. For each job you apply to, paste the posting in the Claude Code chat, or run npm run job.
`);
