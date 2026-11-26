#!/usr/bin/env node
// Creates the tailored resume of an application by copying your base resume into its folder.
//
// Usage: npm run new -- <application name>
//   npm run new -- cartify   → applications/<…cartify…>/resume.md, copied from profile/resume-base.md
// If no application matches the name, a new folder applications/<today>-<name>/ is created.
// If the footer is a date like "April 23, 2026", it is updated to today's date.
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { APPLICATIONS_DIR, BASE_RESUME, fail, findApplications, rel, slug, today } from '../src/paths.js';

const name = process.argv[2];
if (!name) fail('Name the application: npm run new -- <company>   (for example: npm run new -- cartify)');
if (!existsSync(BASE_RESUME)) {
  fail('There is no base resume yet (profile/resume-base.md).\n  Create it from your files with npm run import, or copy examples/sample-resume.md there and edit it.');
}

const matches = findApplications(name);
if (matches.length > 1) {
  fail(`"${name}" matches several applications, be more specific:\n${matches.map((d) => `  ${path.basename(d)}`).join('\n')}`);
}
let dir = matches[0];
let created = false;
if (!dir) {
  if (!slug(name)) fail(`"${name}" cannot be used as a folder name. Use letters or numbers.`);
  dir = path.join(APPLICATIONS_DIR, `${today()}-${slug(name)}`);
  created = true;
}
const target = path.join(dir, 'resume.md');
if (existsSync(target)) fail(`${rel(target)} already exists. Edit it, or delete it first to start again from your base.`);

await mkdir(dir, { recursive: true });
let text = await readFile(BASE_RESUME, 'utf8');
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dateFooter = new RegExp(`^(footer:\\s*)(${months.join('|')}) \\d{1,2}, \\d{4}\\s*$`, 'm');
let note = '';
if (dateFooter.test(text)) {
  const now = new Date();
  const newDate = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
  text = text.replace(dateFooter, `$1${newDate}`);
  note = ` (footer date set to ${newDate})`;
}
await writeFile(target, text);

const short = slug(name);
if (created) console.log(`✔ Created the application folder ${rel(dir)}/ (no job posting saved yet: npm run job)`);
console.log(`✔ ${rel(target)} created from your base resume${note}`);
console.log(`  Tailor it, then: npm run preview -- ${short}   and   npm run generate -- ${short}`);
