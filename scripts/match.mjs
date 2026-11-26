#!/usr/bin/env node
// Compares your resume with a saved job posting using Claude, following match/criteria.md (the same
// file Claude follows in the chat).
//
// Usage:
//   npm run match -- cartify   → the application whose folder name contains "cartify"
//   npm run match            → the newest application
//
// First run: scores your BASE resume (profile/resume-base.md) against applications/<…>/job.md and
// writes applications/<…>/match.md.
// Once the application has its own resume.md: scores that tailored version and adds a
// "Tailored version" section to match.md (base score → tailored score).
// Also reads profile/ (LinkedIn, old resumes, cover letters, experience.md).
//
// Needs ANTHROPIC_API_KEY, set in a .env file at the project root (see README).
import { existsSync, readFileSync } from 'node:fs';
import { rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { askClaude, requireApiKey } from '../src/claude.js';
import { SUPPORTED, listMaterial, materialBlocks } from '../src/files.js';
import { readJob } from '../src/jobs.js';
import { missingAcrossOffers } from '../src/keywords.js';
import { BASE_RESUME, COVER_LETTERS_DIR, EXPERIENCE, PROFILE_DIR, fail, latestApplication, rel, resolveApplication, slug, sourceFiles, today as todayDate } from '../src/paths.js';
import { ROOT } from '../src/render.js';

const arg = process.argv[2];
const dir = arg ? resolveApplication(arg) : latestApplication();
const short = arg ?? path.basename(dir);
const job = readJob(dir);
if (!job?.offer) fail(`${rel(dir)} has no job posting (job.md). Save one with npm run job, or paste the posting in that file.`);
if (job.offer.length < 200) fail(`The posting in ${rel(dir)}/job.md looks too short. Paste the full text there.`);
if (!existsSync(BASE_RESUME)) fail('There is no base resume yet (profile/resume-base.md). Create it with npm run import.');
requireApiKey(`Compare my base resume with the job in ${rel(dir)}`);

const matchPath = path.join(dir, 'match.md');
const tailoredPath = path.join(dir, 'resume.md');
const hasAnalysis = existsSync(matchPath);
const tailoring = hasAnalysis && existsSync(tailoredPath);
const today = todayDate();

const criteria = readFileSync(path.join(ROOT, 'match', 'criteria.md'), 'utf8');
const base = readFileSync(BASE_RESUME, 'utf8');
const sources = sourceFiles().filter((f) => SUPPORTED.test(f));
const letters = listMaterial(COVER_LETTERS_DIR).files;
const notes = existsSync(EXPERIENCE) ? readFileSync(EXPERIENCE, 'utf8').trim() : '';
const posting = [job.meta.role && `Role: ${job.meta.role}`, job.meta.company && `Company: ${job.meta.company}`, job.meta.link && `Link: ${job.meta.link}`, '', job.offer]
  .filter((l) => l !== undefined && l !== false && l !== null)
  .join('\n');

const material = [
  ...(await materialBlocks(sources, 'profile', PROFILE_DIR)),
  ...(await materialBlocks(letters, 'profile/cover-letters')),
];
const context = [
  sources.length ? '' : 'No source material (LinkedIn, old resumes) in profile/.',
  letters.length ? '' : 'No cover letters provided.',
  notes ? `<experience_notes file="profile/experience.md">\n${notes}\n</experience_notes>` : 'No experience notes provided.',
  `<job_offer>\n${posting.trim()}\n</job_offer>`,
];

let system;
let content;
if (tailoring) {
  system = `You score a tailored resume against a job offer, following the scoring criteria below exactly.
Reply only with the "Tailored version" section described in "Scoring a tailored version", starting with its heading.

${criteria}`;
  content = [
    { type: 'text', text: `Today's date: ${today}\n\n<base_resume file="profile/resume-base.md">\n${base}\n</base_resume>\n\n<tailored_resume file="${rel(tailoredPath)}">\n${readFileSync(tailoredPath, 'utf8')}\n</tailored_resume>\n\n<base_analysis file="${rel(matchPath)}">\n${readFileSync(matchPath, 'utf8')}\n</base_analysis>` },
    ...material,
    { type: 'text', text: context.filter(Boolean).join('\n\n') },
  ];
} else {
  system = `You compare a candidate's resume with a job offer and write an analysis in Markdown.
Follow the scoring criteria below exactly, including the output format. Reply with the analysis only,
starting with the "# <Role> · <Company>" heading. Leave out the "Missing in several offers" section: the
script adds it.

${criteria}`;
  content = [
    { type: 'text', text: `Today's date: ${today}\n\n<resume file="profile/resume-base.md">\n${base}\n</resume>` },
    ...material,
    { type: 'text', text: context.filter(Boolean).join('\n\n') },
  ];
}

const extras = [sources.length && `${sources.length} source files`, letters.length && `${letters.length} cover letters`, notes && 'experience notes'].filter(Boolean);
const what = tailoring ? `your tailored resume (${rel(tailoredPath)})` : 'your base resume';
console.log(`Comparing ${what} with ${rel(dir)}/job.md${extras.length ? ` (+ ${extras.join(', ')})` : ''}…`);
console.log('This usually takes one or two minutes.\n');

const reply = await askClaude({ system, content });

if (tailoring) {
  // Replace any earlier "Tailored version" section, keep the base analysis above it.
  const previous = readFileSync(matchPath, 'utf8').split(/^## Tailored version\b.*$/m)[0].trimEnd();
  await writeFile(matchPath, `${previous}\n\n${reply.trim()}\n`);
  const line = reply.match(/^\*\*Total:.*$/m)?.[0].replace(/\*\*/g, '');
  console.log(`✔ ${line ?? 'Tailored version scored'}`);
  console.log(`  Added to ${rel(matchPath)}`);
  const unsupported = reply.split(/^\*\*Not supported by your files:\*\*/m)[1]?.split(/^\*\*|^##/m)[0].trim();
  if (unsupported && !/^none\.?$/i.test(unsupported)) {
    console.log(`\n⚠ Lines in the tailored resume that your files do not support:\n${unsupported.replace(/^/gm, '  ')}`);
  }
  process.exit(0);
}

// Base analysis. Keywords that are also missing in other recent offers point at what the base lacks.
const repeated = missingAcrossOffers({ analysis: reply, exclude: dir, base });
const section = repeated.length
  ? `\n\n## Missing in several offers\n\nKeywords missing from your base resume in this posting and in other recent ones. If you have the\nexperience, add them to the base, not only to one tailored version.\n\n${repeated.map((k) => `- **${k.keyword}**: ${k.count} offers (${k.where.join(', ')})`).join('\n')}`
  : '';
if (hasAnalysis) {
  const old = path.join(dir, `match-${today}-old.md`);
  await rename(matchPath, old);
  console.log(`ℹ The previous analysis was kept as ${rel(old)}`);
}
await writeFile(matchPath, `${reply.trim()}${section}\n`);

const total = reply.match(/^##\s+Total:.*$/m)?.[0].replace(/^##\s+/, '');
console.log(`✔ ${total ?? 'Analysis ready'}`);
console.log(`  Saved to ${rel(matchPath)}`);
const questions = reply.split(/^##\s+Questions for you\s*$/m)[1]?.split(/^##\s/m)[0].trim();
if (questions) {
  console.log('\nQuestions for you (answering them can raise the score):\n');
  console.log(questions.replace(/^/gm, '  '));
  console.log('\n  Answer them in the Claude Code chat, or write the answers in profile/experience.md and run npm run match again.');
}
if (repeated.length) {
  console.log(`\nAlso missing in other offers: ${repeated.map((k) => `${k.keyword} (${k.count})`).join(' · ')}`);
}
console.log(`\n  To tailor your resume: npm run new -- ${slug(short) || short}`);
