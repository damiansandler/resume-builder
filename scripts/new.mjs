#!/usr/bin/env node
// Creates a new resume version by copying the newest one in resumes/ (or the one given).
//
// Usage: npm run new -- <label> [from]
//   npm run new -- empresa-x          → resumes/<today>-empresa-x.md, copied from the newest version
//   npm run new -- pm 2020-04-23      → copied from the version whose name contains "2020-04-23"
// If the footer is a date like "April 23, 2020", it is updated to today's date.
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { RESUMES_DIR, resolveResume } from '../src/versions.js';

const [label, from] = process.argv.slice(2);
const source = resolveResume(from);
const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
const slug = (label ?? (path.basename(source, '.md').replace(/^\d{4}-\d{2}-\d{2}-?/, '') || 'resume'))
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');
const target = path.join(RESUMES_DIR, `${today}-${slug}.md`);

if (existsSync(target)) {
  console.error(`✗ ${path.relative(process.cwd(), target)} already exists. Pick another label.`);
  process.exit(1);
}

await mkdir(RESUMES_DIR, { recursive: true });
await copyFile(source, target);
const text = await readFile(target, 'utf8');
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dateFooter = new RegExp(`^(footer:\\s*)(${months.join('|')}) \\d{1,2}, \\d{4}\\s*$`, 'm');
let note = '';
if (dateFooter.test(text)) {
  const newDate = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
  await writeFile(target, text.replace(dateFooter, `$1${newDate}`));
  note = ` (footer date set to ${newDate})`;
}
console.log(`✔ Created ${path.relative(process.cwd(), target)} from ${path.basename(source)}${note}`);
console.log(`  Edit it, then run: npm run generate`);
