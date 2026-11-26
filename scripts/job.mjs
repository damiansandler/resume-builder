#!/usr/bin/env node
// Saves a job posting: asks for the company, role and link, then reads the pasted text of the posting.
// Creates applications/<today>-<company>-<role>/job.md.
// If the link was already saved, it says where and stops.
//
// Usage: npm run job
import { createInterface } from 'node:readline';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { findByLink, jobMarkdown } from '../src/jobs.js';
import { APPLICATIONS_DIR, fail, findApplications, rel, slug, today } from '../src/paths.js';

const input = lineReader();
const ask = async (question) => {
  process.stdout.write(question);
  const answer = await input.next();
  if (!process.stdin.isTTY) process.stdout.write(`${answer ?? ''}\n`);
  return (answer ?? '').trim();
};

const company = await ask('Company: ');
if (!slug(company)) fail('The company name is needed (it names the folder).');
const role = await ask('Role: ');
const link = await ask('Link (Enter if you have none): ');

const existing = findByLink(link);
if (existing) fail(`You already saved this posting: ${rel(existing)}/`);

console.log('\nPaste the full text of the posting, then press Enter and Ctrl+D:\n');
const offer = (await input.rest()).trim();
if (!offer) fail('No text was pasted, nothing was saved.');
if (offer.length < 200) console.warn('\n⚠ The text looks short. Paste the full posting so the analysis has everything.');

const name = [today(), slug(company), slug(role)].filter(Boolean).join('-').slice(0, 80).replace(/-$/, '');
let dir = path.join(APPLICATIONS_DIR, name);
for (let i = 2; existsSync(dir); i++) dir = path.join(APPLICATIONS_DIR, `${name}-${i}`);
await mkdir(dir, { recursive: true });
await writeFile(path.join(dir, 'job.md'), jobMarkdown({ company, role, link, saved: today(), offer }));

// The shortest name that finds this folder in later commands.
const short = findApplications(slug(company)).length === 1 ? slug(company) : path.basename(dir);
console.log(`\n✔ Saved in ${rel(dir)}/job.md`);
console.log(`
Next:
  npm run match -- ${short}   compare your base resume with this posting (needs an API key)
  npm run new -- ${short}     create your resume for it, copied from your base`);

/** Reads stdin line by line, whether typed, pasted or piped. */
function lineReader() {
  const rl = createInterface({ input: process.stdin, terminal: false });
  const lines = [];
  const waiting = [];
  let closed = false;
  rl.on('line', (line) => (waiting.length ? waiting.shift()(line) : lines.push(line)));
  rl.on('close', () => {
    closed = true;
    while (waiting.length) waiting.shift()(null);
  });
  return {
    next: () => (lines.length ? Promise.resolve(lines.shift()) : closed ? Promise.resolve(null) : new Promise((r) => waiting.push(r))),
    rest: () =>
      new Promise((resolve) => {
        if (closed) return resolve(lines.splice(0).join('\n'));
        rl.on('close', () => resolve(lines.splice(0).join('\n')));
      }),
  };
}
