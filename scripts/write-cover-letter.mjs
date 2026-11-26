#!/usr/bin/env node
// Drafts the cover letter of an application with Claude, following .claude/skills/cover-letter/SKILL.md
// (the same instructions Claude follows in the chat). Writes applications/<…>/cover-letter.md and builds
// its PDF.
//
// Usage: npm run write-cover-letter -- cartify   → the application whose folder name contains "cartify"
//        npm run write-cover-letter            → the newest application
//
// Needs ANTHROPIC_API_KEY, set in a .env file at the project root (see README).
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { askClaude, requireApiKey } from '../src/claude.js';
import { SUPPORTED, listMaterial, materialBlocks } from '../src/files.js';
import { readJob } from '../src/jobs.js';
import { BASE_RESUME, COVER_LETTERS_DIR, EXPERIENCE, PROFILE_DIR, fail, latestApplication, rel, resolveApplication, sourceFiles, today } from '../src/paths.js';
import { ROOT } from '../src/render.js';

const arg = process.argv[2];
const dir = arg ? resolveApplication(arg) : latestApplication();
const short = arg ?? path.basename(dir);
const job = readJob(dir);
if (!job?.offer || job.offer.length < 200) {
  fail(`${rel(dir)}/job.md has no posting text. A cover letter needs the full posting: paste it in that file.`);
}
const resumePath = existsSync(path.join(dir, 'resume.md')) ? path.join(dir, 'resume.md') : BASE_RESUME;
if (!existsSync(resumePath)) fail('There is no base resume yet (profile/resume-base.md). Create it with npm run import.');
requireApiKey(`Write the cover letter for ${short}`);

const skill = readFileSync(path.join(ROOT, '.claude', 'skills', 'cover-letter', 'SKILL.md'), 'utf8').replace(/^---[\s\S]*?---\s*/, '');
const read = (file) => (existsSync(file) ? readFileSync(file, 'utf8').trim() : '');
const letters = listMaterial(COVER_LETTERS_DIR).files;
const sources = sourceFiles().filter((f) => SUPPORTED.test(f));
const analysis = read(path.join(dir, 'match.md'));
const notes = read(EXPERIENCE);

const system = `You write cover letters in the candidate's own voice. Follow these instructions exactly.

<instructions>
${skill}
</instructions>`;

const content = [
  ...(await materialBlocks(letters, 'profile/cover-letters')),
  ...(await materialBlocks(sources, 'profile', PROFILE_DIR)),
  {
    type: 'text',
    text: [
      `Today's date: ${today()}. Application folder: ${rel(dir)}.`,
      letters.length ? '' : 'The candidate has no past cover letters: use the default structure.',
      `<resume file="${rel(resumePath)}">\n${read(resumePath)}\n</resume>`,
      notes ? `<experience_notes file="profile/experience.md">\n${notes}\n</experience_notes>` : 'No experience notes.',
      analysis ? `<analysis file="${rel(dir)}/match.md">\n${analysis}\n</analysis>` : 'No analysis of this posting yet.',
      `<job_offer file="${rel(dir)}/job.md">\n${[job.meta.role && `Role: ${job.meta.role}`, job.meta.company && `Company: ${job.meta.company}`, '', job.offer].filter((l) => typeof l === 'string').join('\n')}\n</job_offer>`,
      'Write the cover letter. Reply in the "Reply format for npm run write-cover-letter".',
    ]
      .filter(Boolean)
      .join('\n\n'),
  },
];

console.log(`Writing the cover letter for ${rel(dir)}${letters.length ? ` in the voice of your ${letters.length} past letters` : ''}…`);
console.log('This usually takes one or two minutes.\n');
const reply = await askClaude({ system, content });
const block = (tag) => reply.match(new RegExp(`<${tag}>\\s*([\\s\\S]*?)\\s*</${tag}>`))?.[1]?.trim() ?? '';

const letter = block('letter').replace(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```$/, '$1');
if (!letter) fail('Claude did not return a letter in the expected format. Try again, or ask in the Claude Code chat.');
const target = path.join(dir, 'cover-letter.md');
if (existsSync(target)) {
  const old = path.join(dir, `cover-letter-${today()}-old.md`);
  await rename(target, old);
  console.log(`ℹ The previous letter was kept as ${rel(old)}`);
}
await writeFile(target, letter + '\n');
console.log(`✔ Draft saved to ${rel(target)}\n`);

const facts = block('facts');
if (facts) console.log(`Facts used and where they come from:\n${facts.replace(/^/gm, '  ')}\n`);
const check = block('check');
if (check && !/^nothing\.?$/i.test(check)) console.log(`⚠ Check before sending:\n${check.replace(/^/gm, '  ')}\n`);

spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'cover-letter.mjs'), dir], { stdio: 'inherit' });
console.log(`\nEdit ${rel(target)} if you want, then rebuild the PDF: npm run cover-letter -- ${short}`);
