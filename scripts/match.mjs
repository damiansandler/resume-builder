#!/usr/bin/env node
// Compares a resume with a job offer using Claude and saves the analysis to matches/.
// The scoring rules live in match/criteria.md (the same file Claude follows in the chat).
//
// Usage:
//   npm run match                          → paste the offer, then press Ctrl+D
//   npm run match -- offer.txt             → read the offer from a file
//   npm run match -- offer.txt 2020-04-23  → compare with another resume version
// Also reads sources/ (LinkedIn profile, older resumes), cover-letters/ and notes/experience.md
// when they exist.
//
// Needs ANTHROPIC_API_KEY, set in a .env file at the project root (see README).
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { askClaude, requireApiKey, slug, today as todayDate } from '../src/claude.js';
import { listMaterial, materialBlocks } from '../src/files.js';
import { ROOT } from '../src/render.js';
import { resolveResume } from '../src/versions.js';

const rel = (p) => path.relative(process.cwd(), p);
requireApiKey('Compare my latest resume with this job: <paste the offer>');

const [offerArg, resumeArg] = process.argv.slice(2);
const resumePath = resolveResume(resumeArg);
const offer = offerArg ? readFileSync(path.resolve(offerArg), 'utf8') : await readPastedOffer();
if (offer.trim().length < 200) {
  console.error('✗ The offer looks too short. Paste the full job description (or pass a text file).');
  process.exit(1);
}

const criteria = readFileSync(path.join(ROOT, 'match', 'criteria.md'), 'utf8');
const resume = readFileSync(resumePath, 'utf8');
const coverLetters = listMaterial(path.join(ROOT, 'cover-letters')).files;
const sources = listMaterial(path.join(ROOT, 'sources')).files;
const notesPath = path.join(ROOT, 'notes', 'experience.md');
const notes = existsSync(notesPath) ? readFileSync(notesPath, 'utf8').trim() : '';
const today = todayDate();

const system = `You compare a candidate's resume with a job offer and write an analysis in Markdown.
Follow the scoring criteria below exactly, including the output format. Reply with the analysis only,
starting with the "# <Role> · <Company>" heading.

${criteria}`;

const content = [
  { type: 'text', text: `Today's date: ${today}\n\n<resume file="${path.basename(resumePath)}">\n${resume}\n</resume>` },
  ...(await materialBlocks(sources, 'sources')),
  ...(await materialBlocks(coverLetters, 'cover-letters')),
  {
    type: 'text',
    text: [
      sources.length ? '' : 'No source material (sources/) provided.',
      coverLetters.length ? '' : 'No cover letters provided.',
      notes ? `<experience_notes>\n${notes}\n</experience_notes>` : 'No experience notes provided.',
      `<job_offer>\n${offer.trim()}\n</job_offer>`,
    ]
      .filter(Boolean)
      .join('\n\n'),
  },
];

const extras = [
  sources.length && `${sources.length} source files`,
  coverLetters.length && `${coverLetters.length} cover letters`,
  notes && 'experience notes',
].filter(Boolean);
console.log(`Comparing ${rel(resumePath)} with the offer${extras.length ? ` (+ ${extras.join(', ')})` : ''}…`);
console.log('This usually takes one or two minutes.\n');

const analysis = await askClaude({ system, content });

// File name from the "# Role · Company" heading.
const heading = analysis.match(/^#\s+(.+)$/m)?.[1] ?? 'job-offer';
const [role, company] = heading.split('·').map((s) => s.trim());
const name = [today, slug(company), slug(role)].filter(Boolean).join('-').slice(0, 90);
const outDir = path.join(ROOT, 'matches');
await mkdir(outDir, { recursive: true });
let outPath = path.join(outDir, `${name}.md`);
for (let i = 2; existsSync(outPath); i++) outPath = path.join(outDir, `${name}-${i}.md`);
await writeFile(outPath, analysis + '\n');

const total = analysis.match(/^##\s+Total:.*$/m)?.[0].replace(/^##\s+/, '');
console.log(`✔ ${total ?? 'Analysis ready'}`);
console.log(`  Saved to ${rel(outPath)}`);
const questions = analysis.split(/^##\s+Questions for you\s*$/m)[1]?.split(/^##\s/m)[0].trim();
if (questions) {
  console.log('\nQuestions for you (answering them can raise the score):\n');
  console.log(questions.replace(/^/gm, '  '));
  console.log('\n  Answer them in the Claude Code chat, or write the answers in notes/experience.md and run npm run match again.');
}
if (company) console.log(`\n  To tailor your resume: npm run new -- ${slug(company)}`);

// --- helpers ---

async function readPastedOffer() {
  if (process.stdin.isTTY) {
    console.log('Paste the job offer below, then press Enter and Ctrl+D:\n');
  }
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  console.log('');
  return Buffer.concat(chunks).toString('utf8');
}
